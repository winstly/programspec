/**
 * Command Adapter Registry
 *
 * Centralized registry for tool command adapters.
 */

import type { ToolCommandAdapter } from './types.js';
import { amazonQAdapter } from './adapters/amazon-q.js';
import { antigravityAdapter } from './adapters/antigravity.js';
import { auggieAdapter } from './adapters/auggie.js';
import { bobAdapter } from './adapters/bob.js';
import { claudeAdapter } from './adapters/claude.js';
import { clineAdapter } from './adapters/cline.js';
import { codexAdapter } from './adapters/codex.js';
import { continueAdapter } from './adapters/continue.js';
import { costrictAdapter } from './adapters/costrict.js';
import { crushAdapter } from './adapters/crush.js';
import { cursorAdapter } from './adapters/cursor.js';
import { factoryAdapter } from './adapters/factory.js';
import { geminiAdapter } from './adapters/gemini.js';
import { githubCopilotAdapter } from './adapters/github-copilot.js';
import { iflowAdapter } from './adapters/iflow.js';
import { junieAdapter } from './adapters/junie.js';
import { kilocodeAdapter } from './adapters/kilocode.js';
import { kimiAdapter } from './adapters/kimi.js';
import { kiroAdapter } from './adapters/kiro.js';
import { opencodeAdapter } from './adapters/opencode.js';
import { piAdapter } from './adapters/pi.js';
import { qoderAdapter } from './adapters/qoder.js';
import { lingmaAdapter } from './adapters/lingma.js';
import { qwenAdapter } from './adapters/qwen.js';
import { roocodeAdapter } from './adapters/roocode.js';
import { traeAdapter } from './adapters/trae.js';
import { windsurfAdapter } from './adapters/windsurf.js';
import { codebuddyAdapter } from './adapters/codebuddy.js';
import { forgecodeAdapter } from './adapters/forgecode.js';

/**
 * Registry for looking up tool command adapters.
 */
export class CommandAdapterRegistry {
  private static adapters: Map<string, ToolCommandAdapter> = new Map();

  // Static initializer - register all built-in adapters
  static {
    CommandAdapterRegistry.register(amazonQAdapter);
    CommandAdapterRegistry.register(antigravityAdapter);
    CommandAdapterRegistry.register(auggieAdapter);
    CommandAdapterRegistry.register(bobAdapter);
    CommandAdapterRegistry.register(claudeAdapter);
    CommandAdapterRegistry.register(clineAdapter);
    CommandAdapterRegistry.register(codexAdapter);
    CommandAdapterRegistry.register(continueAdapter);
    CommandAdapterRegistry.register(costrictAdapter);
    CommandAdapterRegistry.register(crushAdapter);
    CommandAdapterRegistry.register(cursorAdapter);
    CommandAdapterRegistry.register(factoryAdapter);
    CommandAdapterRegistry.register(geminiAdapter);
    CommandAdapterRegistry.register(githubCopilotAdapter);
    CommandAdapterRegistry.register(iflowAdapter);
    CommandAdapterRegistry.register(junieAdapter);
    CommandAdapterRegistry.register(kilocodeAdapter);
    CommandAdapterRegistry.register(kimiAdapter);
    CommandAdapterRegistry.register(kiroAdapter);
    CommandAdapterRegistry.register(opencodeAdapter);
    CommandAdapterRegistry.register(piAdapter);
    CommandAdapterRegistry.register(qoderAdapter);
    CommandAdapterRegistry.register(lingmaAdapter);
    CommandAdapterRegistry.register(qwenAdapter);
    CommandAdapterRegistry.register(roocodeAdapter);
    CommandAdapterRegistry.register(traeAdapter);
    CommandAdapterRegistry.register(windsurfAdapter);
    CommandAdapterRegistry.register(codebuddyAdapter);
    CommandAdapterRegistry.register(forgecodeAdapter);
  }

  /**
   * Register a tool command adapter.
   */
  static register(adapter: ToolCommandAdapter): void {
    CommandAdapterRegistry.adapters.set(adapter.toolId, adapter);
  }

  /**
   * Get an adapter by tool ID.
   */
  static get(toolId: string): ToolCommandAdapter | undefined {
    return CommandAdapterRegistry.adapters.get(toolId);
  }

  /**
   * Get all registered adapters.
   */
  static getAll(): ToolCommandAdapter[] {
    return Array.from(CommandAdapterRegistry.adapters.values());
  }

  /**
   * Check if an adapter is registered for a tool.
   */
  static has(toolId: string): boolean {
    return CommandAdapterRegistry.adapters.has(toolId);
  }
}
