// What to make of a failed insert with an existing id (ADR 0017): the row read back decides.
import type { Refueling, RefuelingInput } from "../types";

/** The result of reading the row with the form's id after the insert said the id exists. */
export type ReadBack =
  { kind: "found"; row: Refueling } | { kind: "notFound" } | { kind: "failed" };

/**
 * - saved: the row is this form's earlier attempt, nothing more to do
 * - differs: a row with this id exists, but with other values (the user changed the form after
 *   the lost response); it is not overwritten, the user edits it in the list
 * - rejected: the id is taken by a row we cannot see (RLS), the original error stands
 * - network: reading failed, so we cannot tell; the user may retry with the same id
 */
export type RetryDecision = "saved" | "differs" | "rejected" | "network";

/** An empty string and null both mean "no value" (e.g. a blank note). */
function blankToNull<T>(value: T): T | null {
  return value === "" ? null : value;
}

function sameInput(row: Refueling, input: RefuelingInput): boolean {
  const keys = Object.keys(input) as (keyof RefuelingInput)[];
  return keys.every((key) => blankToNull(row[key]) === blankToNull(input[key]));
}

export function decideRetry(
  readBack: ReadBack,
  vehicleId: string,
  input: RefuelingInput,
): RetryDecision {
  if (readBack.kind === "failed") return "network";
  if (readBack.kind === "notFound") return "rejected";
  const { row } = readBack;
  return row.vehicleId === vehicleId && sameInput(row, input) ? "saved" : "differs";
}
