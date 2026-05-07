import ora from 'ora';
import { EvolutionManager } from './manager.js';

/**
 * Execute evolution command
 */
export async function evolveCommand(options?: { dryRun?: boolean; json?: boolean }): Promise<void> {
  const spinner = options?.json ? undefined : ora('Analyzing system evolution...').start();

  try {
    const projectRoot = process.cwd();
    const evolution = new EvolutionManager(projectRoot);

    const result = await evolution.evolve({ dryRun: options?.dryRun });

    spinner?.stop();

    if (options?.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log('\n' + result.summary);

    if (result.agentUpdates.length > 0) {
      console.log('\nAgent Updates:');
      for (const update of result.agentUpdates) {
        console.log(`  ${update.agentName}:`);
        for (const change of update.changes) {
          console.log(`    - ${change}`);
        }
      }
    }
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

/**
 * Analyze evolution recommendations
 */
export async function analyzeCommand(options?: { json?: boolean }): Promise<void> {
  const spinner = options?.json ? undefined : ora('Analyzing recommendations...').start();

  try {
    const projectRoot = process.cwd();
    const evolution = new EvolutionManager(projectRoot);

    const recommendations = await evolution.analyze();

    spinner?.stop();

    if (options?.json) {
      console.log(JSON.stringify(recommendations, null, 2));
      return;
    }

    console.log('\nEvolution Recommendations:\n');

    if (recommendations.patternInsights.length > 0) {
      console.log('Pattern Insights:');
      for (const insight of recommendations.patternInsights) {
        console.log(`  [${insight.type}] ${insight.pattern}`);
        console.log(`    ${insight.insight}\n`);
      }
    }

    if (recommendations.agentImprovements.length > 0) {
      console.log('Agent Improvements:');
      for (const imp of recommendations.agentImprovements) {
        console.log(`  ${imp.agent}: ${imp.insight}`);
        console.log(`    Type: ${imp.type}\n`);
      }
    }

    if (recommendations.systemObservations.length > 0) {
      console.log('System Observations:');
      for (const obs of recommendations.systemObservations) {
        console.log(`  [${obs.type}] ${obs.observation}\n`);
      }
    }

    if (
      recommendations.patternInsights.length === 0 &&
      recommendations.agentImprovements.length === 0 &&
      recommendations.systemObservations.length === 0
    ) {
      console.log('No recommendations at this time. System is in good state.');
    }
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}