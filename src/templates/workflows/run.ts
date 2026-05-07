import type { WorkflowTemplate } from '../types.js';

const RUN_INSTRUCTION = `
# Run Program (Fast-Forward Mode)

Create all artifacts for a program in dependency order. This is the "fast-forward" mode that creates everything at once.

**For step-by-step guided mode, use \`programspec continue --program <name>\` instead.**

---

## Input

The user provides a program name: \`programspec run <name>\`

**Optional flags:**
- \`--dry-run\` — Show what would be executed without running
- \`--from <stage>\` — Start from a specific stage
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

**If all artifacts are done:**
- Show: "All artifacts complete! Program is ready for evaluation."

### 3. Determine execution mode

**If \`--dry-run\` is set:**
1. Show what stages would be executed
2. Show which agent would be used for each stage
3. Do NOT actually execute anything
4. Exit after showing the plan

**If \`--from <stage>\` is set:**
1. Skip all stages before the specified stage
2. Start execution from the specified stage

### 4. Create artifacts in sequence

Use the **TodoWrite tool** to track progress through the artifacts.

Loop through artifacts in dependency order (artifacts with no pending dependencies first):

a. **For each artifact that is \`ready\` (dependencies satisfied)**:
   - Get instructions:
     \`\`\`bash
     programspec instructions <artifact-id> --program "<name>" --json
     \`\`\`
   - Read any completed dependency files for context
   - Create the artifact file using \`template\` as the structure
   - Follow \`instruction\` for content guidance
   - Show brief progress: "Created <artifact-id>"

b. **Continue until all artifacts are complete**
   - After creating each artifact, re-run \`programspec status --program "<name>" --json\`
   - Stop when \`isComplete\` is true

c. **If an artifact requires user input** (unclear context):
   - Use **AskUserQuestion tool** to clarify
   - Then continue with creation

### 5. Show final status

\`\`\`bash
programspec status --program <name>
\`\`\`

---

## Output

### On success:
\`\`\`
✓ All artifacts created for program '<name>'

Progress: 7/7 artifacts complete

Next steps:
  programspec evaluate <name>  # Evaluate results
\`\`\`

### On failure:
\`\`\`
[Stage 4/7] execution ✗ failed
  Error: Build failed with 3 errors

Execution interrupted at stage 4/7.
Fix the errors and run again with: programspec run <name> --from execution
\`\`\`

---

## Guardrails

- **DO** show progress for each artifact as it completes
- **DO** save partial progress if execution fails mid-way
- **DO** suggest \`--from\` flag when resuming after failure
- **DON'T** skip artifacts unless \`--from\` is explicitly set
- **DON'T** run artifacts in parallel — they have dependencies
- **DON'T** execute without validating the program exists first
- **IMPORTANT**: If context is critically unclear, ask the user — but prefer making reasonable decisions to keep momentum
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
    tags: ['run', 'execute', 'workflow'],
    content: RUN_INSTRUCTION,
  },
};
