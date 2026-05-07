import * as fs from 'node:fs';
import * as path from 'node:path';
import { FileSystemUtils } from '../utils/file-system.js';

/**
 * Base Memory Store interface
 */
export interface MemoryStore<T> {
  read(key: string): Promise<T | null>;
  write(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
}

/**
 * Base class for file-based memory stores
 */
export class FileMemoryStore<T> implements MemoryStore<T> {
  constructor(
    protected baseDir: string,
    protected extension: string = '.json'
  ) {}

  protected getFilePath(key: string): string {
    const safeKey = key.replace(/[^a-z0-9-_/]/gi, '-');
    const filename = safeKey.endsWith(this.extension)
      ? safeKey
      : safeKey + this.extension;
    return path.join(this.baseDir, filename);
  }

  async read(key: string): Promise<T | null> {
    const filePath = this.getFilePath(key);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }

  async write(key: string, value: T): Promise<void> {
    const filePath = this.getFilePath(key);
    await FileSystemUtils.writeFile(filePath, JSON.stringify(value, null, 2));
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  async list(prefix?: string): Promise<string[]> {
    if (!fs.existsSync(this.baseDir)) {
      return [];
    }

    const files = await fs.promises.readdir(this.baseDir, { withFileTypes: true });
    const keys: string[] = [];

    for (const file of files) {
      if (file.isFile() && file.name.endsWith(this.extension)) {
        let key = file.name.replace(this.extension, '');
        if (prefix && !key.startsWith(prefix)) {
          continue;
        }
        keys.push(key);
      } else if (file.isDirectory() && !prefix) {
        keys.push(file.name);
      }
    }

    return keys.sort();
  }
}