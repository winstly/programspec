import type { WorkflowTemplate } from '../types.js';

const NEW_PROGRAM_INSTRUCTION = `
# Create New Program

Create a new program with programspec - set up the directory structure and show the first artifact instructions, then STOP and wait for user direction.

---

## Input

The user runs: \`programspec new program <name> [--schema <schema>] [--description <text>]\`

**Required:**
- \`<name>\` — Program name (kebab-case, e.g., "my-app", "data-pipeline")

**Optional:**
- \`--schema <schema>\` — Workflow schema to use (default: "spec-driven")
- \`--description <text>\` — Brief description of the program

**If name is missing:**
1. Use the **AskUserQuestion tool** to ask for the program name
2. Validate name is kebab-case (lowercase, numbers, hyphens only)

**If name already exists:**
- Suggest continuing that program instead: "Program '<name>' already exists. Want to continue working on it?"
- If yes, proceed with the continue workflow

---

## Steps

### 1. Validate program name

\`\`\`
Rules:
- Must be lowercase
- Must be kebab-case (hyphens allowed, no spaces)
- Must start with a letter
- Can contain: a-z, 0-9, -
- Max 50 characters
\`\`\`

**If invalid:**
- Show: "Invalid program name. Use kebab-case: lowercase letters, numbers, and hyphens."
- Exit

### 2. Check schema exists

\`\`\`bash
programspec schemas --json
\`\`\`

- If schema does not exist: show available schemas, exit
- If schema exists: continue

### 3. Create the program

\`\`\`bash
programspec new program "<name>"
\`\`\`

Add \`--schema <name>\` only if the user requested a different workflow.

### 4. Show the artifact status

\`\`\`bash
programspec status --program "<name>"
\`\`\`

This shows which artifacts need to be created and which are ready (dependencies satisfied).

### 5. Get instructions for the first artifact

The first artifact depends on the schema (e.g., \`intent\` for spec-driven).
Check the status output to find the first artifact with status "ready".
\`\`\`bash
programspec instructions <first-artifact-id> --program "<name>"
\`\`\`

This outputs the template and instructions for creating the first artifact.

### 6. STOP and wait for user direction

**Do NOT create any artifacts yet.** Just show the instructions and wait.

---

## Output

After completing the steps, summarize:
- Program name and location
- Schema/workflow being used and its artifact sequence
- Current status (0/N artifacts complete)
- The instructions for the first artifact
- Prompt: "Ready to create the first artifact? Run \`programspec continue --program <name>\` or just describe what this program is about and I'll draft it."

---

## Guardrails

- **DO** validate name format before creating anything
- **DO** create all subdirectories needed for the 7-stage workflow
- **DO** initialize profile files with sensible defaults
- **DON'T** create any artifacts yet - just show the instructions
- **DON'T** advance beyond showing the first artifact template
- **DON'T** start execution — user must run \`programspec continue\` separately
- If the name is invalid (not kebab-case), ask for a valid name
- If a program with that name already exists, suggest continuing that program instead
- Pass --schema if using a non-default workflow
`;

export const newProgramWorkflow: WorkflowTemplate = {
  skill: {
    name: 'programspec-new-program',
    description: 'Create a new program with programspec. Use when the user wants to start a new project, create a program, or set up a new workflow.',
    instructions: NEW_PROGRAM_INSTRUCTION,
    license: 'MIT',
    compatibility: 'Requires programspec CLI.',
    metadata: {
      version: '1.0.0',
      author: 'programspec',
      generatedBy: '0.1.0',
    },
  },
  command: {
    name: 'programspec New Program',
    description: 'Create a new program with programspec',
    category: 'Workflow',
    tags: ['new', 'program', 'workflow'],
    content: NEW_PROGRAM_INSTRUCTION,
  },
};
