import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue } from './yaml-utils.js';

export const kilocodeAdapter: ToolCommandAdapter = {
  toolId: 'kilocode',
  getFilePath(commandId: string): string {
    return path.join('.kilocode', 'commands', `programspec-${commandId}.md`);
  },
  formatFile(content: CommandContent): string {
    return `---
description: ${escapeYamlValue(content.description)}
---

${content.body}
`;
  },
};
