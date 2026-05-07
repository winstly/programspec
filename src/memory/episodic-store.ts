import * as fs from 'node:fs';
import * as path from 'node:path';
import { FileMemoryStore } from './base-store.js';

/**
 * Run Record - a single execution record
 */
export interface RunRecord {
  id: string;
  programName: string;
  stage: string;
  agent: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed';
  tasks: string[];
  completedTasks: string[];
  artifacts: string[];
  errors?: string[];
  metrics?: Record<string, number>;
}

/**
 * Episodic Memory Store - stores execution records
 *
 * This captures what happened during execution:
 * - Agent runs with timestamps
 * - Task completion records
 * - Error occurrences
 */
export class EpisodicStore extends FileMemoryStore<RunRecord> {
  constructor(projectRoot: string) {
    const memoryDir = path.join(projectRoot, '.programspec', 'memory', 'episodic');
    super(memoryDir, '.json');
  }

  /**
   * Create a new run record
   */
  async createRun(programName: string, stage: string, agent: string): Promise<RunRecord> {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record: RunRecord = {
      id,
      programName,
      stage,
      agent,
      startTime: new Date().toISOString(),
      status: 'running',
      tasks: [],
      completedTasks: [],
      artifacts: [],
    };

    await this.write(id, record);

    // Also store in program-specific directory
    const programDir = path.join(
      this.baseDir,
      'programs',
      programName,
      'runs'
    );
    await fs.promises.mkdir(programDir, { recursive: true });
    await this.write(path.join('programs', programName, 'runs', id), record);

    return record;
  }

  /**
   * Update a run record
   */
  async updateRun(id: string, updates: Partial<RunRecord>): Promise<void> {
    const record = await this.read(id);
    if (!record) {
      throw new Error(`Run record not found: ${id}`);
    }

    const updated = { ...record, ...updates };
    await this.write(id, updated);

    // Update program-specific copy if exists
    const programPath = path.join('programs', record.programName, 'runs', id);
    await this.write(programPath, updated);
  }

  /**
   * Complete a run record
   */
  async completeRun(id: string, status: 'completed' | 'failed', errors?: string[]): Promise<void> {
    await this.updateRun(id, {
      status,
      endTime: new Date().toISOString(),
      ...(errors && { errors }),
    });
  }

  /**
   * Get runs for a specific program
   */
  async getProgramRuns(programName: string): Promise<RunRecord[]> {
    const programDir = path.join(this.baseDir, 'programs', programName, 'runs');
    if (!fs.existsSync(programDir)) {
      return [];
    }

    const files = await fs.promises.readdir(programDir);
    const runs: RunRecord[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const record = await this.read(path.join('programs', programName, 'runs', file.replace('.json', '')));
        if (record) {
          runs.push(record);
        }
      }
    }

    return runs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  /**
   * Get recent runs across all programs
   */
  async getRecentRuns(limit: number = 10): Promise<RunRecord[]> {
    const all = await this.list();
    const runs: RunRecord[] = [];

    for (const key of all.slice(0, limit * 2)) {
      if (!key.includes('/')) {
        const record = await this.read(key);
        if (record) {
          runs.push(record);
        }
      }
    }

    return runs
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, limit);
  }
}