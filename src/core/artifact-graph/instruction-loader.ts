import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { getHomeDir } from '../../utils/home-dir.js';
import { loadSchema } from './schema.js';
import { ArtifactGraph } from './graph.js';
import { detectCompleted } from './state.js';

export interface ProgramContext {
  graph: ArtifactGraph;
  completed: CompletedSet;
  schemaName: string;
  programName: string;
  programDir: string;
  projectRoot: string;
}

export interface ArtifactInstructions {
  programName: string;
  artifactId: string;
  schemaName: string;
  programDir: string;
  outputPath: string;
  description: string;
  instruction: string | undefined;
  template: string;
  dependencies: DependencyInfo[];
  unlocks: string[];
}

export interface DependencyInfo {
  id: string;
  done: boolean;
  path: string;
  description: string;
}

export interface ArtifactStatus {
  id: string;
  outputPath: string;
  status: 'done' | 'ready' | 'blocked';
  missingDeps?: string[];
}

export interface ProgramStatus {
  programName: string;
  schemaName: string;
  isComplete: boolean;
  applyRequires: string[];
  artifacts: ArtifactStatus[];
}

type CompletedSet = Set<string>;

/**
 * Load context for a program including graph and completion state.
 */
export function loadProgramContext(
  projectRoot: string,
  programName: string,
  schemaName?: string
): ProgramContext {
  const programDir = path.join(projectRoot, 'programs', programName);

  let resolvedSchema = schemaName;
  if (!resolvedSchema) {
    const configPath = path.join(projectRoot, '.programspec', 'config.yaml');
    if (fs.existsSync(configPath)) {
      try {
        const config = parseYaml(fs.readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
        if (typeof config?.schema === 'string') {
          resolvedSchema = config.schema;
        }
      } catch {
        // Fall through to default
      }
    }
    resolvedSchema = resolvedSchema || 'spec-driven';
  }

  const schema = loadSchema(resolvedSchema, projectRoot);
  const graph = ArtifactGraph.fromYaml(schema);
  const completed = detectCompleted(graph, programDir);

  return {
    graph,
    completed,
    schemaName: resolvedSchema,
    programName,
    programDir,
    projectRoot,
  };
}

/**
 * Generate enriched instructions for creating an artifact.
 */
export function generateInstructions(
  context: ProgramContext,
  artifactId: string
): ArtifactInstructions {
  const artifact = context.graph.getArtifact(artifactId);
  if (!artifact) {
    throw new Error(`Artifact '${artifactId}' not found in schema '${context.schemaName}'`);
  }

  const templatePath = artifact.template ?? `${artifact.id}.md`;
  const template = loadTemplate(context.schemaName, templatePath, context.projectRoot);
  const dependencies = getDependencyInfo(artifact, context.graph, context.completed);
  const unlocks = getUnlockedArtifacts(context.graph, artifactId);

  return {
    programName: context.programName,
    artifactId: artifact.id,
    schemaName: context.schemaName,
    programDir: context.programDir,
    outputPath: artifact.generates,
    description: artifact.description,
    instruction: artifact.instruction,
    template,
    dependencies,
    unlocks,
  };
}

/**
 * Format the status of all artifacts in a program.
 */
export function formatProgramStatus(context: ProgramContext): ProgramStatus {
  const schema = loadSchema(context.schemaName, context.projectRoot);
  const applyRequires = schema.apply?.requires ?? schema.artifacts.map(a => a.id);

  const ready = new Set(context.graph.getNextArtifacts(context.completed));
  const blocked = context.graph.getBlocked(context.completed);

  const artifactStatuses: ArtifactStatus[] = context.graph.getAllArtifacts().map(artifact => {
    if (context.completed.has(artifact.id)) {
      return { id: artifact.id, outputPath: artifact.generates, status: 'done' as const };
    }

    if (ready.has(artifact.id)) {
      return { id: artifact.id, outputPath: artifact.generates, status: 'ready' as const };
    }

    return {
      id: artifact.id,
      outputPath: artifact.generates,
      status: 'blocked' as const,
      missingDeps: blocked[artifact.id] ?? [],
    };
  });

  // Sort by build order
  const buildOrder = context.graph.getBuildOrder();
  const orderMap = new Map(buildOrder.map((id, idx) => [id, idx]));
  artifactStatuses.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

  return {
    programName: context.programName,
    schemaName: context.schemaName,
    isComplete: context.graph.isComplete(context.completed),
    applyRequires,
    artifacts: artifactStatuses,
  };
}

function getDependencyInfo(
  artifact: { requires: string[] },
  graph: ArtifactGraph,
  completed: CompletedSet
): DependencyInfo[] {
  return artifact.requires.map(id => {
    const depArtifact = graph.getArtifact(id);
    return {
      id,
      done: completed.has(id),
      path: depArtifact?.generates ?? id,
      description: depArtifact?.description ?? '',
    };
  });
}

function getUnlockedArtifacts(graph: ArtifactGraph, artifactId: string): string[] {
  const unlocks: string[] = [];
  for (const artifact of graph.getAllArtifacts()) {
    if (artifact.requires.includes(artifactId)) {
      unlocks.push(artifact.id);
    }
  }
  return unlocks.sort();
}

function loadTemplate(schemaName: string, templatePath: string, projectRoot: string): string {
  const searchPaths = [
    path.join(projectRoot, 'schemas', schemaName, 'templates', templatePath),
    path.join(projectRoot, 'schemas', schemaName, templatePath),
    path.join(projectRoot, '.programspec', 'workflows', schemaName, 'templates', templatePath),
    path.join(projectRoot, '.programspec', 'workflows', schemaName, templatePath),
    path.join(getHomeDir(), '.programspec', 'schemas', schemaName, 'templates', templatePath),
  ];

  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf-8');
    }
  }

  throw new Error(`Template not found: ${templatePath}`);
}