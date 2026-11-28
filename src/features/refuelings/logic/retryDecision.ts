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

/**
 * Every field of RefuelingInput. `satisfies` makes the compiler report a field that is added to
 * or removed from the type but not here, so the comparison cannot silently skip one.
 */
const INPUT_KEYS = {
  refueledOn: true,
  volumeMl: true,
  pricePerLiterTenthCents: true,
  totalCents: true,
  odometerKm: true,
  stationName: true,
  stationId: true,
  stationAddress: true,
  isFullTank: true,
  previousMissed: true,
  note: true,
} satisfies Record<keyof RefuelingInput, true>;

const COMPARED_FIELDS = Object.keys(INPUT_KEYS) as (keyof RefuelingInput)[];

/** An empty string, undefined and null all mean "no value" (PostgREST omits undefined, the DB stores null). */
function blankToNull<T>(value: T | undefined): T | null {
  return value === "" || value === undefined ? null : value;
}

function sameInput(row: Refueling, input: RefuelingInput): boolean {
  return COMPARED_FIELDS.every((key) => blankToNull(row[key]) === blankToNull(input[key]));
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
