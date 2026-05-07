import * as path from 'node:path';
import * as fs from 'node:fs';
import { loadSchema, ArtifactGraph, detectCompleted } from '../core/artifact-graph/index.js';
import { TaskGraphManager } from './task-graph.js';
import { ProfileManager } from './profile-manager.js';
import { SharedStateStore } from '../memory/shared-state-store.js';
import { getAgentForStage, getAgentsForStage } from './loader.js';
import type { AgentDefinition } from './types.js';

/**
 * Orchestrator - the central coordinator for program execution
 */
export class Orchestrator {
  private taskGraph: TaskGraphManager;
  private profileManager: ProfileManager;
  private shared: SharedStateStore;

  constructor(private projectRoot: string) {
    this.taskGraph = new TaskGraphManager(projectRoot);
    this.profileManager = new ProfileManager(projectRoot);
    this.shared = new SharedStateStore(projectRoot);
  }

  /**
   * Get the agent definition for a specific stage
   */
  getAgentForStage(stage: string): AgentDefinition | null {
    return getAgentForStage(stage, this.projectRoot);
  }

  /**
   * Get all agent definitions for a specific stage
   */
  getAllAgentsForStage(stage: string): AgentDefinition[] {
    return getAgentsForStage(stage, this.projectRoot);
  }

  /**
   * Execute a stage with the appropriate agent
   */
  async executeStage(
    programName: string,
    stage: string,
    options: { dryRun?: boolean; context?: Record<string, unknown> } = {}
  ): Promise<ExecutionResult> {
    const agent = this.getAgentForStage(stage);
    const agentName = agent?.name ?? stage;
    const profile = this.profileManager.loadProfile(programName);

    console.log(`\n[Orchestrator] Executing stage: ${stage}`);
    console.log(`[Orchestrator] Agent: ${agentName}`);

    if (options.dryRun) {
      console.log('[Orchestrator] Dry run - skipping actual execution');
      return {
        stage,
        agent: agentName,
        status: 'pending',
        message: 'Dry run - execution skipped',
      };
    }

    await this.shared.set(
      `programs/${programName}/current-stage`,
      { stage, agent: agentName, status: 'running' },
      'orchestrator'
    );

    const schema = loadSchema('spec-driven', this.projectRoot);
    const artifact = schema.artifacts.find(a => a.id === stage);
    if (artifact) {
      const artifactPath = path.join(
        this.projectRoot,
        'programs',
        programName,
        'artifacts',
        artifact.generates
      );
      if (fs.existsSync(artifactPath)) {
        const content = fs.readFileSync(artifactPath, 'utf-8');

        if (stage === 'evaluation') {
          const hasFailed = this.isEvaluationFailed(content);
          if (hasFailed) {
            await this.shared.set(
              `programs/${programName}/current-stage`,
              { stage, agent: agentName, status: 'failed' },
              'orchestrator'
            );
            return {
              stage,
              agent: agentName,
              status: 'failed',
              message: `Evaluation failed: not all success criteria met. Artifact: ${artifact.generates}`,
              context: options.context,
            };
          }
        }

        await this.shared.set(
          `programs/${programName}/current-stage`,
          { stage, agent: agentName, status: 'completed' },
          'orchestrator'
        );
        return {
          stage,
          agent: agentName,
          status: 'completed',
          message: `Artifact already exists: ${artifact.generates}`,
          context: options.context,
        };
      }
    }

    const overrides = this.profileManager.loadAgentOverrides(programName);
    const override = overrides.find(o => o.name === agentName);

    const context = {
      programName,
      stage,
      agent: agentName,
      agentDefinition: agent,
      profile,
      overrides: override,
      ...options.context,
    };

    return {
      stage,
      agent: agentName,
      status: 'pending',
      message: `Stage "${stage}" is ready to execute with ${agentName}`,
      context,
    };
  }

