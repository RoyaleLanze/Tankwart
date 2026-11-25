// Pure, dependency-free helpers for sorting, shared by the logic of several features.

/** Plain code-unit comparison; ISO dates sort correctly this way, independent of the locale. */
export function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
