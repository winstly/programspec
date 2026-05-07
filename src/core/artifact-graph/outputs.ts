import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';

/**
 * Check if an artifact output path exists.
 * Supports both simple file paths and glob patterns.
 */
export function artifactOutputExists(changeDir: string, generates: string): boolean {
  const fullPath = path.join(changeDir, generates);

  if (generates.includes('*')) {
    // Glob pattern
    return isGlobPattern(fullPath) && resolveGlobPattern(fullPath).length > 0;
  }

  return fs.existsSync(fullPath);
}

/**
 * Resolve glob patterns to matching files.
 */
export function resolveGlobPattern(pattern: string): string[] {
  try {
    return glob.sync(pattern, { nodir: true });
  } catch {
    return [];
  }
}

/**
 * Check if a path contains glob pattern characters.
 */
export function isGlobPattern(pathStr: string): boolean {
  return /[*?[\]{}]/.test(pathStr);
}