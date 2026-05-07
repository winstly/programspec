# programspec

> AI Native Development Operating System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-≥20.19.0-green.svg)](https://nodejs.org/)

programspec is an AI-native development operating system that implements a 7-stage execution workflow with multi-agent collaboration, memory systems, and continuous learning.

---

## Core Features

- **7-Stage Execution Workflow** — Intent → Modeling → Planning → Execution → Evaluation → Learning → Evolution
- **Feedback Loop** — Evaluation failures automatically loop back to Planning for iteration
- **10 Specialized Agents** — Each stage has dedicated agents with specific capabilities
- **Memory System** — Episodic, Semantic, Procedural, and Shared State memory layers
- **29 AI Tool Support** — Generate commands and skills for Claude, OpenCode, Cursor, Windsurf, and more
- **Self-Evolution** — System learns from execution experience and improves over time

---

## Installation

```bash
npm install -g programspec
```

Or from source:

```bash
git clone <repository-url>
cd programspec/programspec
npm install
npm run build
npm link
```

---

## Quick Start

### 1. Initialize a project

```bash
programspec init
```

This will:
- Create `.programspec/` directory with configuration
- Create `programs/` directory for your programs
- Detect installed AI tools
- Generate commands and skills for selected tools

### 2. Create a new program

```bash
programspec new program my-app
```

### 3. Check program status

```bash
programspec status --program my-app
```

### 4. Run the program

```bash
programspec run my-app
```

---

## Commands

| Command | Description |
|---------|-------------|
| `programspec init` | Initialize programspec in your project |
| `programspec new program <name>` | Create a new program |
| `programspec list` | List all programs |
| `programspec status --program <name>` | View program status |
| `programspec run <name>` | Execute program through 7 stages |
| `programspec evaluate <name>` | Evaluate program against success criteria |
| `programspec evolve` | Run system evolution |
| `programspec analyze` | Analyze evolution recommendations |
| `programspec update` | Refresh AI tool commands and skills |
| `programspec schemas` | List available workflow schemas |
| `programspec templates` | Show template paths for schema artifacts |
| `programspec agents` | List available agents |
| `programspec explore` | Enter explore mode for thinking and investigation |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    programspec                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              7-Stage Execution Loop               │   │
│  │                                                    │   │
│  │  Intent → Modeling → Planning → Execution         │   │
│  │    → Evaluation → Learning → Evolution            │   │
│  │         ↑         (fail loops back)               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────┐    ┌──────────────────────────┐   │
│  │   Agent System    │    │     Memory System        │   │
│  │                   │    │                          │   │
│  │  • intent-agent   │    │  • Episodic (runs)       │   │
│  │  • modeling-agent │    │  • Semantic (patterns)   │   │
│  │  • planner-agent  │    │  • Procedural (rules)    │   │
│  │  • architect-agent│    │  • Shared State          │   │
│  │  • coder-agent    │    │                          │   │
│  │  • qa-agent       │    └──────────────────────────┘   │
│  │  • reviewer-agent │                                   │
│  │  • evaluation-agent│   ┌──────────────────────────┐   │
│  │  • reflection-agent│   │   AI Tool Integration     │   │
│  │  • evolution-agent │   │                          │   │
│  └──────────────────┘    │  29 tools supported      │   │
│                           │  Claude, OpenCode, Cursor│   │
│                           └──────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 7-Stage Workflow

### Stage 0: Intent
Define the program goal, constraints, and success metrics.

### Stage 1: Modeling
Model the system with entities, states, and flows.

### Stage 2: Planning
Generate a task graph (DAG) with dependencies and estimates.

### Stage 3: Execution
Execute tasks using the appropriate agents.

### Stage 4: Evaluation
Evaluate results against success criteria.

**Feedback Loop:** If evaluation fails, the system automatically loops back to Planning (max 3 retries).

### Stage 5: Learning
Capture lessons learned and patterns identified.

### Stage 6: Evolution
Update strategies and patterns based on experience.

---

## AI Tool Integration

programspec generates commands and skills for 29 AI tools:

| Tool | Command Format |
|------|---------------|
| Claude Code | `/programspec:run` |
| OpenCode | `/programspec-run` |
| Cursor | `/programspec-run` |
| Windsurf | `/programspec-run` |
| Codex | `/programspec-run` |
| Gemini CLI | `/programspec-run` |
| GitHub Copilot | `/programspec-run` |
| Amazon Q Developer | `/programspec-run` |
| Kimi CLI | `/programspec-run` |
| Trae | `/programspec-run` |
| ForgeCode | `/programspec-run` |
| RooCode | `/programspec-run` |
| Cline | `/programspec-run` |
| Continue | `/programspec-run` |
| Kilo Code | `/programspec-run` |
| Bob Shell | `/programspec-run` |
| Pi | `/programspec-run` |
| Qoder | `/programspec-run` |
| Lingma | `/programspec-run` |
| Qwen Code | `/programspec-run` |
| Junie | `/programspec-run` |
| Kiro | `/programspec-run` |
| iFlow | `/programspec-run` |
| Crush | `/programspec-run` |
| CoStrict | `/programspec-run` |
| Factory Droid | `/programspec-run` |
| Auggie | `/programspec-run` |
| Antigravity | `/programspec-run` |
| CodeBuddy | `/programspec-run` |

Run `programspec init` to detect and configure your tools.

---

## Directory Structure

```
your-project/
├── .programspec/              # Runtime data
│   ├── config.yaml            # Configuration
│   ├── agents/                # Agent configurations
│   ├── workflows/             # Schema definitions
│   └── memory/                # Memory stores
├── programs/                  # Your programs
│   └── <program-name>/
│       ├── artifacts/         # Generated artifacts
│       ├── profile/           # Program profile
│       └── task-graph/        # Task graph
└── schemas/                   # Custom schemas
```

---

## License

MIT
