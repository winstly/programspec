import * as fs from 'node:fs';
import * as path from 'node:path';
import { getHomeDir } from '../../utils/home-dir.js';
import { getPackageSchemasDir } from '../../core/artifact-graph/schema.js';

export const DEFAULT_SCHEMA = 'spec-driven';
export const WORKSPACE_METADATA_DIR = '.programspec';
export const WORKSPACE_CONFIG_FILE = 'config.yaml';
export const WORKSPACE_PROGRAMS_DIR = 'programs';

/**
 * Validate program name follows kebab-case convention.
 */
export function validateProgramName(name: string): { valid: boolean; error?: string } {
  const kebabCasePattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

  if (!name) {
    return { valid: false, error: 'Program name cannot be empty' };
  }

  if (!kebabCasePattern.test(name)) {
    if (/[A-Z]/.test(name)) {
      return { valid: false, error: 'Program name must be lowercase (use kebab-case)' };
    }
    if (/\s/.test(name)) {
      return { valid: false, error: 'Program name cannot contain spaces' };
    }
    if (/_/.test(name)) {
      return { valid: false, error: 'Program name cannot contain underscores' };
    }
    return { valid: false, error: 'Program name must follow kebab-case convention (e.g., my-app)' };
  }

  return { valid: true };
}

/**
 * Check if a schema exists
 */
export function validateSchemaExists(schemaName: string, projectRoot: string): string {
  const searchPaths = [
    path.join(projectRoot, 'schemas', schemaName),
    path.join(projectRoot, 'schemas', `${schemaName}.yaml`),
    path.join(projectRoot, '.programspec', 'workflows', schemaName),
    path.join(getHomeDir(), '.programspec', 'schemas', schemaName),
    path.join(getPackageSchemasDir(), schemaName),
  ];

  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      return schemaName;
    }
  }

  throw new Error(`Schema '${schemaName}' not found. Run 'programspec schemas' to see available schemas.`);
}

/**
 * Check if a program exists
 */
export async function getAvailablePrograms(projectRoot: string): Promise<string[]> {
  const programsDir = path.join(projectRoot, 'programs');

  if (!fs.existsSync(programsDir)) {
    return [];
  }

  const entries = await fs.promises.readdir(programsDir, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();
}

/**
 * Validate program exists
 */
export async function validateProgramExists(
  programName: string,
  projectRoot: string
): Promise<string> {
  const programDir = path.join(projectRoot, 'programs', programName);

  if (!fs.existsSync(programDir)) {
    const available = await getAvailablePrograms(projectRoot);
    if (available.length === 0) {
      throw new Error(`No programs found. Create one with: programspec new program <name>`);
    }
    throw new Error(
      `Program '${programName}' not found.\n\nAvailable programs:\n  ${available.join('\n  ')}`
    );
  }

  return programName;
}