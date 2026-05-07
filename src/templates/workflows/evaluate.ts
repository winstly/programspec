import type { WorkflowTemplate } from '../types.js';

const EVALUATE_INSTRUCTION = `
# Evaluate Program

Evaluate whether a program met its success criteria.

---

## Input

The user runs: \`programspec evaluate <name> [--json]\`

**Required:**
- \`<name>\` — Program name to evaluate

**Optional:**
- \`--json\` — Output as JSON

**If program name is missing:**
1. Run \`programspec list --json\` to get available programs
2. Use the **AskUserQuestion tool** to let the user select

**If program does not exist:**
- Show: "Program '<name>' not found."
- Exit

---

## Steps

### 1. Check program completeness

\`\`\`bash
programspec status --program <name> --json
\`\`\`

Parse JSON to check:
- \`isComplete\`: are all artifacts done?
- \`artifacts\`: which ones are missing?

**If not complete:**
- Show which artifacts are missing
- Suggest: "Run \`programspec run <name>\` to complete the program first."
- Exit

### 2. Load program artifacts

Read all artifacts from \`programs/<name>/artifacts/\`:

\`\`\`
artifacts/intent.md      → Parse success metrics
artifacts/modeling.md    → Review system model
artifacts/planning.md    → Check task breakdown
artifacts/execution.md   → Review implementation
artifacts/evaluation.md  → Read evaluation results
artifacts/learning.md    → Review lessons learned
artifacts/evolution.md   → Check evolution plan
\`\`\`

### 3. Evaluate against success criteria

From \`intent.md\`, extract:
- \`goal\`: What was the program trying to achieve?
- \`successMetrics\`: How was success defined?
- \`nonGoals\`: What was explicitly out of scope?

Compare each metric against the actual results in \`evaluation.md\`.

### 4. Generate evaluation report

Create a summary with:
- **Goal achievement**: Did the program meet its goal?
- **Metrics comparison**: Target vs actual for each metric
- **Gaps identified**: What was missed or fell short
- **Recommendations**: What to improve next time

---

## Output

### If program is not complete:
\`\`\`
Program 'my-app' is not complete.

Missing artifacts:
  ✗ planning
  ✗ execution
  ✗ evaluation

Run the program first: programspec run my-app
\`\`\`

### If program is complete:
\`\`\`
Evaluation: my-app
═══════════════════════════════════════

Goal: Build a REST API for user management

Metrics:
  ✓ API endpoints created      5/5
  ✓ Test coverage             85% (target: 80%)
  ✗ Documentation             Incomplete (target: complete)
  ✓ Performance               <100ms (target: <200ms)

Gaps:
  - API documentation was not fully generated
  - Missing OpenAPI spec for 2 endpoints

Recommendations:
  1. Add OpenAPI spec generation to the workflow
  2. Include documentation as a required artifact

Overall: 3/4 metrics achieved (75%)
\`\`\`

### JSON format (\`--json\`):
\`\`\`json
{
  "program": "my-app",
  "complete": true,
  "goalAchieved": true,
  "metrics": [
    { "name": "API endpoints", "target": 5, "actual": 5, "met": true },
    { "name": "Test coverage", "target": 80, "actual": 85, "met": true },
    { "name": "Documentation", "target": "complete", "actual": "incomplete", "met": false }
  ],
  "gaps": ["API documentation incomplete", "Missing OpenAPI spec"],
  "recommendations": ["Add OpenAPI spec generation", "Include documentation artifact"]
}
\`\`\`

---

## Feedback Loop

When evaluation **fails** (metrics not met), the orchestrator will automatically:

1. Loop back to the **Planning** stage
2. Re-plan with updated requirements based on evaluation gaps
3. Re-execute and re-evaluate
4. Maximum 3 retries before stopping

This ensures the system learns from failures and iterates toward success.

\`\`\`
Evaluation Failed → Planning → Execution → Evaluation
     ↑                                    │
     └────────────────────────────────────┘
     (max 3 retries)
\`\`\`

---

## Guardrails

- **DO** check completeness before evaluating
- **DO** compare against the original success criteria from intent.md
- **DO** provide specific, actionable recommendations
- **DON'T** mark metrics as "met" if they only partially achieved the goal
- **DON'T** modify program files — this is read-only analysis
- **DON'T** evaluate if the program hasn't been run yet
`;

export const evaluateWorkflow: WorkflowTemplate = {
  skill: {
    name: 'programspec-evaluate',
    description: 'Evaluate a program against its success criteria. Use when the user wants to check if a program achieved its goals, review metrics, or identify gaps.',
    instructions: EVALUATE_INSTRUCTION,
    license: 'MIT',
    compatibility: 'Requires programspec CLI.',
    metadata: {
      version: '1.0.0',
      author: 'programspec',
      generatedBy: '0.1.0',
    },
  },
  command: {
    name: 'programspec Evaluate',
    description: 'Evaluate a program against its success criteria',
    category: 'Workflow',
    tags: ['evaluate', 'metrics'],
    content: EVALUATE_INSTRUCTION,
  },
};
