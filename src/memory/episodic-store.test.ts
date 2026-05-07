import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { EpisodicStore } from './episodic-store.js';

describe('EpisodicStore', () => {
  let tmpDir: string;
  let store: EpisodicStore;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `progspec-test-${Date.now()}`);
    fs.mkdirSync(path.join(tmpDir, '.programspec', 'memory', 'episodic'), { recursive: true });
    store = new EpisodicStore(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates a run record', async () => {
    const run = await store.createRun('my-app', 'planning', 'planner-agent');
    expect(run.programName).toBe('my-app');
    expect(run.stage).toBe('planning');
    expect(run.status).toBe('running');
    expect(run.id).toBeTruthy();
  });

  it('stores data in .programspec/memory/episodic', async () => {
    await store.createRun('test-app', 'execution', 'coder-agent');
    const memoryPath = path.join(tmpDir, '.programspec', 'memory', 'episodic');
    const files = await fs.promises.readdir(memoryPath);
    expect(files.length).toBeGreaterThan(0);
  });

  it('updates and completes a run', async () => {
    const run = await store.createRun('test', 'intent', 'intent-agent');
    await store.completeRun(run.id, 'completed');
    const episodes = await store.getRecentRuns(1);
    expect(episodes[0].status).toBe('completed');
    expect(episodes[0].endTime).toBeTruthy();
  });
});
