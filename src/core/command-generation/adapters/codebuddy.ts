import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';

export const codebuddyAdapter: ToolCommandAdapter = {
  toolId: 'codebuddy',
  getFilePath(commandId: string): string {
    return path.join('.codebuddy', 'commands', `programspec-${commandId}.md`);
  },
  formatFile(content: CommandContent): string {
    return `---
name: programspec-${content.id}
description: ${content.description}
---

${content.body}
`;
  },
};
