import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import { escapeYamlValue, formatTagsArray } from './yaml-utils.js';

export const windsurfAdapter: ToolCommandAdapter = {
  toolId: 'windsurf',
  getFilePath(commandId: string): string {
    return path.join('.windsurf', 'workflows', `programspec-${commandId}.md`);
  },
  formatFile(content: CommandContent): string {
    return `---
name: ${escapeYamlValue(content.name)}
description: ${escapeYamlValue(content.description)}
category: ${escapeYamlValue(content.category)}
tags: ${formatTagsArray(content.tags)}
---

${content.body}
`;
  },
};
