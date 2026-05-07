# programspec

> AI 原生开发操作系统

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-≥20.19.0-green.svg)](https://nodejs.org/)

programspec 是一个 AI 原生开发操作系统，实现 7 阶段执行工作流，支持多 Agent 协作、记忆系统和持续学习。

---

## 核心特性

- **7 阶段执行工作流** — Intent → Modeling → Planning → Execution → Evaluation → Learning → Evolution
- **反馈循环** — 评估失败时自动回到 Planning 阶段迭代
- **10 个专业 Agent** — 每个阶段有专门的 Agent 负责特定能力
- **记忆系统** — 情景记忆、语义记忆、程序记忆和共享状态
- **29 AI 工具支持** — 为 Claude、OpenCode、Cursor、Windsurf 等生成命令和技能
- **自我进化** — 系统从执行经验中学习并持续改进

---

## 安装

```bash
npm install -g programspec
```

或从源码安装：

```bash
git clone <repository-url>
cd programspec/programspec
npm install
npm run build
npm link
```

---

## 快速开始

### 1. 初始化项目

```bash
programspec init
```

将会：
- 创建 `.programspec/` 目录和配置文件
- 创建 `programs/` 目录用于存放程序
- 检测已安装的 AI 工具
- 为选中的工具生成命令和技能

### 2. 创建新程序

```bash
programspec new program my-app
```

### 3. 查看程序状态

```bash
programspec status --program my-app
```

### 4. 运行程序

```bash
programspec run my-app
```

---

## 命令参考

| 命令 | 说明 |
|------|------|
| `programspec init` | 初始化 programspec |
| `programspec new program <name>` | 创建新程序 |
| `programspec list` | 列出所有程序 |
| `programspec status --program <name>` | 查看程序状态 |
| `programspec run <name>` | 执行程序（7 个阶段） |
| `programspec evaluate <name>` | 评估程序是否达标 |
| `programspec evolve` | 运行系统进化 |
| `programspec analyze` | 分析进化建议 |
| `programspec update` | 刷新 AI 工具命令和技能 |
| `programspec schemas` | 列出可用的工作流 Schema |
| `programspec templates` | 显示 Schema 制品的模板路径 |
| `programspec agents` | 列出可用的 Agent |
| `programspec explore` | 进入探索模式进行思考和调研 |

---

## 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    programspec                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              7 阶段执行循环                        │   │
│  │                                                    │   │
│  │  Intent → Modeling → Planning → Execution         │   │
│  │    → Evaluation → Learning → Evolution            │   │
│  │         ↑         (失败时循环回去)                  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────┐    ┌──────────────────────────┐   │
│  │   Agent 系统      │    │     记忆系统              │   │
│  │                   │    │                          │   │
│  │  • intent-agent   │    │  • 情景记忆 (运行记录)    │   │
│  │  • modeling-agent │    │  • 语义记忆 (模式)        │   │
│  │  • planner-agent  │    │  • 程序记忆 (规则)        │   │
│  │  • architect-agent│    │  • 共享状态               │   │
│  │  • coder-agent    │    │                          │   │
│  │  • qa-agent       │    └──────────────────────────┘   │
│  │  • reviewer-agent │                                   │
│  │  • evaluation-agent│   ┌──────────────────────────┐   │
│  │  • reflection-agent│   │   AI 工具集成             │   │
│  │  • evolution-agent │   │                          │   │
│  └──────────────────┘    │  支持 29 工具             │   │
│                           │  Claude, OpenCode, Cursor│   │
│                           └──────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 7 阶段工作流

### 阶段 0: Intent（目标定义）
定义程序目标、约束条件和成功指标。

### 阶段 1: Modeling（系统建模）
用实体、状态和流程对系统建模。

### 阶段 2: Planning（任务规划）
生成任务图（DAG），包含依赖关系和工作量估算。

### 阶段 3: Execution（执行）
使用适当的 Agent 执行任务。

### 阶段 4: Evaluation（评估）
根据成功标准评估结果。

**反馈循环：** 如果评估失败，系统会自动回到 Planning 阶段重新规划（最多重试 3 次）。

### 阶段 5: Learning（学习）
记录经验教训和识别到的模式。

### 阶段 6: Evolution（进化）
根据经验更新策略和模式。

---

## AI 工具集成

programspec 为 29 AI 工具生成命令和技能：

| 工具 | 命令格式 |
|------|---------|
| Claude Code | `/programspec:run` |
| OpenCode | `/programspec-run` |
| Cursor | `/programspec-run` |
| Windsurf | `/programspec-run` |
| Codex | `/programspec-run` |
| Gemini CLI | `/programspec-run` |
| GitHub Copilot | `/programspec-run` |

运行 `programspec init` 检测并配置你的工具。

---

## 目录结构

```
your-project/
├── .programspec/              # 运行时数据
│   ├── config.yaml            # 配置文件
│   ├── agents/                # Agent 配置
│   ├── workflows/             # Schema 定义
│   └── memory/                # 记忆存储
├── programs/                  # 你的程序
│   └── <program-name>/
│       ├── artifacts/         # 生成的制品
│       ├── profile/           # 程序配置
│       └── task-graph/        # 任务图
└── schemas/                   # 自定义 Schema
```

---

## License

MIT
