import type { WorkflowTemplate } from '../types.js';

const ANALYZE_INSTRUCTION = `
# Analyze Recommendations

Analyze and display evolution recommendations without applying them.

---

## Input

The user runs: \`programspec analyze [--json]\`

**Optional:**
- \`--json\` — Output as JSON

---

## Steps

### 1. Analyze patterns (semantic store)

Read all patterns from \`.programspec/memory/semantic/patterns/\`:

For each pattern, evaluate:
- **Effectiveness score** (0-1):
  - \`.8\`: High — consider promoting to global
  - \`0.3 - 0.8\`: Normal — keep as-is
  - \`< 0.3\`: Low — consider reviewing or removing
- **Usage count**: How many times has this pattern been applied?
- **Last used**: When was it last used?

### 2. Analyze agent strategies (procedural store)

Read all strategies from \`.programspec/memory/procedural/agent-strategies/\`:

For each agent, evaluate:
- **Overall effectiveness**: Is the agent performing well?
- **Rule count**: Does the agent have enough rules? (< 3 is low)
- **Heuristic success rates**: Are specific heuristics failing?

### 3. System observations

Check overall system health:
- **Pattern library size**: > 20 patterns may need categorization
- **Strategy coverage**: Are all agents using strategies?
- **Learning velocity**: Are new patterns being added?

### 4. Format recommendations

Group findings into three categories:
1. **Pattern Insights** — Actions on patterns (promote, review, remove)
2. **Agent Improvements** — Actions on agent strategies (review, update)
3. **System Observations** — Overall health indicators

---

## Output

### Text format (default):
\`\`\`
Evolution Recommendations:

Pattern Insights:
  [promote] "Error Handling Pattern" — 92% effectiveness, 12 uses
    → Consider promoting to global patterns

  [review] "Quick Fix Pattern" — 28% effectiveness, 8 uses
    → Low effectiveness with frequent use. Consider updating or removing.

  [remove] "Deprecated Auth Pattern" — 15% effectiveness, 0 uses
    → Very low effectiveness and never used. Consider removing.

Agent Improvements:
  coder-agent: Effectiveness is 35%
    → Review recent failures and update rules

  qa-agent: Heuristic "Test Edge Cases" has 30% success rate (5 uses)
    → This heuristic is failing frequently. Consider updating.

System Observations:
  Pattern library has 25 patterns
    → Consider organizing into categories for easier discovery

  3 out of 7 agents have no strategies
    → Run more programs to build agent experience

To apply changes: programspec evolve
\`\`\`

### JSON format (\`--json\`):
\`\`\`json
{
  "patternInsights": [
    { "pattern": "Error Handling Pattern", "insight": "92% effectiveness, 12 uses", "type": "promote" },
    { "pattern": "Quick Fix Pattern", "insight": "28% effectiveness, 8 uses", "type": "review" }
  ],
  "agentImprovements": [
    { "agent": "coder-agent", "insight": "Effectiveness is 35%", "type": "review_strategy" },
    { "agent": "qa-agent", "insight": "Heuristic has 30% success rate", "type": "update_heuristic" }
  ],
  "systemObservations": [
    { "observation": "Pattern library has 25 patterns", "type": "organize" }
  ]
}
\`\`\`

### If no recommendations:
\`\`\`
No recommendations at this time. System is in good state.

Patterns: 8 active, avg effectiveness 75%
Agents: 5/7 have strategies, avg effectiveness 68%
\`\`\`

---

## Guardrails

- **DO** provide specific, actionable recommendations
- **DO** explain why each recommendation is being made
- **DO** group related observations together
- **DON'T** recommend changes without evidence
- **DON'T** apply changes — this is analysis only
- **DON'T** alarm about normal states (e.g., few patterns is fine for new projects)
`;

export const analyzeWorkflow: WorkflowTemplate = {
  skill: {
    name: 'programspec-analyze',
    description: 'Analyze evolution recommendations. Use when the user wants to review system health, see improvement suggestions, or understand agent performance without making changes.',
    instructions: ANALYZE_INSTRUCTION,
    license: 'MIT',
    compatibility: 'Requires programspec CLI.',
    metadata: {
      version: '1.0.0',
      author: 'programspec',
      generatedBy: '0.1.0',
    },
  },
  command: {
    name: 'programspec Analyze',
    description: 'Analyze evolution recommendations',
    category: 'Workflow',
    tags: ['analyze', 'recommendations'],
    content: ANALYZE_INSTRUCTION,
  },
};
