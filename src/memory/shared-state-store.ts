import * as path from 'node:path';
import { FileMemoryStore } from './base-store.js';

/**
 * Shared State - cross-agent shared information
 */
export interface SharedState {
  key: string;
  value: unknown;
  updatedBy: string;
  updatedAt: string;
  version: number;
}

/**
 * Shared State Store - stores cross-agent shared information
 *
 * This enables agents to share:
 * - Current task context
 * - Shared conclusions
 * - Agent coordination state
 */
export class SharedStateStore {
  private store: FileMemoryStore<SharedState>;
  private statesDir: string;

  constructor(projectRoot: string) {
    this.statesDir = path.join(projectRoot, '.programspec', 'memory', 'shared_state');
    this.store = new FileMemoryStore<SharedState>(this.statesDir, '.json');
  }

  /**
   * Set a shared state value
   */
  async set(key: string, value: unknown, updatedBy: string): Promise<void> {
    const existing = await this.store.read(key);

    const state: SharedState = {
      key,
      value,
      updatedBy,
      updatedAt: new Date().toISOString(),
      version: existing ? existing.version + 1 : 1,
    };

    await this.store.write(key, state);
  }

  /**
   * Get a shared state value
   */
  async get(key: string): Promise<unknown | null> {
    const state = await this.store.read(key);
    return state?.value ?? null;
  }

  /**
   * Get full state record
   */
  async getState(key: string): Promise<SharedState | null> {
    return this.store.read(key);
  }

  /**
   * Delete a shared state
   */
  async delete(key: string): Promise<void> {
    await this.store.delete(key);
  }

  /**
   * Get all states
   */
  async getAll(): Promise<SharedState[]> {
    const keys = await this.store.list();
    const states: SharedState[] = [];

    for (const key of keys) {
      const state = await this.store.read(key);
      if (state) {
        states.push(state);
      }
    }

    return states.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Get states for a specific program
   */
  async getProgramStates(programName: string): Promise<SharedState[]> {
    const all = await this.getAll();
    return all.filter(s => s.key.startsWith(`programs/${programName}/`));
  }

  /**
   * Update multiple states atomically
   */
  async batchUpdate(
    updates: Array<{ key: string; value: unknown; updatedBy: string }>
  ): Promise<void> {
    for (const update of updates) {
      await this.set(update.key, update.value, update.updatedBy);
    }
  }

  /**
   * Delete all states for a program
   */
  async clearProgramStates(programName: string): Promise<void> {
    const states = await this.getProgramStates(programName);
    for (const state of states) {
      await this.delete(state.key);
    }
  }
}