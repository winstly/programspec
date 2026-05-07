import { Command } from 'commander';
import { createRequire } from 'module';
import ora from 'ora';
import path from 'path';
import * as fs from 'node:fs';
import { showWelcome } from './welcome.js';
import {
  statusCommand,
  templatesCommand,
  schemasCommand,
  newProgramCommand,
  listProgramsCommand,
  DEFAULT_SCHEMA,
  type StatusOptions,
  type TemplatesOptions,
  type SchemasOptions,
  type NewProgramOptions,
} from '../commands/workflow/index.js';

const program = new Command();
const require = createRequire(import.meta.url);
const { version } = require('../../package.json');

program
  .name('programspec')
  .description('AI Native Development Operating System')
  .version(version);

program.option('--no-color', 'Disable color output');

program.hook('preAction', async (thisCommand, _actionCommand) => {
  const opts = thisCommand.opts();
  if (opts.color === false) {
    process.env.NO_COLOR = '1';
  }
});

program.hook('postAction', async () => {
  // Shutdown cleanup if needed
});

program
  .command('init [path]')
  .description('Initialize programspec in your project')
  .option('--force', 'Auto-overwrite existing files')
  .action(async (targetPath = '.', options?: { force?: boolean }) => {
    try {
      const resolvedPath = path.resolve(targetPath);
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Path "${targetPath}" does not exist. Create it first or specify an existing directory.`);
      }
      const stats = await fs.promises.stat(resolvedPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path "${targetPath}" is not a directory`);
      }
      const initModule = await import('../core/init.js');
      await initModule.initCommand(resolvedPath, options ?? {});
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all programs')
  .option('--json', 'Output as JSON')
  .action(async (options?: { json?: boolean }) => {
    try {
      await listProgramsCommand(options);
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Display artifact completion status for a program')
  .option('--program <name>', 'Program name to show status for')
  .option('--schema <name>', 'Schema override')
  .option('--json', 'Output as JSON')
  .action(async (options: StatusOptions) => {
    try {
      await statusCommand(options);
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('schemas')
  .description('List available workflow schemas')
  .option('--json', 'Output as JSON')
  .action(async (options: SchemasOptions) => {
    try {
      await schemasCommand(options);
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('templates')
  .description('Show resolved template paths for all artifacts in a schema')
  .option('--schema <name>', `Schema to use (default: ${DEFAULT_SCHEMA})`)
  .option('--json', 'Output as JSON')
  .action(async (options: TemplatesOptions) => {
    try {
      await templatesCommand(options);
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('agents')
  .description('Manage and list agents')
  .option('--json', 'Output as JSON')
  .action(async (options?: { json?: boolean }) => {
    try {
      const agentsModule = await import('../agents/commands.js');
      await agentsModule.listAgentsCommand(options);
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

const newCmd = program.command('new').description('Create new items');

newCmd
  .command('program <name>')
  .description('Create a new program')
  .option('--schema <name>', `Schema to use (default: ${DEFAULT_SCHEMA})`)
  .option('--description <text>', 'Program description')
  .action(async (name: string, options: NewProgramOptions) => {
    try {
      await newProgramCommand(name, options);
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Run command - execute a program (fast-forward mode)
program
  .command('run <name>')
  .description('Run a program through all execution stages (fast-forward mode)')
  .option('--dry-run', 'Show what would be executed without running')
  .option('--from <stage>', 'Start from a specific stage')
  .option('--json', 'Output as JSON')
  .action(async (name: string, options?: { dryRun?: boolean; from?: string; json?: boolean }) => {
    try {
      const orchestratorModule = await import('../agents/orchestrator.js');
      const { Orchestrator } = orchestratorModule;

      const projectRoot = process.cwd();
      const orchestrator = new Orchestrator(projectRoot);

      const result = await orchestrator.runProgram(name, {
        dryRun: options?.dryRun,
        fromStage: options?.from,
      });

      if (options?.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      console.log('\nExecution Summary:');
      console.log(`  Total stages: ${result.totalStages}`);
      console.log(`  Completed: ${result.completed}`);
      console.log(`  Failed: ${result.failed}`);
      console.log(`  Pending: ${result.pending}`);
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Continue command - get next ready artifact
program
  .command('continue')
  .description('Continue working on a program - get the next artifact to create')
  .option('--program <name>', 'Program name to continue')
  .option('--schema <name>', 'Schema override')
  .option('--json', 'Output as JSON')
  .action(async (options?: { program?: string; schema?: string; json?: boolean }) => {
    try {
      const { continueCommand } = await import('../commands/workflow/continue-program.js');
      await continueCommand(options ?? {});
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Instructions command - get instructions for creating an artifact
program
  .command('instructions <artifact-id>')
  .description('Get instructions for creating a specific artifact')
  .option('--program <name>', 'Program name')
  .option('--schema <name>', 'Schema override')
  .option('--json', 'Output as JSON')
  .action(async (artifactId: string, options?: { program?: string; schema?: string; json?: boolean }) => {
    try {
      const { instructionsCommand } = await import('../commands/workflow/instructions.js');
      await instructionsCommand(artifactId, options ?? {});
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Evaluate command
program
  .command('evaluate <name>')
  .description('Evaluate a program against its success criteria')
  .option('--json', 'Output as JSON')
  .action(async (name: string, options?: { json?: boolean }) => {
    try {
      const programDir = path.join(process.cwd(), 'programs', name);

      if (!fs.existsSync(programDir)) {
        throw new Error(`Program '${name}' not found`);
      }

      // For now, just check if evaluation artifact exists
      const evalPath = path.join(programDir, 'artifacts', 'evaluation.md');

      if (options?.json) {
        console.log(JSON.stringify({
          program: name,
          hasEvaluation: fs.existsSync(evalPath),
        }, null, 2));
        return;
      }

      if (fs.existsSync(evalPath)) {
        console.log(`Evaluation for '${name}' exists.`);
        console.log(`See: programs/${name}/artifacts/evaluation.md`);
      } else {
        console.log(`No evaluation found for '${name}'.`);
        console.log('Run the program first to generate evaluation.');
      }
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Evolve command
program
  .command('evolve')
  .description('Run system evolution - analyze and update strategies')
  .option('--dry-run', 'Show what would change without making changes')
  .option('--json', 'Output as JSON')
  .action(async (options?: { dryRun?: boolean; json?: boolean }) => {
    try {
      const evolutionModule = await import('../agents/evolution/commands.js');
      await evolutionModule.evolveCommand(options);
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Analyze command
program
  .command('analyze')
  .description('Analyze evolution recommendations')
  .option('--json', 'Output as JSON')
  .action(async (options?: { json?: boolean }) => {
    try {
      const evolutionModule = await import('../agents/evolution/commands.js');
      await evolutionModule.analyzeCommand(options);
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Explore command
program
  .command('explore')
  .description('Enter explore mode for thinking and investigation')
  .option('--program <name>', 'Explore in context of a program')
  .action(async (options?: { program?: string }) => {
    try {
      console.log('\nEntering explore mode...');
      console.log('This is a thinking partner mode for investigating ideas and problems.\n');

      if (options?.program) {
        console.log(`Context: program '${options.program}'`);
        const programDir = path.join(process.cwd(), 'programs', options.program);
        if (fs.existsSync(programDir)) {
          console.log(`  artifacts/  - Generated artifacts`);
          console.log(`  profile/    - Program profile`);
          console.log(`  task-graph/ - Task dependency graph`);
        } else {
          console.log(`  Program '${options.program}' not found.`);
        }
      }

      console.log('\nUse explore mode to:');
      console.log('  - Clarify requirements and goals');
      console.log('  - Investigate design options');
      console.log('  - Map out system architecture');
      console.log('  - Identify risks and unknowns\n');
      console.log('When ready, create a program:');
      console.log('  programspec new program <name>');
      console.log('  programspec continue --program <name>\n');
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Update command - refresh tool commands and skills
program
  .command('update')
  .description('Refresh generated commands and skills for detected AI tools')
  .option('--json', 'Output as JSON')
  .action(async (options?: { json?: boolean }) => {
    try {
      const { updateCommand } = await import('../commands/workflow/update.js');
      await updateCommand(options);
    } catch (error) {
      console.log();
      ora().fail(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// Show welcome page when no arguments provided
if (process.argv.length <= 2) {
  showWelcome();
  process.exit(0);
}

program.parse();
