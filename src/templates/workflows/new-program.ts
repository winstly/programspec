import type { WorkflowTemplate } from '../types.js';

const NEW_PROGRAM_INSTRUCTION = `
# Create New Program

Create a new program with programspec.

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
- Show: "Program '<name>' already exists. Choose a different name."
- Exit without making changes

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
ls schemas/<schema>/schema.yaml
\`\`\`

- If schema does not exist: show available schemas, exit
- If schema exists: continue

### 3. Create directory structure

\`\`\`bash
mkdir -p programs/<name>/
mkdir -p programs/<name>/artifacts/
mkdir -p programs/<name>/profile/
mkdir -p programs/<name>/profile/memory/decisions/
mkdir -p programs/<name>/profile/memory/preferences/
mkdir -p programs/<name>/task-graph/
mkdir -p programs/<name>/agent-runs/
mkdir -p programs/<name>/specs/
\`\`\`

### 4. Write metadata

Create \`programs/<name>/metadata.json\`:

\`\`\`json
{
  "name": "<name>",
  "schema": "<schema>",
  "created": "2026-05-07",
  "version": "1.0.0"
}
\`\`\`

### 5. Write profile files

**profile.json:**
\`\`\`json
{
  "name": "<name>",
  "type": "general",
  "techStack": [],
  "members": [],
  "created": "2026-05-07"
}
\`\`\`

**conventions.md:**
\`\`\`markdown
# Conventions

Project-specific conventions and guidelines.
\`\`\`

**patterns.md:**
\`\`\`markdown
# Patterns

Common patterns used in this project.
\`\`\`

**agents.yaml:**
\`\`\`yaml
# Agent Configuration for <name>
\`\`\`

---

## Output

### On success:
\`\`\`
✓ Created program '<name>' at programs/<name>/

Next steps:
  programspec status --program <name>  # View program status
  # Edit artifacts/intent.md to define the program intent
\`\`\`

### If name already exists:
\`\`\`
✗ Program '<name>' already exists at programs/<name>/
  Choose a different name.
\`\`\`

### If invalid name:
\`\`\`
✗ Invalid program name '<name>'.
  Use kebab-case: lowercase letters, numbers, and hyphens.
  Example: my-app, data-pipeline, user-auth
\`\`\`

---

## Guardrails

- **DO** validate name format before creating anything
- **DO** create all subdirectories needed for the 7-stage workflow
- **DO** initialize profile files with sensible defaults
- **DON'T** create the program if it already exists
- **DON'T** generate artifacts during creation — only structure
- **DON'T** start execution — user must run \`programspec run <name>\` separately
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
    tags: ['new', 'program'],
    content: NEW_PROGRAM_INSTRUCTION,
  },
};
