import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue } from './yaml-utils.js';

export const githubCopilotAdapter: ToolCommandAdapter = {
  toolId: 'github-copilot',
  getFilePath(commandId: string): string {
    return path.join('.github', 'prompts', `programspec-${commandId}.md`);
  },
  formatFile(content: CommandContent): string {
    return `---
description: ${escapeYamlValue(content.description)}
---

${content.body}
`;
  },
};
