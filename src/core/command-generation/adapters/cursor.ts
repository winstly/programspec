import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue } from './yaml-utils.js';

export const cursorAdapter: ToolCommandAdapter = {
  toolId: 'cursor',
  getFilePath(commandId: string): string {
    return path.join('.cursor', 'commands', `programspec-${commandId}.md`);
  },
  formatFile(content: CommandContent): string {
    return `---
name: ${escapeYamlValue(`/programspec-${content.id}`)}
id: ${escapeYamlValue(content.id)}
description: ${escapeYamlValue(content.description)}
---

${content.body}
`;
  },
};
