import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { Orchestrator } from './orchestrator.js';

describe('Orchestrator', () => {
  let tmpDir: string;
  let orchestrator: Orchestrator;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `progspec-orch-${Date.now()}`);
    const profileDir = path.join(tmpDir, 'programs', 'test-app', 'profile');
    fs.mkdirSync(profileDir, { recursive: true });
    fs.writeFileSync(path.join(profileDir, 'profile.json'), JSON.stringify({
      name: 'test-app',
      type: 'general',
      techStack: [],
      members: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    const schemaDir = path.join(tmpDir, '.programspec', 'workflows', 'spec-driven');
    fs.mkdirSync(schemaDir, { recursive: true });
    fs.writeFileSync(path.join(schemaDir, 'schema.yaml'), `name: spec-driven
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
  - id: planning
    description: "Plan system"
    generates: "planning.md"
    requires: ["modeling"]
  - id: execution
    description: "Execute plan"
    generates: "execution.md"
    requires: ["planning"]
  - id: evaluation
    description: "Evaluate result"
    generates: "evaluation.md"
    requires: ["execution"]
`);
    orchestrator = new Orchestrator(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('maps stages to correct agents', () => {
    expect(orchestrator.getAgentForStage('intent')).toBe('intent-agent');
    expect(orchestrator.getAgentForStage('planning')).toBe('planner-agent');
    expect(orchestrator.getAgentForStage('execution')).toBe('coder-agent');
    expect(orchestrator.getAgentForStage('unknown')).toBe('coder-agent');
  });

  it('returns all agents for a stage', () => {
    const planningAgents = orchestrator.getAllAgentsForStage('planning');
    expect(planningAgents).toContain('planner-agent');
    expect(planningAgents).toContain('architect-agent');

    const executionAgents = orchestrator.getAllAgentsForStage('execution');
    expect(executionAgents).toContain('coder-agent');
    expect(executionAgents).toContain('qa-agent');
    expect(executionAgents).toContain('reviewer-agent');

    const intentAgents = orchestrator.getAllAgentsForStage('intent');
    expect(intentAgents).toEqual(['intent-agent']);
  });

  it('executes stage and returns pending status', async () => {
    const result = await orchestrator.executeStage('test-app', 'intent');
    expect(result.stage).toBe('intent');
    expect(result.agent).toBe('intent-agent');
    expect(result.status).toBe('pending');
  });
});
