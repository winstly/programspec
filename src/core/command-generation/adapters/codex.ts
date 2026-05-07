import os from 'os';
import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue } from './yaml-utils.js';

function getCodexHome(): string {
  const envHome = process.env.CODEX_HOME?.trim();
  return path.resolve(envHome ? envHome : path.join(os.homedir(), '.codex'));
}

export const codexAdapter: ToolCommandAdapter = {
  toolId: 'codex',
  getFilePath(commandId: string): string {
    return path.join(getCodexHome(), 'prompts', `programspec-${commandId}.md`);
  },
  formatFile(content: CommandContent): string {
    return `---
description: ${escapeYamlValue(content.description)}
argument-hint: ${escapeYamlValue(content.id)}
---

${content.body}
`;
  },
};
