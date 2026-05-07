import ora from 'ora';
import chalk from 'chalk';
import {
  loadProgramContext,
  generateInstructions,
  formatProgramStatus,
  type ArtifactInstructions,
  type ProgramContext,
} from '../../core/artifact-graph/index.js';
import {
  validateProgramExists,
  validateSchemaExists,
  getAvailablePrograms,
} from './shared.js';

export interface InstructionsOptions {
  program?: string;
  schema?: string;
  json?: boolean;
}

export async function instructionsCommand(
  artifactId: string,
  options: InstructionsOptions
): Promise<void> {
  const spinner = options.json ? undefined : ora('Loading instructions...').start();

  try {
    const projectRoot = process.cwd();

    if (!options.program) {
      const available = await getAvailablePrograms(projectRoot);
      if (available.length === 0) {
        spinner?.stop();
        throw new Error(
          'No programs found. Create one with: programspec new program <name>'
        );
      }
      spinner?.stop();
      throw new Error(
        `Missing required option --program.\n\nAvailable programs:\n  ${available.join('\n  ')}`
      );
    }

    await validateProgramExists(options.program, projectRoot);

    if (options.schema) {
      validateSchemaExists(options.schema, projectRoot);
    }

    const context = loadProgramContext(projectRoot, options.program, options.schema);
    const instructions = generateInstructions(context, artifactId);

    spinner?.stop();

    if (options.json) {
      console.log(JSON.stringify(instructions, null, 2));
      return;
    }

    printInstructionsText(instructions, context);
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

export function printInstructionsText(
  instructions: ArtifactInstructions,
  context: ProgramContext
): void {
  const status = formatProgramStatus(context);

  console.log();
  console.log(chalk.bold(`Artifact: ${instructions.artifactId}`));
  console.log(chalk.dim(`Schema: ${instructions.schemaName}`));
  console.log(chalk.dim(`Program: ${instructions.programName}`));
  console.log(chalk.dim(`Output: programs/${instructions.programName}/artifacts/${instructions.outputPath}`));
  console.log();

  if (instructions.description) {
    console.log(chalk.bold('Description:'));
    console.log(instructions.description);
    console.log();
  }

  if (instructions.instruction) {
    console.log(chalk.bold('Instructions:'));
    console.log(instructions.instruction);
    console.log();
  }

  if (instructions.template) {
    console.log(chalk.bold('Template:'));
    console.log(chalk.dim('---'));
    console.log(instructions.template);
    console.log(chalk.dim('---'));
    console.log();
  }

  if (instructions.dependencies.length > 0) {
    console.log(chalk.bold('Dependencies:'));
    for (const dep of instructions.dependencies) {
      const marker = dep.done ? chalk.green('✓') : chalk.red('✗');
      console.log(`  ${marker} ${dep.id} → ${dep.path}`);
    }
    console.log();
  }

  if (instructions.unlocks.length > 0) {
    console.log(chalk.bold('Unlocks:'));
    for (const unlock of instructions.unlocks) {
      console.log(`  → ${unlock}`);
    }
    console.log();
  }

  console.log(chalk.bold('Progress:'));
  console.log(`  ${status.artifacts.filter(a => a.status === 'done').length}/${status.artifacts.length} artifacts complete`);

  if (instructions.dependencies.some(d => !d.done)) {
    console.log();
    console.log(chalk.yellow('⚠ This artifact has unmet dependencies. Complete them first.'));
  }
}
