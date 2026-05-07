/**
 * Tool Selector
 *
 * Interactive multi-select for choosing AI tools.
 */

import prompts from 'prompts';
import chalk from 'chalk';
import { AI_TOOLS, type AIToolOption } from '../core/config.js';

export interface ToolSelectionResult {
  selected: AIToolOption[];
  cancelled: boolean;
}

/**
 * Show interactive tool selection prompt.
 * Pre-selects tools that are detected in the project.
 */
export async function selectTools(
  detectedToolIds: string[] = []
): Promise<ToolSelectionResult> {
  const choices = AI_TOOLS.map((tool) => ({
    title: tool.name,
    value: tool.value,
    selected: detectedToolIds.includes(tool.value),
  }));

  console.log();
  console.log(chalk.bold('Select AI tools to generate commands for:'));
  console.log(chalk.gray('  (Use Space to select, Enter to confirm)'));
  console.log();

  const response = await prompts({
    type: 'multiselect',
    name: 'tools',
    message: 'AI Tools',
    choices,
    instructions: false,
  });

  if (response.tools === undefined) {
    return { selected: [], cancelled: true };
  }

  const selected = AI_TOOLS.filter((tool) =>
    response.tools.includes(tool.value)
  );

  return { selected, cancelled: false };
}
