import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadSchema } from '../core/artifact-graph/index.js';
import { ArtifactGraph } from '../core/artifact-graph/graph.js';
import { EpisodicStore } from '../memory/episodic-store.js';
import { SharedStateStore } from '../memory/shared-state-store.js';

/**
 * Task Graph - represents the execution DAG for a program
 */
export interface TaskNode {
  id: string;
  type: string;
  goal: string;
  agent?: string;
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  error?: string;
  startTime?: string;
  endTime?: string;
}

export interface TaskGraph {
  programName: string;
  nodes: Record<string, TaskNode>;
  executionOrder: string[];
  currentNode?: string;
}

/**
 * Task Graph Manager - handles task graph creation and execution
 */
export class TaskGraphManager {
  private projectRoot: string;
  private episodic: EpisodicStore;
  private shared: SharedStateStore;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.episodic = new EpisodicStore(projectRoot);
    this.shared = new SharedStateStore(projectRoot);
  }

  /**
   * Load task graph from planning.md
   */
  async loadFromPlanning(programName: string): Promise<TaskGraph> {
    const programDir = path.join(this.projectRoot, 'programs', programName);
    const planningPath = path.join(programDir, 'artifacts', 'planning.md');

    if (!fs.existsSync(planningPath)) {
      throw new Error(`Planning not found: ${planningPath}`);
    }

    // For now, generate a simple task graph from the schema
    // In the future, this could parse planning.md for actual tasks
    const schema = loadSchema('spec-driven', this.projectRoot);
    const nodes: Record<string, TaskNode> = {};

    for (const artifact of schema.artifacts) {
      nodes[artifact.id] = {
        id: artifact.id,
        type: artifact.id,
        goal: artifact.description,
        dependencies: artifact.requires,
        status: 'pending',
      };
    }

    const graph = ArtifactGraph.fromYaml(schema);
    const executionOrder = graph.getBuildOrder();

    return {
      programName,
      nodes,
      executionOrder,
    };
  }

  /**
   * Save task graph
   */
  async saveGraph(programName: string, graph: TaskGraph): Promise<void> {
    const graphDir = path.join(this.projectRoot, 'programs', programName, 'task-graph');
    await fs.promises.mkdir(graphDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(graphDir, 'graph.json'),
      JSON.stringify(graph, null, 2),
      'utf-8'
    );
  }

  /**
   * Get next ready tasks
   */
  async getNextTasks(programName: string): Promise<string[]> {
    const graph = await this.loadFromPlanning(programName);
    const ready: string[] = [];

    for (const nodeId of graph.executionOrder) {
      const node = graph.nodes[nodeId];
      if (node.status !== 'pending') continue;

      const allDepsCompleted = node.dependencies.every(
        dep => graph.nodes[dep]?.status === 'completed'
      );

      if (allDepsCompleted) {
        ready.push(nodeId);
      }
    }

    return ready;
  }

  /**
   * Start a task
   */
  async startTask(programName: string, taskId: string): Promise<void> {
    let graph = await this.loadFromPlanning(programName);

    if (!graph.nodes[taskId]) {
      throw new Error(`Task not found: ${taskId}`);
    }

    graph.nodes[taskId].status = 'running';
    graph.nodes[taskId].startTime = new Date().toISOString();
    graph.currentNode = taskId;

    await this.saveGraph(programName, graph);

    // Create run record
    const run = await this.episodic.createRun(programName, taskId, graph.nodes[taskId].agent || 'unknown');

    // Share state
    await this.shared.set(
      `programs/${programName}/current-task`,
      { taskId, status: 'running', runId: run.id },
      'orchestrator'
    );
  }

  /**
   * Complete a task
   */
  async completeTask(programName: string, taskId: string, output?: string): Promise<void> {
    let graph = await this.loadFromPlanning(programName);

    if (!graph.nodes[taskId]) {
      throw new Error(`Task not found: ${taskId}`);
    }

    graph.nodes[taskId].status = 'completed';
    graph.nodes[taskId].endTime = new Date().toISOString();
    graph.nodes[taskId].output = output;

    await this.saveGraph(programName, graph);

    // Update shared state
    await this.shared.set(
      `programs/${programName}/current-task`,
      { taskId, status: 'completed', output },
      'orchestrator'
    );

    // Create artifact file
    const artifactPath = path.join(
      this.projectRoot,
      'programs',
      programName,
      'artifacts',
      `${taskId}.md`
    );
    await fs.promises.writeFile(artifactPath, output || `# ${taskId}\n\nCompleted.\n`, 'utf-8');
  }

  /**
   * Fail a task
   */
  async failTask(programName: string, taskId: string, error: string): Promise<void> {
    let graph = await this.loadFromPlanning(programName);

    if (!graph.nodes[taskId]) {
      throw new Error(`Task not found: ${taskId}`);
    }

    graph.nodes[taskId].status = 'failed';
    graph.nodes[taskId].endTime = new Date().toISOString();
    graph.nodes[taskId].error = error;

    await this.saveGraph(programName, graph);

    // Update shared state
    await this.shared.set(
      `programs/${programName}/current-task`,
      { taskId, status: 'failed', error },
      'orchestrator'
    );
  }

  /**
   * Get execution progress
   */
  async getProgress(programName: string): Promise<{ total: number; completed: number; failed: number }> {
    const graph = await this.loadFromPlanning(programName);

    let completed = 0;
    let failed = 0;

    for (const node of Object.values(graph.nodes)) {
      if (node.status === 'completed') completed++;
      if (node.status === 'failed') failed++;
    }

    return {
      total: Object.keys(graph.nodes).length,
      completed,
      failed,
    };
  }
}