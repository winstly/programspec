export * from './base-store.js';
export * from './episodic-store.js';
export * from './semantic-store.js';
export * from './procedural-store.js';
export * from './shared-state-store.js';

/**
 * Memory System Overview
 *
 * programspec uses a hierarchical memory system:
 *
 * 1. Episodic Memory (memory/episodic/)
 *    - Execution records: what happened during runs
 *    - Task completion: which tasks were completed
 *    - Errors: what went wrong
 *    - Timestamps for temporal reasoning
 *
 * 2. Semantic Memory (memory/semantic/)
 *    - Patterns: reusable solution patterns
 *    - Knowledge: learned best practices
 *    - Effectiveness scores for pattern quality
 *
 * 3. Procedural Memory (memory/procedural/)
 *    - Agent strategies: how agents should behave
 *    - Rules: situation-action mappings
 *    - Heuristics: learned decision rules
 *
 * 4. Shared State (memory/shared_state/)
 *    - Cross-agent coordination
 *    - Current task context
 *    - Shared conclusions
 *
 * Usage:
 *
 * ```typescript
 * import { EpisodicStore, SemanticStore, ProceduralStore, SharedStateStore } from './memory';
 *
 * // Initialize stores
 * const episodic = new EpisodicStore(projectRoot);
 * const semantic = new SemanticStore(projectRoot);
 * const procedural = new ProceduralStore(projectRoot);
 * const shared = new SharedStateStore(projectRoot);
 *
 * // Create a run
 * const run = await episodic.createRun('my-app', 'execution', 'coder-agent');
 *
 * // Share state between agents
 * await shared.set('programs/my-app/current-task', { id: 'T1', status: 'in-progress' }, 'orchestrator');
 *
 * // Add a pattern
 * await semantic.addPattern({
 *   name: 'caching-pattern',
 *   description: 'Use caching for expensive operations',
 *   context: 'When an operation is called multiple times',
 *   solution: 'Cache the result on first call',
 *   applicableTo: ['performance', 'backend'],
 *   effectiveness: 0.9,
 *   source: 'program'
 * });
 * ```
 */