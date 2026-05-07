import * as fs from 'node:fs';
import * as path from 'node:path';
import ora from 'ora';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { getAvailableTools } from './available-tools.js';
import { CommandAdapterRegistry } from './command-generation/registry.js';
import { generateCommands } from './command-generation/generator.js';
import { generateSkillContent, getSkillFilePath } from '../shared/skill-generation.js';
import { selectTools } from '../shared/tool-selector.js';
import { workflows } from '../templates/workflows/index.js';
import { loadAllAgents } from '../agents/loader.js';
import type { CommandContent } from './command-generation/types.js';

export interface InitOptions {
  force?: boolean;
}

/**
 * Initialize programspec in a project directory.
 */
export async function initCommand(targetPath: string, options: InitOptions): Promise<void> {
  const spinner = ora('Initializing programspec...').start();

  try {
    const programSpecDir = path.join(targetPath, '.programspec');
    const configPath = path.join(programSpecDir, 'config.yaml');
    const programsDir = path.join(targetPath, 'programs');
    const schemasDir = path.join(targetPath, 'schemas');

    // Check existing config
    if (fs.existsSync(configPath) && !options.force) {
      spinner.fail('programspec is already initialized.');
      console.log('  Use --force to overwrite existing configuration.');
      return;
    }

    // Create directories
    await fs.promises.mkdir(programSpecDir, { recursive: true });
    await fs.promises.mkdir(programsDir, { recursive: true });
    await fs.promises.mkdir(schemasDir, { recursive: true });

    // Write initial config
    const initialConfig = {
      schema: 'spec-driven',
      tools: [] as string[],
    };

    await fs.promises.writeFile(configPath, stringifyYaml(initialConfig), 'utf-8');

    spinner.succeed('programspec initialized!');

    // Detect tools that are already installed
    const detectedTools = getAvailableTools(targetPath);
    const detectedIds = detectedTools.map((t) => t.value);

    // Interactive tool selection
    const { selected, cancelled } = await selectTools(detectedIds);

    if (cancelled) {
      console.log('\nTool selection cancelled. No commands/skills generated.');
      console.log('Run `programspec update` later to generate commands.');
      return;
    }

    if (selected.length === 0) {
      console.log('\nNo tools selected. Run `programspec update` later to generate commands.');
      return;
    }

    // Save selected tools to config
    const configContent = await fs.promises.readFile(configPath, 'utf-8');
    const config = parseYaml(configContent);
    config.tools = selected.map((t) => t.value);
    await fs.promises.writeFile(configPath, stringifyYaml(config), 'utf-8');

    // Generate commands and skills for selected tools
    console.log();
    let totalGenerated = 0;

    for (const tool of selected) {
      const adapter = CommandAdapterRegistry.get(tool.value);
      if (!adapter) continue;

      const commandContents: CommandContent[] = workflows.map((w) => ({
        id: w.command.name.toLowerCase().replace(/programspec\s*/g, '').replace(/\s+/g, '-'),
        name: w.command.name,
        description: w.command.description,
        category: w.command.category,
        tags: w.command.tags,
        body: w.command.content,
      }));

      const generated = generateCommands(commandContents, adapter);
      for (const cmd of generated) {
        const filePath = path.join(targetPath, cmd.path);
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
        await fs.promises.writeFile(filePath, cmd.fileContent, 'utf-8');
        totalGenerated++;
      }

      // Generate skills
      for (const workflow of workflows) {
        const skillPath = path.join(targetPath, getSkillFilePath(tool, workflow.skill.name));
        await fs.promises.mkdir(path.dirname(skillPath), { recursive: true });
        await fs.promises.writeFile(skillPath, generateSkillContent(workflow.skill), 'utf-8');
        totalGenerated++;
      }
    }

    console.log(`Generated ${totalGenerated} command/skill files for ${selected.length} tool(s).`);

    // Copy agent definitions to .programspec/agents/
    const agents = loadAllAgents();
    let agentCount = 0;
    for (const agent of agents) {
      const agentDir = path.join(programSpecDir, 'agents', agent.name.toLowerCase().replace(/\s+/g, '-'));
      await fs.promises.mkdir(agentDir, { recursive: true });
      const agentFile = path.join(agentDir, 'AGENT.md');
      if (!fs.existsSync(agentFile)) {
        const agentMeta = {
          name: agent.name,
          stage: agent.stage,
          description: agent.description,
          capabilities: agent.capabilities,
        };
        const agentContent = `---
${stringifyYaml(agentMeta).trimEnd()}
---

${agent.prompt}
`;
        await fs.promises.writeFile(agentFile, agentContent, 'utf-8');
        agentCount++;
      }
    }
    if (agentCount > 0) {
      console.log(`Copied ${agentCount} agent definitions to .programspec/agents/`);
    }

    console.log();
    console.log('Created:');
    console.log('  .programspec/        # Runtime data directory');
    console.log('  .programspec/config.yaml  # Configuration file');
    console.log('  .programspec/agents/ # Agent definitions');
    console.log('  programs/            # Programs directory');
    console.log('  schemas/             # Schema definitions');
    console.log();
    console.log('Next steps:');
    console.log('  programspec new program <name>  # Create your first program');
    console.log('  programspec schemas             # See available schemas');
    console.log('  programspec agents              # See available agents');
    console.log('  programspec update              # Refresh tool commands');
  } catch (error) {
    spinner.fail('Failed to initialize programspec.');
    throw error;
  }
}
