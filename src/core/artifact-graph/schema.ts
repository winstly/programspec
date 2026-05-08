import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { getHomeDir } from '../../utils/home-dir.js';
import type { SchemaYaml } from './types.js';

/**
 * Get the package's built-in schemas directory.
 * Navigates from the compiled dist/core/artifact-graph/ up to the package root.
 */
export function getPackageSchemasDir(): string {
  const currentFile = fileURLToPath(import.meta.url);
  const packageRoot = path.resolve(path.dirname(currentFile), '..', '..', '..');
  if (!fs.existsSync(path.join(packageRoot, 'package.json'))) {
    throw new Error(
      `getPackageSchemasDir: could not locate package root from ${currentFile}`
    );
  }
  return path.join(packageRoot, 'schemas');
}

/**
 * Load and parse a schema YAML file.
 */
export function loadSchema(schemaName: string, basePath = process.cwd()): SchemaYaml {
  const schemaPath = resolveSchemaPath(schemaName, basePath);
  if (!schemaPath) {
    throw new SchemaLoadError(`Schema '${schemaName}' not found`, schemaName);
  }

  try {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    return parseSchema(content);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new SchemaLoadError(`Failed to load schema: ${msg}`, schemaName);
  }
}

/**
 * Parse YAML content into a SchemaYaml object with validation.
 */
export function parseSchema(content: string): SchemaYaml {
  const raw = parseYaml(content);

  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid schema: expected an object');
  }

  const schema = raw as Record<string, unknown>;

  if (typeof schema.name !== 'string' || !schema.name) {
    throw new Error('Schema must have a non-empty "name" field');
  }

  if (typeof schema.version !== 'number') {
    throw new Error('Schema must have a "version" number');
  }

  if (!Array.isArray(schema.artifacts) || schema.artifacts.length === 0) {
    throw new Error('Schema must have a non-empty "artifacts" array');
  }

  for (const artifact of schema.artifacts) {
    if (typeof artifact.id !== 'string' || !artifact.id) {
      throw new Error('Each artifact must have a non-empty "id" field');
    }
    if (!Array.isArray(artifact.requires)) {
      throw new Error(`Artifact "${artifact.id}" must have a "requires" array`);
    }
  }

  return schema as unknown as SchemaYaml;
}

/**
 * Resolve schema path by searching in configured directories.
 */
export function resolveSchemaPath(schemaName: string, basePath = process.cwd()): string | null {
  const searchPaths = [
    path.join(basePath, '.programspec', 'workflows', schemaName, 'schema.yaml'),
    path.join(basePath, 'schemas', schemaName, 'schema.yaml'),
    path.join(basePath, 'schemas', `${schemaName}.yaml`),
    path.join(getHomeDir(), '.programspec', 'schemas', schemaName, 'schema.yaml'),
    path.join(getPackageSchemasDir(), schemaName, 'schema.yaml'),
  ];

  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return null;
}

/**
 * List all available schemas.
 */
export function listSchemas(basePath = process.cwd()): string[] {
  const schemas: string[] = [];

  const searchDirs = [
    path.join(basePath, 'schemas'),
    path.join(basePath, '.programspec', 'workflows'),
    path.join(getHomeDir(), '.programspec', 'schemas'),
    getPackageSchemasDir(),
  ];

  for (const dir of searchDirs) {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() || entry.name.endsWith('.yaml')) {
          const name = entry.name.replace(/\.yaml$/, '');
          if (!schemas.includes(name)) {
            schemas.push(name);
          }
        }
      }
    }
  }

  return schemas.sort();
}

export class SchemaLoadError extends Error {
  constructor(message: string, public readonly schemaName: string) {
    super(message);
    this.name = 'SchemaLoadError';
  }
}