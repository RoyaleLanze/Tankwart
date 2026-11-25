// Central parsing of number input from text fields, the counterpart to format.ts.
// Text that is not a number becomes NaN, and more digits than a number holds become Infinity.
// The zod schemas report both as an error at the field.

const WHOLE_NUMBER = /^\d+$/;
// Comma and dot are both decimal separators (design-system.md → TextField).
const DECIMAL = /^\d+(?:[.,]\d+)?$/;

/** "84000" → 84000. Signs, separators and decimals are invalid. */
export function parseWholeNumber(text: string): number {
  const trimmed = text.trim();
  return WHOLE_NUMBER.test(trimmed) ? Number(trimmed) : Number.NaN;
}

/** "45,5" or "45.5" → 45.5. A dot is always a decimal separator, so "1.000" is 1. */
export function parseDecimal(text: string): number {
  const trimmed = text.trim();
  return DECIMAL.test(trimmed) ? Number(trimmed.replace(",", ".")) : Number.NaN;
}
