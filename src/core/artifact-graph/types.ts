/**
 * Types for artifact graph and schema definitions
 */

export interface Artifact {
  id: string;
  description: string;
  generates: string;
  requires: string[];
  instruction?: string;
  template?: string;
}

export interface ApplyConfig {
  requires: string[];
  command?: string;
}

export interface SchemaYaml {
  name: string;
  version: number;
  artifacts: Artifact[];
  apply?: ApplyConfig;
}

export type CompletedSet = Set<string>;

export type BlockedArtifacts = Record<string, string[]>;

export const ArtifactSchema = {
  id: (value: unknown): value is string => typeof value === 'string' && value.length > 0,
  requires: (value: unknown): value is string[] => Array.isArray(value),
};