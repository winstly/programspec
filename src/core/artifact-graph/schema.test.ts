import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseSchema, getPackageSchemasDir, resolveSchemaPath, listSchemas } from './schema.js';

describe('parseSchema', () => {
  const validYaml = `
name: spec-driven
version: 1
artifacts:
  - id: intent
    description: "Define goal"
    generates: "intent.md"
    requires: []
  - id: modeling
    description: "Model system"
    generates: "modeling.md"
    requires: ["intent"]
`;

  it('parses a valid schema', () => {
    const result = parseSchema(validYaml);
    expect(result.name).toBe('spec-driven');
    expect(result.version).toBe(1);
    expect(result.artifacts).toHaveLength(2);
    expect(result.artifacts[0].id).toBe('intent');
    expect(result.artifacts[1].requires).toEqual(['intent']);
  });

  it('throws on missing name', () => {
    expect(() => parseSchema('version: 1\nartifacts: []')).toThrow(/name/);
  });

  it('throws on empty artifacts', () => {
    expect(() => parseSchema('name: test\nversion: 1\nartifacts: []')).toThrow(/artifacts/);
  });

  it('throws on invalid artifact id', () => {
    const invalid = 'name: test\nversion: 1\nartifacts:\n  - description: "x"\n    generates: "x.md"\n    requires: []';
    expect(() => parseSchema(invalid)).toThrow(/id/);
  });
});

describe('getPackageSchemasDir', () => {
  it('returns a directory that exists', () => {
    const dir = getPackageSchemasDir();
    expect(fs.existsSync(dir)).toBe(true);
  });

  it('contains spec-driven/schema.yaml', () => {
    const dir = getPackageSchemasDir();
    expect(fs.existsSync(path.join(dir, 'spec-driven', 'schema.yaml'))).toBe(true);
  });

  it('contains spec-driven templates', () => {
    const dir = getPackageSchemasDir();
    const templatesDir = path.join(dir, 'spec-driven', 'templates');
    expect(fs.existsSync(templatesDir)).toBe(true);
    const templates = fs.readdirSync(templatesDir);
    expect(templates.length).toBeGreaterThan(0);
  });
});

describe('resolveSchemaPath', () => {
  it('finds spec-driven in the package schemas directory', () => {
    const resolved = resolveSchemaPath('spec-driven', '/nonexistent-root');
    expect(resolved).not.toBeNull();
    expect(resolved).toContain('spec-driven');
    expect(resolved).toContain('schema.yaml');
  });

  it('returns null for a nonexistent schema', () => {
    const resolved = resolveSchemaPath('definitely-not-a-schema', '/nonexistent-root');
    expect(resolved).toBeNull();
  });

  it('returns existing path when schema exists in basePath', () => {
    const packageSchemasDir = getPackageSchemasDir();
    const resolved = resolveSchemaPath('spec-driven', path.dirname(path.dirname(packageSchemasDir)));
    expect(resolved).not.toBeNull();
  });
});

describe('listSchemas', () => {
  it('includes spec-driven from package schemas', () => {
    const schemas = listSchemas('/nonexistent-root');
    expect(schemas).toContain('spec-driven');
  });

  it('returns sorted results', () => {
    const schemas = listSchemas('/nonexistent-root');
    const sorted = [...schemas].sort();
    expect(schemas).toEqual(sorted);
  });
});
