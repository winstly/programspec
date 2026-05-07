import { SemanticStore } from '../../memory/semantic-store.js';
import { ProceduralStore } from '../../memory/procedural-store.js';

export interface EvolutionResult {
  agentUpdates: AgentUpdate[];
  patternAdditions: string[];
  profileUpdates: ProfileUpdate[];
  summary: string;
}

export interface AgentUpdate {
  agentName: string;
  changes: string[];
  effectivenessDelta: number;
}

export interface ProfileUpdate {
  programName: string;
  updates: string[];
}

/**
 * Evolution Manager - handles system evolution and learning
 *
 * This is the "growth" part of programspec. It analyzes
 * experience and updates agent behavior strategies, patterns, and
 * program profiles.
 */
export class EvolutionManager {
  private semantic: SemanticStore;
  private procedural: ProceduralStore;

  constructor(private projectRoot: string) {
    this.semantic = new SemanticStore(this.projectRoot);
    this.procedural = new ProceduralStore(this.projectRoot);
  }

  /**
   * Analyze experience and generate evolution recommendations
   */
  async analyze(): Promise<EvolutionRecommendations> {
    const patterns = await this.semantic.listPatterns();
    const strategies = await this.procedural.listStrategies();

    const recommendations: EvolutionRecommendations = {
      patternInsights: [],
      agentImprovements: [],
      systemObservations: [],
    };

    // Analyze patterns
    for (const pattern of patterns) {
      if (pattern.effectiveness > 0.8) {
        recommendations.patternInsights.push({
          pattern: pattern.name,
          insight: `High effectiveness (${(pattern.effectiveness * 100).toFixed(0)}%). Consider promoting to global patterns.`,
          type: 'promote',
        });
      } else if (pattern.effectiveness < 0.3 && pattern.usageCount > 3) {
        recommendations.patternInsights.push({
          pattern: pattern.name,
          insight: `Low effectiveness (${(pattern.effectiveness * 100).toFixed(0)}%) with ${pattern.usageCount} uses. Consider updating or removing.`,
          type: 'review',
        });
      }
    }

    // Analyze agent strategies
    for (const strategy of strategies) {
      if (strategy.effectiveness < 0.4) {
        recommendations.agentImprovements.push({
          agent: strategy.agentName,
          insight: `Effectiveness is ${(strategy.effectiveness * 100).toFixed(0)}%. Consider reviewing rules.`,
          type: 'review_strategy',
        });
      }

      // Check for heuristics with poor success rate
      for (const heuristic of strategy.heuristics) {
        const total = heuristic.success + heuristic.failure;
        if (total >= 5) {
          const rate = heuristic.success / total;
          if (rate < 0.4) {
            recommendations.agentImprovements.push({
              agent: strategy.agentName,
              insight: `Heuristic "${heuristic.description}" has ${(rate * 100).toFixed(0)}% success rate. Consider updating.`,
              type: 'update_heuristic',
            });
          }
        }
      }
    }

    // System observations
    const totalPatterns = patterns.length;
    if (totalPatterns > 20) {
      recommendations.systemObservations.push({
        observation: 'Pattern library is growing. Consider organizing into categories.',
        type: 'organize',
      });
    }

    return recommendations;
  }

