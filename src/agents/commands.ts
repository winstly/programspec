import * as fs from 'node:fs';
import * as path from 'node:path';
import ora from 'ora';
import { getHomeDir } from '../utils/home-dir.js';

/**
 * List all available agents
 */
export async function listAgentsCommand(options?: { json?: boolean }): Promise<void> {
  const spinner = options?.json ? undefined : ora('Loading agents...').start();

  try {
    const projectRoot = process.cwd();
    const agentsDir = path.join(projectRoot, '.programspec', 'agents');
    const globalAgentsDir = path.join(getHomeDir(), '.programspec', 'agents');

    const agents: AgentInfo[] = [];

    // Scan project agents
    if (fs.existsSync(agentsDir)) {
      await scanAgentDir(agentsDir, agents, 'project');
    }

    // Scan global agents
    if (fs.existsSync(globalAgentsDir)) {
      await scanAgentDir(globalAgentsDir, agents, 'global');
    }

    spinner?.stop();

    if (options?.json) {
      console.log(JSON.stringify({ agents }, null, 2));
      return;
    }

    if (agents.length === 0) {
      console.log('No agents found. System agents will be loaded on first use.');
      return;
    }

    console.log(`Available agents (${agents.length}):\n`);
    for (const agent of agents) {
      console.log(`  ${agent.name}`);
      console.log(`    Type: ${agent.source}`);
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

interface AgentInfo {
  name: string;
  source: string;
  description?: string;
  capabilities?: string[];
  path: string;
}

async function scanAgentDir(dir: string, agents: AgentInfo[], source: string): Promise<void> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const agentDir = path.join(dir, entry.name);
    const configPath = path.join(agentDir, 'config.json');

    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        agents.push({
          name: entry.name,
          source,
          description: config.description,
          capabilities: config.capabilities,
          path: agentDir,
        });
      } catch {
        agents.push({
          name: entry.name,
          source,
          path: agentDir,
        });
      }
    }
  }
}