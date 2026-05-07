import type { WorkflowTemplate } from '../types.js';

const STATUS_INSTRUCTION = `
# View Program Status

Display the completion status of all artifacts in a program.

---

## Input

The user runs: \`programspec status --program <name> [--schema <schema>] [--json]\`

**Required:**
- \`--program <name>\` — Program name to show status for

**Optional:**
- \`--schema <schema>\` — Schema override (default: from config)
- \`--json\` — Output as JSON

**If --program is missing:**
1. Run \`programspec list --json\` to get available programs
2. If no programs exist: show "No programs found. Create one with: programspec new program <name>"
3. If programs exist: show available programs and ask user to specify one

**If program does not exist:**
- Show: "Program '<name>' not found. Available programs: ..."
- Exit

---

## Steps

### 1. Load program context

\`\`\`bash
cat programs/<name>/metadata.json
\`\`\`

Read the schema name from metadata (or use --schema override).

### 2. Load schema

\`\`\`bash
cat schemas/<schema>/schema.yaml
\`\`\`

Parse the schema to get:
- \`artifacts\`: list of artifacts with dependencies
- \`apply.requires\`: which artifacts are needed for completion

### 3. Detect completed artifacts

Check which artifact output files exist:

\`\`\`
artifacts/intent.md      → exists? ✓
artifacts/modeling.md    → exists? ✓
artifacts/planning.md    → exists? ✗
artifacts/execution.md   → exists? ✗
artifacts/evaluation.md  → exists? ✗
artifacts/learning.md    → exists? ✗
artifacts/evolution.md   → exists? ✗
\`\`\`

### 4. Compute artifact status

For each artifact:
- **done** — Output file exists
- **ready** — All dependencies are done, artifact can be worked on
- **blocked** — One or more dependencies are not done

### 5. Display status

---

## Output

### Text format (default):
\`\`\`
Program: my-app
Schema:  spec-driven
Progress: 2/7 artifacts complete

✓ intent
✓ modeling
→ planning (blocked by: modeling)
✗ execution (blocked by: planning)
✗ evaluation (blocked by: execution)
✗ learning (blocked by: evaluation)
✗ evolution (blocked by: learning)
\`\`\`

**Legend:**
- \`✓\` = done (green)
- \`→\` = ready to work on (yellow)
- \`✗\` = blocked (red)

### JSON format (\`--json\`):
\`\`\`json
{
  "programName": "my-app",
  "schemaName": "spec-driven",
  "isComplete": false,
  "artifacts": [
    { "id": "intent", "outputPath": "artifacts/intent.md", "status": "done" },
    { "id": "modeling", "outputPath": "artifacts/modeling.md", "status": "done" },
    { "id": "planning", "outputPath": "artifacts/planning.md", "status": "ready" },
    { "id": "execution", "outputPath": "artifacts/execution.md", "status": "blocked", "missingDeps": ["planning"] }
  ]
}
\`\`\`

### If all complete:
\`\`\`
Program: my-app
Schema:  spec-driven
Progress: 7/7 artifacts complete ✓

All artifacts complete!
\`\`\`

---

## Guardrails

- **DO** show status in dependency order (topological sort)
- **DO** color-code the output (green/yellow/red)
- **DO** show which dependencies are missing for blocked artifacts
- **DON'T** modify any files — this is read-only
- **DON'T** show artifact content — only status
`;

export const statusWorkflow: WorkflowTemplate = {
  skill: {
    name: 'programspec-status',
    description: 'Display artifact completion status for a program. Use when the user wants to check progress, see what artifacts are done, or understand what needs to be done next.',
    instructions: STATUS_INSTRUCTION,
    license: 'MIT',
    compatibility: 'Requires programspec CLI.',
    metadata: {
      version: '1.0.0',
      author: 'programspec',
      generatedBy: '0.1.0',
    },
  },
  command: {
    name: 'programspec Status',
    description: 'Display artifact completion status for a program',
    category: 'Workflow',
    tags: ['status', 'progress'],
    content: STATUS_INSTRUCTION,
  },
};