  /**
   * Check if evaluation content indicates failure
   */
  private isEvaluationFailed(content: string): boolean {
    const lower = content.toLowerCase();

    // JSON format: "goalAchieved": false
    if (lower.includes('"goalachieved":false') || lower.includes('"goalachieved": false')) {
      return true;
    }

    // Markdown format: Overall indicates failure - supports multiple formats
    // Format: "overall: 2/3 metrics achieved (67%)"
    // Format: "overall: 2 of 3 metrics achieved (67%)"
    // Format: "overall: 2/3 (67%)"
    const overallMatch = lower.match(/overall:\s*(\d+)\s*[\/of]\s*(\d+)\s*(?:metrics?)?\s*(?:achieved)?\s*\((\d+)%\)/);
    if (overallMatch) {
      const percentage = parseInt(overallMatch[3], 10);
      if (percentage < 100) return true;
    }

    // Format: "overall: 2/3 metrics" (without percentage)
    const overallNMatch = lower.match(/overall:\s*(\d+)\s*\/\s*(\d+)\s*metrics?/);
    if (overallNMatch) {
      const achieved = parseInt(overallNMatch[1], 10);
      const total = parseInt(overallNMatch[2], 10);
      if (achieved < total) return true;
    }

    // Explicit fail/failure marker
    if (/status:\s*fail(ed)?/i.test(content)) return true;
    if (/##\s*overall\s*\n+\s*fail/i.test(content)) return true;

    return false;
  }

  /**
   * Run all stages with feedback loop support
   */
  async runProgram(
    programName: string,
    options: { dryRun?: boolean; fromStage?: string; maxRetries?: number } = {}
  ): Promise<ExecutionSummary> {
    const schema = loadSchema('spec-driven', this.projectRoot);
    const stages = schema.artifacts.map(a => a.id);
    const maxRetries = options.maxRetries ?? 3;

    // Find starting stage
    let currentStageIndex = 0;
    if (options.fromStage) {
      const idx = stages.indexOf(options.fromStage);
      if (idx >= 0) currentStageIndex = idx;
    }

    const results: ExecutionResult[] = [];
    const retryCounts: Record<string, number> = {};

    while (currentStageIndex < stages.length) {
      const stage = stages[currentStageIndex];

      try {
        const result = await this.executeStage(programName, stage, { dryRun: options.dryRun });
        results.push(result);

        if (result.status === 'failed') {
          // Check if this is the evaluation stage - support feedback loop
          if (stage === 'evaluation') {
            const retryCount = retryCounts['evaluation'] ?? 0;
            if (retryCount < maxRetries) {
              // Loop back to planning stage
              console.log(`[Orchestrator] Evaluation failed. Looping back to planning (retry ${retryCount + 1}/${maxRetries}).`);
              retryCounts['evaluation'] = retryCount + 1;
              currentStageIndex = stages.indexOf('planning');
              continue;
            } else {
              console.log(`[Orchestrator] Max retries reached for evaluation. Stopping.`);
              break;
            }
          } else {
            // For other stages, stop execution
            console.log(`[Orchestrator] Stage "${stage}" failed. Stopping.`);
            break;
          }
        }
      } catch (error) {
        const agent = this.getAgentForStage(stage);
        results.push({
          stage,
          agent: agent?.name ?? stage,
          status: 'failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        break;
      }

      currentStageIndex++;
    }

    // Calculate summary
    const completed = results.filter(r => r.status === 'completed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const pending = results.filter(r => r.status === 'pending').length;

    return {
      programName,
      totalStages: stages.length,
      completed,
      failed,
      pending,
      results,
    };
  }

  /**
   * Get the next ready stage (first artifact not yet completed whose dependencies are met)
   */
  getNextReadyStage(programName: string): { stage: string | null; isComplete: boolean } {
    const schema = loadSchema('spec-driven', this.projectRoot);
    const graph = ArtifactGraph.fromYaml(schema);
    const programDir = path.join(this.projectRoot, 'programs', programName);
    const completed = detectCompleted(graph, programDir);

    if (graph.isComplete(completed)) {
      return { stage: null, isComplete: true };
    }

    const nextArtifacts = graph.getNextArtifacts(completed);
    return {
      stage: nextArtifacts.length > 0 ? nextArtifacts[0] : null,
      isComplete: false,
    };
  }

  /**
   * Get current execution state
   */
  async getExecutionState(programName: string): Promise<ExecutionState> {
    const current = await this.shared.get(`programs/${programName}/current-stage`);
    const progress = await this.taskGraph.getProgress(programName);

    return {
      programName,
      currentStage: (current as { stage?: string })?.stage || null,
      progress,
      lastUpdated: new Date().toISOString(),
    };
  }
}

export interface ExecutionResult {
  stage: string;
  agent: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message?: string;
  context?: Record<string, unknown>;
}

export interface ExecutionSummary {
  programName: string;
  totalStages: number;
  completed: number;
  failed: number;
  pending: number;
  results: ExecutionResult[];
}

export interface ExecutionState {
  programName: string;
  currentStage: string | null;
  progress: { total: number; completed: number; failed: number };
  lastUpdated: string;
}
