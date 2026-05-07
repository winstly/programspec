/**
 * YAML escaping utilities for safe frontmatter generation.
 *
 * Prevents YAML injection when user-provided values contain special characters
 * like `:`, `#`, `[`, `]`, `{`, `}`, `&`, etc.
 */

/**
 * Escape a string value for safe YAML output.
 * Quotes the string if it contains special YAML characters.
 */
export function escapeYamlValue(value: string): string {
  const needsQuoting = /[:\n\r#{}[\],&*!|>'"%@`]|^\s|\s$/.test(value);
  if (needsQuoting) {
    const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    return `"${escaped}"`;
  }
  return value;
}

/**
 * Format a tags array as a YAML array with proper escaping.
 */
export function formatTagsArray(tags: string[]): string {
  const escapedTags = tags.map((tag) => escapeYamlValue(tag));
  return `[${escapedTags.join(', ')}]`;
}
