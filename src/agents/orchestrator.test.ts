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
  - id: learning
    description: "Capture lessons"
    generates: "learning.md"
    requires: ["evaluation"]
  - id: evolution
    description: "Evolve strategies"
    generates: "evolution.md"
    requires: ["learning"]
`);
    orchestrator = new Orchestrator(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('maps stages to correct agents', () => {
    expect(orchestrator.getAgentForStage('intent')?.name).toBe('Intent Agent');
    expect(orchestrator.getAgentForStage('planning')?.name).toBe('Architect Agent');
    expect(orchestrator.getAgentForStage('execution')?.name).toBe('Coder Agent');
    expect(orchestrator.getAgentForStage('unknown')).toBeNull();
  });

  it('returns all agents for a stage', () => {
    const planningAgents = orchestrator.getAllAgentsForStage('planning');
    const planningNames = planningAgents.map(a => a.name);
    expect(planningNames).toContain('Planner Agent');
    expect(planningNames).toContain('Architect Agent');

    const executionAgents = orchestrator.getAllAgentsForStage('execution');
    const executionNames = executionAgents.map(a => a.name);
    expect(executionNames).toContain('Coder Agent');
    expect(executionNames).toContain('QA Agent');
    expect(executionNames).toContain('Reviewer Agent');

    const intentAgents = orchestrator.getAllAgentsForStage('intent');
    const intentNames = intentAgents.map(a => a.name);
    expect(intentNames).toEqual(['Intent Agent']);
  });

  it('executes stage and returns pending status', async () => {
    const result = await orchestrator.executeStage('test-app', 'intent');
    expect(result.stage).toBe('intent');
    expect(result.agent).toBe('Intent Agent');
    expect(result.status).toBe('pending');
  });
});
