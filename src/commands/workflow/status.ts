import ora from 'ora';
import chalk from 'chalk';
import {
  loadProgramContext,
  formatProgramStatus,
  type ProgramStatus,
} from '../../core/artifact-graph/index.js';
import {
  validateProgramExists,
  validateSchemaExists,
  getAvailablePrograms,
} from './shared.js';

export interface StatusOptions {
  program?: string;
  schema?: string;
  json?: boolean;
}

export async function statusCommand(options: StatusOptions): Promise<void> {
  const spinner = options.json ? undefined : ora('Loading program status...').start();

  try {
    const projectRoot = process.cwd();

    if (!options.program) {
      const available = await getAvailablePrograms(projectRoot);
      if (available.length === 0) {
        spinner?.stop();
        if (options.json) {
          console.log(JSON.stringify({ programs: [], message: 'No programs found.' }, null, 2));
          return;
        }
        console.log('No programs found. Create one with: programspec new program <name>');
        return;
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

    spinner?.stop();

    if (options.json) {
      console.log(JSON.stringify(status, null, 2));
      return;
    }

    printStatusText(status);
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

export function printStatusText(status: ProgramStatus): void {
  const doneCount = status.artifacts.filter(a => a.status === 'done').length;
  const total = status.artifacts.length;

  console.log(`Program: ${status.programName}`);
  console.log(`Schema:  ${status.schemaName}`);
  console.log(`Progress: ${doneCount}/${total} artifacts complete`);
  console.log();

  for (const artifact of status.artifacts) {
    let indicator: string;
    let colorFn: (text: string) => string;

    switch (artifact.status) {
      case 'done':
        indicator = '✓';
        colorFn = chalk.green;
        break;
      case 'ready':
        indicator = '→';
        colorFn = chalk.yellow;
        break;
      case 'blocked':
        indicator = '✗';
        colorFn = chalk.red;
        break;
    }

    let line = `${indicator} ${artifact.id}`;

    if (artifact.status === 'blocked' && artifact.missingDeps && artifact.missingDeps.length > 0) {
      line += colorFn(` (blocked by: ${artifact.missingDeps.join(', ')})`);
    }

    console.log(colorFn(line));
  }

  if (status.isComplete) {
    console.log();
    console.log(chalk.green('All artifacts complete!'));
  }
}