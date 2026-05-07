import * as path from 'node:path';
import { FileMemoryStore } from './base-store.js';

/**
 * Agent Strategy - behavior rules and heuristics for an agent
 */
export interface AgentStrategy {
  id: string;
  agentName: string;
  version: string;
  rules: StrategyRule[];
  heuristics: StrategyHeuristic[];
  learnedFrom: string[];  // Run IDs that contributed to this strategy
  lastUpdated: string;
  effectiveness: number;
}

export interface StrategyRule {
  id: string;
  condition: string;
  action: string;
  priority: number;
  enabled: boolean;
}

export interface StrategyHeuristic {
  id: string;
  description: string;
  trigger: string;
  response: string;
  success: number;
  failure: number;
}

/**
 * Procedural Memory Store - stores agent behavior strategies
 *
 * This captures how agents should behave:
 * - Rules for specific situations
 * - Learned heuristics
 * - Strategy updates based on experience
 */
export class ProceduralStore {
  private store: FileMemoryStore<AgentStrategy>;
  private strategiesDir: string;

  constructor(projectRoot: string) {
    this.strategiesDir = path.join(projectRoot, '.programspec', 'memory', 'procedural', 'agent-strategies');
    this.store = new FileMemoryStore<AgentStrategy>(this.strategiesDir, '.json');
  }

  /**
   * Get strategy for an agent
   */
  async getStrategy(agentName: string): Promise<AgentStrategy | null> {
    return this.store.read(agentName);
  }

  /**
   * Create or update a strategy
   */
  async saveStrategy(strategy: AgentStrategy): Promise<void> {
    await this.store.write(strategy.agentName, {
      ...strategy,
      lastUpdated: new Date().toISOString(),
    });
  }

  /**
   * Add a new rule to an agent's strategy
   */
  async addRule(
    agentName: string,
    condition: string,
    action: string,
    priority: number = 50
  ): Promise<void> {
    let strategy = await this.getStrategy(agentName);

    if (!strategy) {
      strategy = {
        id: agentName,
        agentName,
        version: '1.0.0',
        rules: [],
        heuristics: [],
        learnedFrom: [],
        lastUpdated: new Date().toISOString(),
        effectiveness: 0.5,
      };
    }

    const rule: StrategyRule = {
      id: `rule-${Date.now()}`,
      condition,
      action,
      priority,
      enabled: true,
    };

    strategy.rules.push(rule);
    strategy.rules.sort((a, b) => b.priority - a.priority);

    await this.saveStrategy(strategy);
  }

  /**
   * Add a heuristic
   */
  async addHeuristic(
    agentName: string,
    description: string,
    trigger: string,
    response: string
  ): Promise<void> {
    let strategy = await this.getStrategy(agentName);

    if (!strategy) {
      strategy = {
        id: agentName,
        agentName,
        version: '1.0.0',
        rules: [],
        heuristics: [],
        learnedFrom: [],
        lastUpdated: new Date().toISOString(),
        effectiveness: 0.5,
      };
    }

    const heuristic: StrategyHeuristic = {
      id: `heuristic-${Date.now()}`,
      description,
      trigger,
      response,
      success: 0,
      failure: 0,
    };

    strategy.heuristics.push(heuristic);
    await this.saveStrategy(strategy);
  }

  /**
   * Update heuristic success/failure stats
   */
  async recordHeuristicResult(agentName: string, heuristicId: string, success: boolean): Promise<void> {
    const strategy = await this.getStrategy(agentName);
    if (!strategy) return;

    const heuristic = strategy.heuristics.find(h => h.id === heuristicId);
    if (!heuristic) return;

    if (success) {
      heuristic.success++;
    } else {
      heuristic.failure++;
    }

    await this.saveStrategy(strategy);
  }

  /**
   * Get all strategies
   */
  async listStrategies(): Promise<AgentStrategy[]> {
    const agents = await this.store.list();
    const strategies: AgentStrategy[] = [];

    for (const agent of agents) {
      const strategy = await this.getStrategy(agent);
      if (strategy) {
        strategies.push(strategy);
      }
    }

    return strategies;
  }

  /**
   * Learn from a run - add run ID to learnedFrom
   */
  async learnFromRun(agentName: string, runId: string): Promise<void> {
    let strategy = await this.getStrategy(agentName);

    if (!strategy) {
      strategy = {
        id: agentName,
        agentName,
        version: '1.0.0',
        rules: [],
        heuristics: [],
        learnedFrom: [],
        lastUpdated: new Date().toISOString(),
        effectiveness: 0.5,
      };
    }

    if (!strategy.learnedFrom.includes(runId)) {
      strategy.learnedFrom.push(runId);
    }

    await this.saveStrategy(strategy);
  }

  /**
   * Update strategy effectiveness
   */
  async updateEffectiveness(agentName: string, delta: number): Promise<void> {
    const strategy = await this.getStrategy(agentName);
    if (!strategy) return;

    strategy.effectiveness = Math.max(0, Math.min(1, strategy.effectiveness + delta));
    await this.saveStrategy(strategy);
  }
}