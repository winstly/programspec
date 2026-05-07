import type { WorkflowTemplate } from '../types.js';

const CONTINUE_PROGRAM_INSTRUCTION = `
# Continue Program

Continue working on a program by creating the next artifact.

**Input**: Optionally specify a program name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available programs.

**Steps**

1. **If no program name provided, prompt for selection**

   Run \`programspec list --json\` to get available programs sorted by most recently modified. Then use the **AskUserQuestion tool** to let the user select which program to work on.

   Present the top 3-4 most recently modified programs as options, showing:
   - Program name
   - Schema (from metadata if present, otherwise "spec-driven")
   - Status (e.g., "0/7 stages", "complete", "no artifacts")
   - How recently it was modified

   Mark the most recently modified program as "(Recommended)" since it's likely what the user wants to continue.

   **IMPORTANT**: Do NOT guess or auto-select a program. Always let the user choose.

2. **Check current status**
   \`\`\`bash
   programspec status --program "<name>" --json
   \`\`\`
   Parse the JSON to understand current state. The response includes:
   - \`schemaName\`: The workflow schema being used (e.g., "spec-driven")
   - \`artifacts\`: Array of artifacts with their status ("done", "ready", "blocked")
   - \`isComplete\`: Boolean indicating if all artifacts are complete

3. **Act based on status**:

   ---

   **If all artifacts are complete (\`isComplete: true\`)**:
   - Congratulate the user
   - Show final status including the schema used
   - Suggest: "All artifacts complete! You can now evaluate the program."
   - STOP

   ---

   **If artifacts are ready to create** (status shows artifacts with \`status: "ready"\`):
   - Pick the FIRST artifact with \`status: "ready"\` from the status output
   - Get its instructions:
     \`\`\`bash
     programspec instructions <artifact-id> --program "<name>" --json
     \`\`\`
   - Parse the JSON. The key fields are:
     - \`description\`: What this artifact is about
     - \`instruction\`: Detailed instructions for creating the artifact
     - \`template\`: The structure to use for the output file
     - \`outputPath\`: Where to write the artifact
     - \`dependencies\`: Completed artifacts to read for context
   - **Create the artifact file**:
     - Read any completed dependency files for context
     - Use \`template\` as the structure - fill in its sections
     - Follow \`instruction\` for content guidance
     - Write to the output path specified
   - Show what was created and what's now unlocked
   - **STOP after creating ONE artifact**

   ---

   **If no artifacts are ready (all blocked)**:
   - This shouldn't happen with a valid schema
   - Show status and suggest checking for issues

4. **After creating an artifact, show progress**
   \`\`\`bash
   programspec status --program "<name>"
   \`\`\`

**Output**

After each invocation, show:
- Which artifact was created
- Schema workflow being used
- Current progress (N/M complete)
- What artifacts are now unlocked
- Prompt: "Want to continue? Run \`programspec continue --program <name>\` or tell me what to do next."

**Artifact Creation Guidelines**

The artifact types and their purpose depend on the schema. Use the \`instruction\` field from the instructions output to understand what to create.

Common artifact patterns (spec-driven schema):

- **intent.md**: Define the program goal, constraints, and success metrics
- **modeling.md**: System modeling with entities, states, and flows
- **planning.md**: Generate task graph with dependencies
- **execution.md**: Execute tasks and document implementation
- **evaluation.md**: Evaluate results against success criteria
- **learning.md**: Capture lessons learned and patterns
- **evolution.md**: Update strategies based on experience

**Guardrails**
- Create ONE artifact per invocation
- Always read dependency artifacts before creating a new one
- Never skip artifacts or create out of order
- If context is unclear, ask the user before creating
- Verify the artifact file exists after writing before marking progress
- Use the schema's artifact sequence, don't assume specific artifact names
- **STOP after creating ONE artifact** - do not continue to the next one
`;

export const continueProgramWorkflow: WorkflowTemplate = {
  skill: {
    name: 'programspec-continue',
    description: 'Continue working on a program by creating the next artifact. Use when the user wants to progress their program, create the next artifact, or continue their workflow.',
    instructions: CONTINUE_PROGRAM_INSTRUCTION,
    license: 'MIT',
    compatibility: 'Requires programspec CLI.',
    metadata: {
      version: '1.0.0',
      author: 'programspec',
      generatedBy: '0.1.0',
    },
  },
  command: {
    name: 'programspec Continue',
    description: 'Continue working on a program - create the next artifact',
    category: 'Workflow',
    tags: ['continue', 'workflow', 'artifacts'],
    content: CONTINUE_PROGRAM_INSTRUCTION,
  },
};
