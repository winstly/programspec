import { describe, it, expect } from 'vitest';
import { parseSchema } from './schema.js';

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
