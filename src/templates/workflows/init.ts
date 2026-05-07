import type { WorkflowTemplate } from '../types.js';

const INIT_INSTRUCTION = `
# Initialize programspec

Set up programspec in the current project.

---

## Input

The user runs: \`programspec init [path] [--force]\`

**Optional arguments:**
- \`[path]\` — Target directory (default: current directory)
- \`--force\` — Overwrite existing configuration

**If already initialized (and no --force):**
1. Check if \`.programspec/config.yaml\` exists in the target directory
2. If exists: show "programspec is already initialized. Use --force to overwrite."
3. Exit without making changes

---

## Steps

### 1. Create directory structure

\`\`\`bash
mkdir -p programs/
mkdir -p schemas/
\`\`\`

### 2. Write configuration file

Create \`.programspec/config.yaml\` with:

\`\`\`yaml
schema: spec-driven
tools: []
\`\`\`

### 3. Detect installed AI tools

Check for tool directories in the project root:

| Tool | Check Path |
|------|-----------|
| Claude Code | \`.claude/skills/\` |
| OpenCode | \`.opencode/skills/\` |
| Cursor | \`.cursor/skills/\` |
| Windsurf | \`.windsurf/skills/\` |
| Codex | \`~/.codex/prompts/\` |
| ... | (29 tools total) |

For each tool, check if the directory exists.

### 4. Interactive tool selection

Show a multi-select prompt:

\`\`\`
Select AI tools to generate commands for:
(Use Space to select, Enter to confirm)

> Claude Code          [✓]
  OpenCode             [✓]
  Cursor               [ ]
  Windsurf             [ ]
  ...
\`\`\`

**Pre-select** tools that were detected in step 3.

**If user cancels (Escape):**
- Show: "Tool selection cancelled. No commands/skills generated."
- Exit gracefully

**If no tools selected:**
- Show: "No tools selected. Run \`programspec update\` later to generate commands."
- Continue with initialization (directories and config are still created)

### 5. Save tool selection to config

Update \`.programspec/config.yaml\` with selected tools:

\`\`\`yaml
schema: spec-driven
tools:
  - claude
  - opencode
\`\`\`

### 6. Generate commands and skills

For each selected tool:

1. **Generate commands** — Create slash command files:
   - Claude: \`.claude/commands/programspec/<id>.md\`
   - OpenCode: \`.opencode/commands/programspec-<id>.md\`
   - Cursor: \`.cursor/commands/programspec-<id>.md\`
   - (etc. for each tool)

2. **Generate skills** — Create SKILL.md files:
   - All tools: \`.<tool>/skills/programspec-<name>/SKILL.md\`

Commands to generate:
- \`init\` — Initialize project
- \`new-program\` — Create new program
- \`status\` — View program status
- \`run\` — Execute program
- \`evaluate\` — Evaluate program
- \`evolve\` — System evolution
- \`analyze\` — Analyze recommendations

### 7. Copy agent definitions

Copy built-in agent definitions to \`.programspec/agents/\`:
- Each agent gets its own directory: \`.programspec/agents/<agent-name>/AGENT.md\`
- 10 agents total: intent, modeling, planner, architect, coder, qa, reviewer, evaluation, reflection, evolution
- Users can customize agents by editing the AGENT.md files

---

## Output

### On success:
\`\`\`
✓ programspec initialized!

Select AI tools to generate commands for:
  (Use Space to select, Enter to confirm)
✓ AI Tools » Claude Code, OpenCode

Generated 14 command/skill files for 2 tool(s).
Copied 10 agent definitions to .programspec/agents/

Created:
  .programspec/        # Runtime data directory
  .programspec/config.yaml  # Configuration file
  .programspec/agents/ # Agent definitions
  programs/            # Programs directory
  schemas/             # Schema definitions

Next steps:
  programspec new program <name>  # Create your first program
  programspec status              # View program status
  programspec update              # Refresh tool commands
\`\`\`

### If already initialized (no --force):
\`\`\`
✗ programspec is already initialized.
  Use --force to overwrite existing configuration.
\`\`\`

### If no tools detected:
\`\`\`
✓ programspec initialized!

No tools detected. Run \`programspec update\` after installing a tool.

Created:
  .programspec/        # Runtime data directory
  .programspec/config.yaml  # Configuration file
  programs/            # Programs directory
  schemas/             # Schema definitions
\`\`\`

---

## Guardrails

- **DO** check for existing config before overwriting
- **DO** pre-select detected tools in the interactive prompt
- **DO** save tool selection to config for future \`update\` runs
- **DON'T** generate commands if user cancels tool selection
- **DON'T** overwrite without --force flag
- **DON'T** create programs or artifacts during init — only structure
`;

export const initWorkflow: WorkflowTemplate = {
  skill: {
    name: 'programspec-init',
    description: 'Initialize programspec in your project. Use when the user wants to set up a new project with programspec, configure AI tool integration, or get started with the workflow.',
    instructions: INIT_INSTRUCTION,
    license: 'MIT',
    compatibility: 'Requires programspec CLI.',
    metadata: {
      version: '1.0.0',
      author: 'programspec',
      generatedBy: '0.1.0',
    },
  },
  command: {
    name: 'programspec Init',
    description: 'Initialize programspec in your project',
    category: 'Workflow',
    tags: ['init', 'setup'],
    content: INIT_INSTRUCTION,
  },
};
