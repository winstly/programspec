import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';

export const forgecodeAdapter: ToolCommandAdapter = {
  toolId: 'forgecode',
  getFilePath(commandId: string): string {
    return path.join('.forge', 'commands', `programspec-${commandId}.md`);
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
