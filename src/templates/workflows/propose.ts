import type { WorkflowTemplate } from '../types.js';

const PROPOSE_INSTRUCTION = `
# Propose a New Program

Create a new program and generate all artifacts in one step. This is the "quick start" mode.

**For step-by-step guided mode, use \`programspec new program\` + \`programspec continue\` instead.**

---

**Input**: The user's request should include a program name (kebab-case) OR a description of what they want to build.

**Steps**

1. **If no clear input provided, ask what they want to build**

   Use the **AskUserQuestion tool** (open-ended, no preset options) to ask:
   > "What program do you want to work on? Describe what you want to build or fix."

   From their description, derive a kebab-case name (e.g., "build a data pipeline" → \`data-pipeline\`).

   **IMPORTANT**: Do NOT proceed without understanding what the user wants to build.

2. **Create the program directory**
   \`\`\`bash
   programspec new program "<name>"
   \`\`\`
   This creates the program at \`programs/<name>/\` with directory structure.

3. **Get the artifact build order**
   \`\`\`bash
   programspec status --program "<name>" --json
   \`\`\`
   Parse the JSON to get:
   - \`artifacts\`: list of all artifacts with their status and dependencies

4. **Create artifacts in sequence**

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

5. **Show final status**
   \`\`\`bash
   programspec status --program <name>
   \`\`\`

**Output**

After completing all artifacts, summarize:
- Program name and location
- List of artifacts created with brief descriptions
- What's ready: "All artifacts created! Ready for evaluation."
- Prompt: "Run \`programspec evaluate <name>\` to check results."

**Artifact Creation Guidelines**

- Follow the \`instruction\` field from \`programspec instructions\` for each artifact type
- The schema defines what each artifact should contain - follow it
- Read dependency artifacts for context before creating new ones
- Use \`template\` as the structure for your output file - fill in its sections

**Guardrails**
- Create ALL artifacts needed for evaluation (as defined by schema)
- Always read dependency artifacts before creating a new one
- If context is critically unclear, ask the user - but prefer making reasonable decisions to keep momentum
- If a program with that name already exists, ask if user wants to continue it or create a new one
- Verify each artifact file exists after writing before proceeding to next
`;

export const proposeWorkflow: WorkflowTemplate = {
  skill: {
    name: 'programspec-propose',
    description: 'Propose a new program - create it and generate all artifacts in one step. Use when the user wants to quickly describe what they want to build and get a complete program with all artifacts ready.',
    instructions: PROPOSE_INSTRUCTION,
    license: 'MIT',
    compatibility: 'Requires programspec CLI.',
    metadata: {
      version: '1.0.0',
      author: 'programspec',
      generatedBy: '0.1.0',
    },
  },
  command: {
    name: 'programspec Propose',
    description: 'Propose a new program - create it and generate all artifacts in one step',
    category: 'Workflow',
    tags: ['propose', 'workflow', 'quick-start'],
    content: PROPOSE_INSTRUCTION,
  },
};
