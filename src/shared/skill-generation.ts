/**
 * Skill Generation Utilities
 *
 * Functions for generating SKILL.md files for different tools.
 */

import path from 'path';
import type { SkillTemplate } from '../templates/types.js';
import type { AIToolOption } from '../core/config.js';

export interface GeneratedSkill {
  path: string;
  fileContent: string;
}

/**
 * Generate SKILL.md content from a template.
 */
export function generateSkillContent(template: SkillTemplate): string {
  const frontmatter = [
    '---',
    `name: ${template.name}`,
    `description: ${template.description}`,
    `license: ${template.license || 'MIT'}`,
    `compatibility: ${template.compatibility || 'Requires programspec CLI.'}`,
    'metadata:',
    `  author: ${template.metadata?.author || 'programspec'}`,
    `  version: "${template.metadata?.version || '1.0'}"`,
    `  generatedBy: "${template.metadata?.generatedBy || '0.1.0'}"`,
    '---',
    '',
    template.instructions,
    '',
  ].join('\n');

  return frontmatter;
}

/**
 * Generate a SKILL.md file path for a tool.
 */
export function getSkillFilePath(tool: AIToolOption, skillName: string): string {
  return path.join(tool.skillsDir || '.', 'skills', skillName, 'SKILL.md');
}
