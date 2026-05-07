import type { Artifact, SchemaYaml, CompletedSet, BlockedArtifacts } from './types.js';

/**
 * Represents an artifact dependency graph.
 * Provides methods for querying build order, ready artifacts, and completion status.
 */
export class ArtifactGraph {
  private artifacts: Map<string, Artifact>;
  private schema: SchemaYaml;

  private constructor(schema: SchemaYaml) {
    this.schema = schema;
    this.artifacts = new Map(schema.artifacts.map(a => [a.id, a]));
  }

  static fromYaml(schema: SchemaYaml): ArtifactGraph {
    return new ArtifactGraph(schema);
  }

  getArtifact(id: string): Artifact | undefined {
    return this.artifacts.get(id);
  }

  getAllArtifacts(): Artifact[] {
    return Array.from(this.artifacts.values());
  }

  getName(): string {
    return this.schema.name;
  }

  getVersion(): number {
    return this.schema.version;
  }

  /**
   * Computes the topological build order using Kahn's algorithm.
   */
  getBuildOrder(): string[] {
    const inDegree = new Map<string, number>();
    const dependents = new Map<string, string[]>();

    for (const artifact of this.artifacts.values()) {
      inDegree.set(artifact.id, artifact.requires.length);
      dependents.set(artifact.id, []);
    }

    for (const artifact of this.artifacts.values()) {
      for (const req of artifact.requires) {
        if (dependents.has(req)) {
          dependents.get(req)!.push(artifact.id);
        }
      }
    }

    const queue = [...this.artifacts.keys()]
      .filter(id => inDegree.get(id) === 0)
      .sort();

    const result: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const newlyReady: string[] = [];
      for (const dep of dependents.get(current)!) {
        const newDegree = inDegree.get(dep)! - 1;
        inDegree.set(dep, newDegree);
        if (newDegree === 0) {
          newlyReady.push(dep);
        }
      }
      queue.push(...newlyReady.sort());
    }

    return result;
  }

  getNextArtifacts(completed: CompletedSet): string[] {
    const ready: string[] = [];

    for (const artifact of this.artifacts.values()) {
      if (completed.has(artifact.id)) continue;

      const allDepsCompleted = artifact.requires.every(req => completed.has(req));
      if (allDepsCompleted) {
        ready.push(artifact.id);
      }
    }

    return ready.sort();
  }

  isComplete(completed: CompletedSet): boolean {
    for (const artifact of this.artifacts.values()) {
      if (!completed.has(artifact.id)) return false;
    }
    return true;
  }

  getBlocked(completed: CompletedSet): BlockedArtifacts {
    const blocked: BlockedArtifacts = {};

    for (const artifact of this.artifacts.values()) {
      if (completed.has(artifact.id)) continue;

      const unmetDeps = artifact.requires.filter(req => !completed.has(req));
      if (unmetDeps.length > 0) {
        blocked[artifact.id] = unmetDeps.sort();
      }
    }

    return blocked;
  }
}