import * as path from 'node:path';
import * as fs from 'node:fs';
import { loadSchema } from '../core/artifact-graph/index.js';
import { TaskGraphManager } from './task-graph.js';
import { ProfileManager } from './profile-manager.js';
import { SharedStateStore } from '../memory/shared-state-store.js';

/**
 * Stage to Agent mapping
 */
const STAGE_AGENTS: Record<string, string> = {
  intent: 'intent-agent',
  modeling: 'modeling-agent',
  planning: 'planner-agent',
  execution: 'coder-agent',
  evaluation: 'evaluation-agent',
  learning: 'reflection-agent',
  evolution: 'evolution-agent',
};

const STAGE_ADDITIONAL_AGENTS: Record<string, string[]> = {
  planning: ['architect-agent'],
  execution: ['qa-agent', 'reviewer-agent'],
};

function getAgentsForStageFn(stage: string): string[] {
  const primary = STAGE_AGENTS[stage];
  if (!primary) return ['coder-agent'];
  const additional = STAGE_ADDITIONAL_AGENTS[stage] || [];
  return [primary, ...additional];
}

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
   * Get the agent for a specific stage
   */
  getAgentForStage(stage: string): string {
    return STAGE_AGENTS[stage] || 'coder-agent';
  }

  getAllAgentsForStage(stage: string): string[] {
    return getAgentsForStageFn(stage);
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
    const profile = this.profileManager.loadProfile(programName);

    console.log(`\n[Orchestrator] Executing stage: ${stage}`);
    console.log(`[Orchestrator] Agent: ${agent}`);

    if (options.dryRun) {
      console.log('[Orchestrator] Dry run - skipping actual execution');
      return {
        stage,
        agent,
        status: 'pending',
        message: 'Dry run - execution skipped',
      };
    }

    await this.shared.set(
      `programs/${programName}/current-stage`,
      { stage, agent, status: 'running' },
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
        await this.shared.set(
          `programs/${programName}/current-stage`,
          { stage, agent, status: 'completed' },
          'orchestrator'
        );
        return {
          stage,
          agent,
          status: 'completed',
          message: `Artifact already exists: ${artifact.generates}`,
          context: options.context,
        };
      }
    }

    const agentConfigPath = path.join(this.projectRoot, '.programspec', 'agents', agent, 'config.json');
    let agentConfig: Record<string, unknown> = {};
    if (fs.existsSync(agentConfigPath)) {
      agentConfig = JSON.parse(fs.readFileSync(agentConfigPath, 'utf-8'));
    }

    const overrides = this.profileManager.loadAgentOverrides(programName);
    const override = overrides.find(o => o.name === agent);

    const context = {
      programName,
      stage,
      agent,
      profile,
      agentConfig,
      overrides: override,
      ...options.context,
    };

    return {
      stage,
      agent,
      status: 'pending',
      message: `Stage "${stage}" is ready to execute with ${agent}`,
      context,
    };
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
    const executedStages = new Set<string>();

    while (currentStageIndex < stages.length) {
      const stage = stages[currentStageIndex];

      try {
        const result = await this.executeStage(programName, stage, { dryRun: options.dryRun });
        results.push(result);
        executedStages.add(stage);

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
        results.push({
          stage,
          agent: this.getAgentForStage(stage),
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