import type { WorkflowTemplate } from '../types.js';

const RUN_INSTRUCTION = `
# Run Program

Execute a program through the 7-stage execution workflow.

---

## Input

The user provides a program name: \`programspec run <name>\`

**Optional flags:**
- \`--dry-run\` — Show what would be executed without running
- \`--from <stage>\` — Start from a specific stage (intent, modeling, planning, execution, evaluation, learning, evolution)
- \`--json\` — Output as JSON

**If program name is missing:**
1. Run \`programspec list --json\` to get available programs
2. Use the **AskUserQuestion tool** to let the user select a program
3. If no programs exist, tell the user to create one first with \`programspec new program <name>\`

---

## Steps

### 1. Validate program exists

\`\`\`bash
ls programs/<name>/metadata.json
\`\`\`

- If file does not exist: show error "Program '<name>' not found. Available programs: ..."
- If file exists: read metadata.json to confirm program info

### 2. Check program status

Run:
\`\`\`bash
programspec status --program <name> --json
\`\`\`

Parse the JSON output to understand:
- \`artifacts\`: array of artifact statuses (done/ready/blocked)
- \`isComplete\`: boolean
- \`applyRequires\`: which artifacts are needed

**If all artifacts are done:**
- Show: "All artifacts complete! Program is ready for evaluation."
- Suggest: \`programspec evaluate <name>\`

**If some artifacts are blocked:**
- Show which artifacts are blocked and by what dependencies
- Suggest completing dependencies first

### 3. Determine execution mode

**If \`--dry-run\` is set:**
1. Show what stages would be executed
2. Show which agent would be used for each stage
3. Do NOT actually execute anything
4. Exit after showing the plan

**If \`--from <stage>\` is set:**
1. Skip all stages before the specified stage
2. Start execution from the specified stage

### 4. Execute stages sequentially

For each stage in order (or starting from \`--from\`):

\`\`\`
Stage 1/7: intent      → intent-agent
Stage 2/7: modeling    → modeling-agent
Stage 3/7: planning    → planner-agent
Stage 4/7: execution   → coder-agent
Stage 5/7: evaluation  → evaluation-agent
Stage 6/7: learning    → reflection-agent
Stage 7/7: evolution   → evolution-agent
\`\`\`

For each stage:
1. Print: \`[Stage X/7] <stage-name>\`
2. Run: \`programspec run <name> --from <stage> --json\`
3. Check the result:
   - If \`status: "completed"\`: continue to next stage
   - If \`status: "failed"\`: show error, stop execution
   - If \`status: "pending"\`: show warning, continue

### 5. Show execution summary

After all stages complete (or on failure), show:

\`\`\`
Execution Summary:
  Program:    <name>
  Stages:     X/7 completed
  Duration:   Xm Xs
  Status:     ✓ success / ✗ failed
\`\`\`

---

## Output

### During execution:
\`\`\`
[Orchestrator] Executing stage: intent
[Orchestrator] Agent: intent-agent
[Stage 1/7] intent ✓

[Orchestrator] Executing stage: modeling
[Orchestrator] Agent: modeling-agent
[Stage 2/7] modeling ✓

...

[Orchestrator] Executing stage: execution
[Orchestrator] Agent: coder-agent
[Stage 4/7] execution ✓
\`\`\`

### On success:
\`\`\`
Execution Summary:
  Program:    my-app
  Stages:     7/7 completed
  Duration:   2m 34s
  Status:     ✓ success

Next: programspec evaluate my-app
\`\`\`

### On failure:
\`\`\`
[Stage 4/7] execution ✗ failed
  Error: Build failed with 3 errors

Execution interrupted at stage 4/7.
Fix the errors and run again with: programspec run my-app --from execution
\`\`\`

---

## Guardrails

- **DO** show progress for each stage as it completes
- **DO** save partial progress if execution fails mid-way
- **DO** suggest \`--from\` flag when resuming after failure
- **DON'T** skip stages unless \`--from\` is explicitly set
- **DON'T** run stages in parallel — they have dependencies
- **DON'T** execute without validating the program exists first
`;

export const runWorkflow: WorkflowTemplate = {
  skill: {
    name: 'programspec-run',
    description: 'Run a program through the execution stages. Use when the user wants to execute a program, run the workflow, or process a program through its stages.',
    instructions: RUN_INSTRUCTION,
    license: 'MIT',
    compatibility: 'Requires programspec CLI.',
    metadata: {
      version: '1.0.0',
      author: 'programspec',
      generatedBy: '0.1.0',
    },
  },
  command: {
    name: 'programspec Run',
    description: 'Run a program through the execution stages',
    category: 'Workflow',
    tags: ['run', 'execute'],
    content: RUN_INSTRUCTION,
  },
};
