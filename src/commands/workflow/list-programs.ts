import ora from 'ora';
import path from 'path';
import * as fs from 'fs';

export async function listProgramsCommand(options?: { json?: boolean }): Promise<void> {
  const spinner = options?.json ? undefined : ora('Loading programs...').start();

  try {
    const projectRoot = process.cwd();
    const programsDir = path.join(projectRoot, 'programs');

    if (!fs.existsSync(programsDir)) {
      spinner?.stop();
      if (options?.json) {
        console.log(JSON.stringify({ programs: [] }, null, 2));
        return;
      }
      console.log('No programs found. Create one with: programspec new program <name>');
      return;
    }

    const entries = await fs.promises.readdir(programsDir, { withFileTypes: true });
    const programs = entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort();

    spinner?.stop();

    if (options?.json) {
      console.log(JSON.stringify({ programs }, null, 2));
      return;
    }

    if (programs.length === 0) {
      console.log('No programs found. Create one with: programspec new program <name>');
      return;
    }

    console.log(`Programs (${programs.length}):\n`);
    for (const program of programs) {
      const metaPath = path.join(programsDir, program, 'metadata.json');
      let schema = 'unknown';
      let created = '';

      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
          schema = meta.schema || 'unknown';
          created = meta.created ? ` (${meta.created})` : '';
        } catch {
          // ignore
        }
      }

      console.log(`  ${program}${created} [${schema}]`);
    }
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}