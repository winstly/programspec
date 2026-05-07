/**
 * Update Command
 *
 * Refreshes generated commands and skills for selected AI tools.
 * Shows interactive tool selection to adjust which tools to generate for.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import ora from 'ora';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { CommandAdapterRegistry } from '../../core/command-generation/registry.js';
import { generateCommands } from '../../core/command-generation/generator.js';
import { generateSkillContent, getSkillFilePath } from '../../shared/skill-generation.js';
import { selectTools } from '../../shared/tool-selector.js';
import { workflows } from '../../templates/workflows/index.js';
import type { CommandContent } from '../../core/command-generation/types.js';

export interface UpdateOptions {
  json?: boolean;
}

export async function updateCommand(options?: UpdateOptions): Promise<void> {
  const spinner = options?.json ? undefined : ora('Updating tool commands and skills...').start();

  try {
    const projectRoot = process.cwd();
    const configPath = path.join(projectRoot, '.programspec', 'config.yaml');

    // Read existing config
    let previouslySelected: string[] = [];
    if (fs.existsSync(configPath)) {
      const configContent = await fs.promises.readFile(configPath, 'utf-8');
      const config = parseYaml(configContent);
      previouslySelected = config.tools || [];
    }

    spinner?.stop();

    // Interactive tool selection
    const { selected, cancelled } = await selectTools(previouslySelected);

    if (cancelled) {
      console.log('\nTool selection cancelled. No changes made.');
      return;
    }

    if (selected.length === 0) {
      console.log('\nNo tools selected. No commands/skills generated.');
      return;
    }

    // Save selected tools to config
    if (fs.existsSync(configPath)) {
      const configContent = await fs.promises.readFile(configPath, 'utf-8');
      const config = parseYaml(configContent);
      config.tools = selected.map((t) => t.value);
      await fs.promises.writeFile(configPath, stringifyYaml(config), 'utf-8');
    }

    // Generate commands and skills for selected tools
    console.log();
    const updateSpinner = ora('Generating commands and skills...').start();

    let totalGenerated = 0;
    const results: Array<{ tool: string; commands: number; skills: number }> = [];

    for (const tool of selected) {
      const adapter = CommandAdapterRegistry.get(tool.value);
      if (!adapter) continue;

      let commandsGenerated = 0;
      let skillsGenerated = 0;

      // Generate commands
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
        const filePath = path.join(projectRoot, cmd.path);
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
        await fs.promises.writeFile(filePath, cmd.fileContent, 'utf-8');
        commandsGenerated++;
        totalGenerated++;
      }

      // Generate skills
      for (const workflow of workflows) {
        const skillPath = path.join(projectRoot, getSkillFilePath(tool, workflow.skill.name));
        await fs.promises.mkdir(path.dirname(skillPath), { recursive: true });
        await fs.promises.writeFile(skillPath, generateSkillContent(workflow.skill), 'utf-8');
        skillsGenerated++;
        totalGenerated++;
      }

      results.push({ tool: tool.name, commands: commandsGenerated, skills: skillsGenerated });
    }

    updateSpinner.succeed('Update complete!');

    if (options?.json) {
      console.log(JSON.stringify({ tools: results, generated: totalGenerated }, null, 2));
      return;
    }

    console.log(`\nUpdated ${selected.length} tool(s):`);
    for (const r of results) {
      console.log(`  ${r.tool}: ${r.commands} commands, ${r.skills} skills`);
    }
    console.log(`\nTotal: ${totalGenerated} files generated.`);
  } catch (error) {
    if (!options?.json) {
      ora().fail(`Error: ${(error as Error).message}`);
    }
    throw error;
  }
}
