import ora from 'ora';
import chalk from 'chalk';
import {
  loadProgramContext,
  generateInstructions,
  formatProgramStatus,
  type ArtifactInstructions,
} from '../../core/artifact-graph/index.js';
import {
  validateProgramExists,
  validateSchemaExists,
  getAvailablePrograms,
} from './shared.js';

export interface ContinueOptions {
  program?: string;
  schema?: string;
  json?: boolean;
}

export interface ContinueResult {
  programName: string;
  schemaName: string;
  hasReady: boolean;
  allComplete: boolean;
  readyArtifactId: string | null;
  instructions: ArtifactInstructions | null;
  progress: { done: number; total: number };
}

export async function continueCommand(options: ContinueOptions): Promise<void> {
  const spinner = options.json ? undefined : ora('Finding next artifact...').start();

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
    const status = formatProgramStatus(context);
    const readyArtifacts = status.artifacts.filter(a => a.status === 'ready');

    const doneCount = status.artifacts.filter(a => a.status === 'done').length;
    const totalCount = status.artifacts.length;

    if (status.isComplete) {
      const result: ContinueResult = {
        programName: options.program,
        schemaName: status.schemaName,
        hasReady: false,
        allComplete: true,
        readyArtifactId: null,
        instructions: null,
        progress: { done: doneCount, total: totalCount },
      };

      spinner?.stop();

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      console.log();
      console.log(chalk.green(`✓ Program '${options.program}' is complete!`));
      console.log(`  ${doneCount}/${totalCount} artifacts done`);
      console.log();
      console.log('Next steps:');
      console.log(chalk.dim('  programspec evaluate <name>  # Evaluate results'));
      return;
    }

    if (readyArtifacts.length === 0) {
      const result: ContinueResult = {
        programName: options.program,
        schemaName: status.schemaName,
        hasReady: false,
        allComplete: false,
        readyArtifactId: null,
        instructions: null,
        progress: { done: doneCount, total: totalCount },
      };

      spinner?.stop();

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      console.log();
      console.log(chalk.yellow('No artifacts are ready to create.'));
      console.log('Check for blocked dependencies:');
      console.log(chalk.dim(`  programspec status --program ${options.program}`));
      return;
    }

    const nextArtifactId = readyArtifacts[0].id;
    const nextInstructions = generateInstructions(context, nextArtifactId);

    const result: ContinueResult = {
      programName: options.program,
      schemaName: status.schemaName,
      hasReady: true,
      allComplete: false,
      readyArtifactId: nextArtifactId,
      instructions: nextInstructions,
      progress: { done: doneCount, total: totalCount },
    };

    spinner?.stop();

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    printContinueResult(result, options.program);
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

function printContinueResult(result: ContinueResult, programName: string): void {
  console.log();
  console.log(chalk.bold(`Program: ${programName}`));
  console.log(chalk.dim(`Schema: ${result.schemaName}`));
  console.log(chalk.dim(`Progress: ${result.progress.done}/${result.progress.total} artifacts complete`));
  console.log();

  if (!result.instructions) return;

  const instr = result.instructions;

  console.log(chalk.bold(`Next artifact: ${instr.artifactId}`));

  if (instr.description) {
    console.log(chalk.dim(instr.description));
  }

  console.log();
  console.log(chalk.dim(`Output: programs/${programName}/artifacts/${instr.outputPath}`));

  if (instr.instruction) {
    console.log();
    console.log(chalk.bold('Instructions:'));
    console.log(instr.instruction);
  }

  if (instr.template) {
    console.log();
    console.log(chalk.bold('Template:'));
    console.log(chalk.dim('---'));
    console.log(instr.template);
    console.log(chalk.dim('---'));
  }

  if (instr.dependencies.length > 0) {
    console.log();
    console.log(chalk.bold('Dependencies:'));
    for (const dep of instr.dependencies) {
      const marker = dep.done ? chalk.green('✓') : chalk.red('✗');
      console.log(`  ${marker} ${dep.id} → ${dep.path}`);
    }
  }

  if (instr.unlocks.length > 0) {
    console.log();
    console.log(chalk.bold('Unlocks:'));
    for (const unlock of instr.unlocks) {
      console.log(`  → ${unlock}`);
    }
  }

  console.log();
  console.log(chalk.dim(`Run: programspec instructions ${instr.artifactId} --program ${programName}`));
}
