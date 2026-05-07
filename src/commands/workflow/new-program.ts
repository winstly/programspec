import ora from 'ora';
import path from 'path';
import { promises as fs, existsSync } from 'fs';
import { validateProgramName, validateSchemaExists, DEFAULT_SCHEMA } from './shared.js';

export interface NewProgramOptions {
  schema?: string;
  description?: string;
}

export async function newProgramCommand(name: string, options: NewProgramOptions): Promise<void> {
  const spinner = ora(`Creating program '${name}'...`).start();

  try {
    const validation = validateProgramName(name);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const projectRoot = process.cwd();
    const schemaName = validateSchemaExists(options.schema ?? DEFAULT_SCHEMA, projectRoot);

    const programDir = path.join(projectRoot, 'programs', name);

    if (existsSync(programDir)) {
      throw new Error(`Program '${name}' already exists at ${programDir}`);
    }

    // Create program directory structure
    const dirs = [
      programDir,
      path.join(programDir, 'artifacts'),
      path.join(programDir, 'profile'),
      path.join(programDir, 'profile', 'memory'),
      path.join(programDir, 'profile', 'memory', 'decisions'),
      path.join(programDir, 'profile', 'memory', 'preferences'),
      path.join(programDir, 'task-graph'),
      path.join(programDir, 'agent-runs'),
      path.join(programDir, 'specs'),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }

    // Write metadata
    const metadata = {
      name,
      schema: schemaName,
      created: new Date().toISOString().split('T')[0],
      version: '1.0.0',
    };
    await fs.writeFile(
      path.join(programDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );

    // Write profile
    const profile = {
      name,
      type: 'general',
      techStack: [],
      members: [],
      createdAt: metadata.created,
    };
    await fs.writeFile(
      path.join(programDir, 'profile', 'profile.json'),
      JSON.stringify(profile, null, 2),
      'utf-8'
    );

    // Write initial profile files
    await fs.writeFile(
      path.join(programDir, 'profile', 'conventions.md'),
      '# Conventions\n\nProject-specific conventions and guidelines.\n',
      'utf-8'
    );

    await fs.writeFile(
      path.join(programDir, 'profile', 'patterns.md'),
      '# Patterns\n\nCommon patterns used in this project.\n',
      'utf-8'
    );

    await fs.writeFile(
      path.join(programDir, 'profile', 'agents.yaml'),
      `# Agent Configuration for ${name}\n# Define which agents are available and their configuration\n`,
      'utf-8'
    );

    spinner.succeed(`Created program '${name}' at programs/${name}/`);

    console.log();
    console.log('Next steps:');
    console.log(`  programspec status --program ${name}  # View program status`);
    console.log(`  # Edit artifacts/intent.md to define the program intent`);
  } catch (error) {
    spinner.fail(`Failed to create program '${name}'`);
    throw error;
  }
}