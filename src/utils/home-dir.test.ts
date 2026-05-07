import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import { getHomeDir } from './home-dir.js';

describe('getHomeDir', () => {
  it('returns a non-empty string', () => {
    expect(typeof getHomeDir()).toBe('string');
    expect(getHomeDir().length).toBeGreaterThan(0);
  });

  it('returns a directory that exists', () => {
    expect(fs.existsSync(getHomeDir())).toBe(true);
  });
});
