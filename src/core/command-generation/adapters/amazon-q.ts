import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue } from './yaml-utils.js';

export const amazonQAdapter: ToolCommandAdapter = {
  toolId: 'amazon-q',
  getFilePath(commandId: string): string {
    return path.join('.amazonq', 'commands', `programspec-${commandId}.md`);
  },
  formatFile(content: CommandContent): string {
    return `---
description: ${escapeYamlValue(content.description)}
---

${content.body}
`;
  },
};
