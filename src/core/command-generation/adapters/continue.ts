import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue } from './yaml-utils.js';

export const continueAdapter: ToolCommandAdapter = {
  toolId: 'continue',
  getFilePath(commandId: string): string {
    return path.join('.continue', 'commands', `programspec-${commandId}.md`);
  },
  formatFile(content: CommandContent): string {
    return `---
description: ${escapeYamlValue(content.description)}
---

${content.body}
`;
  },
};
