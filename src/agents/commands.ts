import ora from 'ora';
import { loadAllAgents } from './loader.js';

/**
 * List all available agents
 */
export async function listAgentsCommand(options?: { json?: boolean }): Promise<void> {
  const spinner = options?.json ? undefined : ora('Loading agents...').start();

  try {
    const projectRoot = process.cwd();
    const agents = loadAllAgents(projectRoot);

    spinner?.stop();

    if (options?.json) {
      console.log(JSON.stringify({ agents: agents.map(a => ({
        name: a.name,
        stage: a.stage,
        description: a.description,
        capabilities: a.capabilities,
      })) }, null, 2));
      return;
    }

    if (agents.length === 0) {
      console.log('No agents found. System agents will be loaded on first use.');
      return;
    }

    console.log(`Available agents (${agents.length}):\n`);
    for (const agent of agents) {
      console.log(`  ${agent.name}`);
      console.log(`    Stage: ${agent.stage}`);
      console.log(`    Description: ${agent.description || 'N/A'}`);
      if (agent.capabilities && agent.capabilities.length > 0) {
        console.log(`    Capabilities: ${agent.capabilities.join(', ')}`);
      }
      console.log();
    }
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}
