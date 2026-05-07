import ora from 'ora';
import { loadSchema } from '../../core/artifact-graph/index.js';
import { validateSchemaExists, DEFAULT_SCHEMA } from './shared.js';

export interface TemplatesOptions {
  schema?: string;
  json?: boolean;
}

export async function templatesCommand(options: TemplatesOptions): Promise<void> {
  const spinner = options.json ? undefined : ora('Loading templates...').start();

  try {
    const projectRoot = process.cwd();
    const schemaName = validateSchemaExists(options.schema ?? DEFAULT_SCHEMA, projectRoot);
    const schema = loadSchema(schemaName, projectRoot);

    spinner?.stop();

    if (options.json) {
      const output: Record<string, { generates: string; requires: string[]; description: string }> = {};
      for (const artifact of schema.artifacts) {
        output[artifact.id] = {
          generates: artifact.generates,
          requires: artifact.requires,
          description: artifact.description,
        };
      }
      console.log(JSON.stringify(output, null, 2));
      return;
    }

    console.log(`Schema: ${schema.name}\n`);
    console.log(`Artifacts (${schema.artifacts.length}):\n`);

    for (const artifact of schema.artifacts) {
      console.log(`  ${artifact.id}`);
      console.log(`    Generates: ${artifact.generates}`);
      console.log(`    Requires:  ${artifact.requires.length > 0 ? artifact.requires.join(', ') : '(none)'}`);
      console.log(`    ${artifact.description}`);
      console.log();
    }
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}