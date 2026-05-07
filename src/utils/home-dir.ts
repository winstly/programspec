import * as os from 'node:os';

/**
 * Cross-platform home directory path.
 * On Windows, process.env.HOME is undefined; use USERPROFILE or os.homedir().
 */
export function getHomeDir(): string {
  return process.env.HOME || process.env.USERPROFILE || os.homedir();
}
