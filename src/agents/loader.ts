/**
 * Agent Loader
 *
 * Loads agent definitions from .md files with YAML frontmatter.
 * Searches for agents in:
 * 1. Project agents: .programspec/agents/<name>/AGENT.md
 * 2. System agents (built-in): src/agents/definitions/<name>.md
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { AgentDefinition } from './types.js';

const SYSTEM_AGENTS_DIR = path.resolve(import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname), 'definitions');

/**
 * Parse a .md file with YAML frontmatter into an AgentDefinition.
 */
function parseAgentFile(filePath: string): AgentDefinition | null {
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf-8');
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

  if (!frontmatterMatch) return null;

  const [, yamlContent, prompt] = frontmatterMatch;

  try {
    const meta = parseYaml(yamlContent) as Record<string, unknown>;
    return {
      name: (meta.name as string) ?? path.basename(filePath, '.md'),
      stage: (meta.stage as string) ?? '',
      description: (meta.description as string) ?? '',
      capabilities: Array.isArray(meta.capabilities) ? (meta.capabilities as string[]) : [],
      prompt: prompt.trim(),
      metadata: {
        version: (meta.version as string) ?? '1.0.0',
        author: (meta.author as string) ?? 'programspec',
      },
    };
  } catch {
    return null;
  }
}

/**
 * Load a single agent by name.
 * Searches project agents first, then system agents.
 */
export function loadAgent(name: string, projectRoot?: string): AgentDefinition | null {
  if (projectRoot) {
    const projectPath = path.join(projectRoot, '.programspec', 'agents', name, 'AGENT.md');
    const agent = parseAgentFile(projectPath);
    if (agent) return agent;
  }

  const systemPath = path.join(SYSTEM_AGENTS_DIR, `${name}.md`);
  return parseAgentFile(systemPath);
}

/**
 * Load all available agents.
 * Merges project agents (override) with system agents (defaults).
 */
export function loadAllAgents(projectRoot?: string): AgentDefinition[] {
  const agents = new Map<string, AgentDefinition>();

  // Load system agents first (defaults)
  if (fs.existsSync(SYSTEM_AGENTS_DIR)) {
    const files = fs.readdirSync(SYSTEM_AGENTS_DIR).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const agent = parseAgentFile(path.join(SYSTEM_AGENTS_DIR, file));
      if (agent) agents.set(agent.name, agent);
    }
  }

  // Override with project agents if available
  if (projectRoot) {
    const projectAgentsDir = path.join(projectRoot, '.programspec', 'agents');
    if (fs.existsSync(projectAgentsDir)) {
      const entries = fs.readdirSync(projectAgentsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const agentPath = path.join(projectAgentsDir, entry.name, 'AGENT.md');
        const agent = parseAgentFile(agentPath);
        if (agent) agents.set(agent.name, agent);
      }
    }
  }

  return Array.from(agents.values());
}

/**
 * Get agent for a specific stage.
 * Returns the first agent matching the stage, or null.
 */
export function getAgentForStage(stage: string, projectRoot?: string): AgentDefinition | null {
  const allAgents = loadAllAgents(projectRoot);
  return allAgents.find(a => a.stage === stage) ?? null;
}

/**
 * Get all agents for a specific stage.
 * A stage can have multiple agents (e.g., planning has planner + architect).
 */
export function getAgentsForStage(stage: string, projectRoot?: string): AgentDefinition[] {
  const allAgents = loadAllAgents(projectRoot);
  return allAgents.filter(a => a.stage === stage);
}
