import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue } from './yaml-utils.js';

export const forgecodeAdapter: ToolCommandAdapter = {
  toolId: 'forgecode',
  getFilePath(commandId: string): string {
    return path.join('.forge', 'commands', `programspec-${commandId}.md`);
  },
  formatFile(content: CommandContent): string {
    return `---
name: ${escapeYamlValue(`programspec-${content.id}`)}
description: ${escapeYamlValue(content.description)}
---

${content.body}
`;
  },
};