  /**
   * Execute evolution - update strategies and patterns based on experience
   */
  async evolve(options: { dryRun?: boolean } = {}): Promise<EvolutionResult> {
    const recommendations = await this.analyze();
    const result: EvolutionResult = {
      agentUpdates: [],
      patternAdditions: [],
      profileUpdates: [],
      summary: '',
    };

    if (options.dryRun) {
      result.summary = 'Dry run - no changes made. Recommendations:\n';
      result.summary += this.formatRecommendations(recommendations);
      return result;
    }

    // Apply improvements
    for (const improvement of recommendations.agentImprovements) {
      if (improvement.type === 'review_strategy') {
        // Add a review rule for the agent
        await this.procedural.addRule(
          improvement.agent,
          'Always validate against existing patterns before proceeding',
          'Check semantic store for relevant patterns',
          80
        );

        result.agentUpdates.push({
          agentName: improvement.agent,
          changes: ['Added validation rule'],
          effectivenessDelta: 0.05,
        });
      }
    }

    // Update pattern effectiveness
    const patterns = await this.semantic.listPatterns();
    for (const pattern of patterns) {
      if (pattern.effectiveness > 0.9) {
        await this.semantic.updateEffectiveness(pattern.id, true);
      }
    }

    result.summary = `Evolution complete.\n`;
    result.summary += `  Agent updates: ${result.agentUpdates.length}\n`;
    result.summary += `  Pattern additions: ${result.patternAdditions.length}\n`;
    result.summary += `  Profile updates: ${result.profileUpdates.length}`;

    return result;
  }

  /**
   * Record experience from a run
   */
  async recordExperience(options: {
    programName: string;
    runId: string;
    success: boolean;
    stage: string;
    agent: string;
    lessons?: string[];
  }): Promise<void> {
    // Learn from the run
    await this.procedural.learnFromRun(options.agent, options.runId);

    // Update effectiveness
    const delta = options.success ? 0.1 : -0.05;
    await this.procedural.updateEffectiveness(options.agent, delta);

    // If there were lessons, record them as patterns
    if (options.lessons && options.lessons.length > 0) {
      for (const lesson of options.lessons) {
        await this.semantic.addPattern({
          name: `lesson-${Date.now()}`,
          description: lesson,
          context: `From ${options.stage} stage of ${options.programName}`,
          solution: 'Recorded lesson',
          applicableTo: [options.stage],
          effectiveness: options.success ? 0.7 : 0.3,
          source: 'program',
        });
      }
    }
  }

  /**
   * Generate improvement recommendations for a specific agent
   */
  async getAgentImprovements(agentName: string): Promise<string[]> {
    const strategy = await this.procedural.getStrategy(agentName);
    const improvements: string[] = [];

    if (!strategy) {
      improvements.push('No strategy recorded yet. Agent is using defaults.');
      return improvements;
    }

    // Check for missing rules
    if (strategy.rules.length < 3) {
      improvements.push('Consider adding more rules for better guidance.');
    }

    // Check effectiveness
    if (strategy.effectiveness < 0.5) {
      improvements.push(`Effectiveness is ${(strategy.effectiveness * 100).toFixed(0)}%. Review recent failures.`);
    }

    // Check heuristic coverage
    if (strategy.heuristics.length < 2) {
      improvements.push('Consider developing more heuristics from experience.');
    }

    return improvements;
  }

  private formatRecommendations(recommendations: EvolutionRecommendations): string {
    let output = '';

    if (recommendations.patternInsights.length > 0) {
      output += '\nPattern Insights:\n';
      for (const insight of recommendations.patternInsights) {
        output += `  - [${insight.type}] ${insight.pattern}: ${insight.insight}\n`;
      }
    }

    if (recommendations.agentImprovements.length > 0) {
      output += '\nAgent Improvements:\n';
      for (const imp of recommendations.agentImprovements) {
        output += `  - ${imp.agent}: ${imp.insight}\n`;
      }
    }

    if (recommendations.systemObservations.length > 0) {
      output += '\nSystem Observations:\n';
      for (const obs of recommendations.systemObservations) {
        output += `  - [${obs.type}] ${obs.observation}\n`;
      }
    }

    return output || '  No recommendations at this time.';
  }
}

export interface EvolutionRecommendations {
  patternInsights: Array<{
    pattern: string;
    insight: string;
    type: 'promote' | 'review' | 'remove';
  }>;
  agentImprovements: Array<{
    agent: string;
    insight: string;
    type: 'review_strategy' | 'update_heuristic' | 'add_rule';
  }>;
  systemObservations: Array<{
    observation: string;
    type: string;
  }>;
}