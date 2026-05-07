import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { transformToHyphenCommands } from '../../../shared/command-references.js';
import { escapeYamlValue } from './yaml-utils.js';

export const opencodeAdapter: ToolCommandAdapter = {
  toolId: 'opencode',
  getFilePath(commandId: string): string {
    return path.join('.opencode', 'commands', `programspec-${commandId}.md`);
  },
  formatFile(content: CommandContent): string {
    return `---
description: ${escapeYamlValue(content.description)}
---

${transformToHyphenCommands(content.body)}
`;
  },
};
