import type { WorkflowTemplate } from '../types.js';

const EVOLVE_INSTRUCTION = `
# System Evolution

Analyze experience and update agent strategies, patterns, and program profiles.

---

## Input

The user runs: \`programspec evolve [--dry-run] [--json]\`

**Optional:**
- \`--dry-run\` — Show what would change without making changes
- \`--json\` — Output as JSON

---

## Steps

### 1. Analyze patterns (semantic store)

Read all patterns from \`.programspec/memory/semantic/patterns/\`:

For each pattern, check:
- \`effectiveness\`: score from 0 to 1
- \`usageCount\`: how many times used
- \`applicableTo\`: which stages it applies to

**Identify:**
- **High effectiveness** (>0.8): candidates for promotion to global patterns
- **Low effectiveness** (<0.3) with high usage (>3): candidates for review/removal
- **Unused patterns** (usageCount = 0): candidates for cleanup

### 2. Analyze agent strategies (procedural store)

Read all strategies from \`.programspec/memory/procedural/agent-strategies/\`:

For each agent strategy, check:
- \`effectiveness\`: overall score
- \`rules\`: count and quality
- \`heuristics\`: success/failure rates

**Identify:**
- **Low effectiveness** (<0.4): agent needs strategy review
- **Heuristics with poor success rate** (<40% after 5+ uses): needs update
- **Missing rules**: agent has fewer than 3 rules

### 3. Generate recommendations

Based on analysis, create recommendations:

\`\`\`
Pattern Insights:
  [promote] "Error Handling Pattern" — 92% effectiveness, 12 uses
  [review] "Quick Fix Pattern" — 28% effectiveness, 8 uses

Agent Improvements:
  coder-agent: Effectiveness is 35%. Review recent failures.
  qa-agent: Heuristic "Test Edge Cases" has 30% success rate.

System Observations:
  Pattern library has 25 patterns. Consider organizing into categories.
\`\`\`

### 4. Apply changes (unless --dry-run)

**If --dry-run:**
- Show recommendations only
- Do NOT modify any files

**If not --dry-run:**
1. **Update agent strategies**: Add review rules for low-effectiveness agents
2. **Update pattern effectiveness**: Boost high-performing patterns
3. **Record lessons**: Add new patterns from recent experiences
4. **Save changes**: Write updated strategies and patterns to memory stores

---

## Output

### Dry run:
\`\`\`
Evolution Analysis (dry run — no changes made):

Pattern Insights:
  [promote] "Error Handling Pattern" — 92% effectiveness, 12 uses
  [review] "Quick Fix Pattern" — 28% effectiveness, 8 uses

Agent Improvements:
  coder-agent: Effectiveness is 35%. Review recent failures.
  qa-agent: Heuristic "Test Edge Cases" has 30% success rate.

System Observations:
  Pattern library has 25 patterns. Consider organizing into categories.

To apply changes: programspec evolve
\`\`\`

### Applied:
\`\`\`
Evolution complete.

Agent updates:
  coder-agent: Added validation rule
  qa-agent: Updated heuristic success tracking

Pattern additions:
  lesson-2026-05-07: "Always validate input before processing"

Summary:
  Patterns reviewed: 12
  Agents updated: 2
  New patterns: 1
\`\`\`

### JSON format (\`--json\`):
\`\`\`json
{
  "summary": "Evolution complete.",
  "agentUpdates": [
    { "agentName": "coder-agent", "changes": ["Added validation rule"], "effectivenessDelta": 0.05 }
  ],
  "patternAdditions": ["lesson-2026-05-07"],
  "profileUpdates": []
}
\`\`\`

---

## Guardrails

- **DO** analyze before making changes
- **DO** respect --dry-run flag
- **DO** provide specific, actionable recommendations
- **DON'T** remove patterns without evidence of ineffectiveness
- **DON'T** update strategies without understanding why they failed
- **DON'T** apply changes without user confirmation (unless --force)
`;

export const evolveWorkflow: WorkflowTemplate = {
  skill: {
    name: 'programspec-evolve',
    description: 'Run system evolution - analyze and update strategies. Use when the user wants to improve agent performance, review patterns, or learn from execution experience.',
    instructions: EVOLVE_INSTRUCTION,
    license: 'MIT',
    compatibility: 'Requires programspec CLI.',
    metadata: {
      version: '1.0.0',
      author: 'programspec',
      generatedBy: '0.1.0',
    },
  },
  command: {
    name: 'programspec Evolve',
    description: 'Run system evolution - analyze and update strategies',
    category: 'Workflow',
    tags: ['evolve', 'learn'],
    content: EVOLVE_INSTRUCTION,
  },
};
