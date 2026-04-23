/**
 * Escape a user-supplied search string so the LIKE metacharacters `%`, `_`
 * and the literal escape character `\` are matched literally instead of
 * being interpreted as wildcards. Use together with `ESCAPE '\'` in the
 * LIKE clause: `... LIKE :q ESCAPE '\'`.
 */
export function escapeLikePattern(input: string): string {
  return input.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}
