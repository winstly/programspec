/**
 * Command Reference Utilities
 *
 * Utilities for transforming command references to tool-specific formats.
 */

/**
 * Transforms colon-based command references to hyphen-based format.
 * Converts `/programspec:` patterns to `/programspec-` for tools that use hyphen syntax.
 */
export function transformToHyphenCommands(text: string): string {
  return text.replace(/\/programspec:/g, '/programspec-');
}
