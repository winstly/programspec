import ora from 'ora';
import { listSchemas } from '../../core/artifact-graph/index.js';

export interface SchemasOptions {
  json?: boolean;
}

export async function schemasCommand(options: SchemasOptions): Promise<void> {
  const spinner = options.json ? undefined : ora('Loading schemas...').start();

  try {
    const projectRoot = process.cwd();
    const schemas = listSchemas(projectRoot);

    spinner?.stop();

    if (options.json) {
      console.log(JSON.stringify({ schemas }, null, 2));
      return;
    }

    console.log(`Available schemas (${schemas.length}):\n`);
    for (const schema of schemas) {
      console.log(`  ${schema}`);
    }
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}