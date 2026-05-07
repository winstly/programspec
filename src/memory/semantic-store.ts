import * as path from 'node:path';
import { FileMemoryStore } from './base-store.js';

/**
 * Pattern - a reusable solution pattern
 */
export interface Pattern {
  id: string;
  name: string;
  description: string;
  context: string;
  solution: string;
  applicableTo: string[];
  effectiveness: number;
  usageCount: number;
  lastUsed: string;
  created: string;
  source: 'program' | 'global';
}

/**
 * Semantic Memory Store - stores patterns and knowledge
 *
 * This captures reusable knowledge:
 * - Solutions to common problems
 * - Effective patterns and approaches
 * - Best practices learned
 */
export class SemanticStore {
  private store: FileMemoryStore<Pattern>;
  private patternsDir: string;

  constructor(projectRoot: string) {
    this.patternsDir = path.join(projectRoot, '.programspec', 'memory', 'semantic', 'patterns');
    this.store = new FileMemoryStore<Pattern>(this.patternsDir, '.json');
  }

  /**
   * Add a new pattern
   */
  async addPattern(pattern: Omit<Pattern, 'id' | 'usageCount' | 'lastUsed' | 'created'>): Promise<Pattern> {
    const id = pattern.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const fullPattern: Pattern = {
      ...pattern,
      id,
      usageCount: 0,
      lastUsed: new Date().toISOString(),
      created: new Date().toISOString(),
    };

    await this.store.write(id, fullPattern);
    return fullPattern;
  }

  /**
   * Get a pattern by ID
   */
  async getPattern(id: string): Promise<Pattern | null> {
    return this.store.read(id);
  }

  /**
   * Find patterns by keyword search
   */
  async searchPatterns(query: string): Promise<Pattern[]> {
    const all = await this.store.list();
    const results: Pattern[] = [];

    for (const id of all) {
      const pattern = await this.store.read(id);
      if (pattern) {
        const searchText = `${pattern.name} ${pattern.description} ${pattern.context} ${pattern.solution}`.toLowerCase();
        if (searchText.includes(query.toLowerCase())) {
          results.push(pattern);
        }
      }
    }

    return results.sort((a, b) => b.effectiveness - a.effectiveness);
  }

  /**
   * Find patterns applicable to a specific type
   */
  async getPatternsFor(applicableTo: string): Promise<Pattern[]> {
    const all = await this.store.list();
    const results: Pattern[] = [];

    for (const id of all) {
      const pattern = await this.store.read(id);
      if (pattern && pattern.applicableTo.includes(applicableTo)) {
        results.push(pattern);
      }
    }

    return results.sort((a, b) => b.effectiveness - a.effectiveness);
  }

  /**
   * Record pattern usage
   */
  async recordUsage(id: string, effectiveness?: number): Promise<void> {
    const pattern = await this.store.read(id);
    if (!pattern) {
      throw new Error(`Pattern not found: ${id}`);
    }

    await this.store.write(id, {
      ...pattern,
      usageCount: pattern.usageCount + 1,
      lastUsed: new Date().toISOString(),
      ...(effectiveness !== undefined && { effectiveness }),
    });
  }

  /**
   * List all patterns
   */
  async listPatterns(): Promise<Pattern[]> {
    const all = await this.store.list();
    const patterns: Pattern[] = [];

    for (const id of all) {
      const pattern = await this.store.read(id);
      if (pattern) {
        patterns.push(pattern);
      }
    }

    return patterns.sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Update pattern effectiveness based on results
   */
  async updateEffectiveness(id: string, success: boolean): Promise<void> {
    const pattern = await this.store.read(id);
    if (!pattern) return;

    // Simple moving average: adjust effectiveness by 10% toward success (1) or failure (0)
    const delta = success ? 0.1 : -0.1;
    const newEffectiveness = Math.max(0, Math.min(1, pattern.effectiveness + delta));

    await this.store.write(id, { ...pattern, effectiveness: newEffectiveness });
  }
}