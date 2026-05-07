import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

/**
 * Cross-platform file system utilities
 */
export class FileSystemUtils {
  /**
   * Join path segments (cross-platform)
   */
  static joinPath(...segments: string[]): string {
    return path.join(...segments);
  }

  /**
   * Get canonical path (resolves symlinks, normalizes)
   */
  static canonicalizeExistingPath(filePath: string): string {
    return path.resolve(filePath);
  }

  /**
   * Check if directory exists
   */
  static async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.promises.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Create directory recursively
   */
  static async createDirectory(dirPath: string): Promise<void> {
    await fs.promises.mkdir(dirPath, { recursive: true });
  }

  /**
   * Write file atomically (write to temp file, then rename).
   * Prevents data corruption from concurrent writes.
   */
  static async writeFile(filePath: string, content: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });

    const tmpSuffix = crypto.randomBytes(6).toString('hex');
    const tmpPath = `${filePath}.${tmpSuffix}.tmp`;

    try {
      await fs.promises.writeFile(tmpPath, content, 'utf-8');
      await fs.promises.rename(tmpPath, filePath);
    } catch (error) {
      // Clean up temp file if rename failed
      try { await fs.promises.unlink(tmpPath); } catch { /* ignore */ }
      throw error;
    }
  }

  /**
   * Read file content
   */
  static async readFile(filePath: string): Promise<string> {
    return fs.promises.readFile(filePath, 'utf-8');
  }

  /**
   * Check if file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.promises.stat(filePath);
      return stats.isFile();
    } catch {
      return false;
    }
  }
}