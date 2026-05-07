import * as fs from 'node:fs';
import type { CompletedSet } from './types.js';
import type { ArtifactGraph } from './graph.js';
import { artifactOutputExists } from './outputs.js';

/**
 * Detect which artifacts are completed by checking file existence.
 */
export function detectCompleted(graph: ArtifactGraph, programDir: string): CompletedSet {
  const completed = new Set<string>();

  if (!fs.existsSync(programDir)) {
    return completed;
  }

  for (const artifact of graph.getAllArtifacts()) {
    if (artifactOutputExists(programDir, artifact.generates)) {
      completed.add(artifact.id);
    }
  }

  return completed;
}