// A failed save as a field error, where the database checks a rule the form also checks.
import type { RefuelingErrorCode } from "./rules";
import type { RefuelingFields } from "./schema";

/** Postgres error code for a violated unique constraint. */
const UNIQUE_VIOLATION = "23505";
/** Same vehicle, day and odometer (migration 20261125120000, ADR 0012). */
const DAY_ODOMETER_CONSTRAINT = "refuelings_vehicle_day_odometer_key";

export type SaveFieldError = { field: keyof RefuelingFields; code: RefuelingErrorCode };

/**
 * The field error for a Supabase error thrown while saving, or null for any other error.
 * PostgREST does not report the constraint separately, only inside the message.
 */
export function saveFieldError(error: unknown): SaveFieldError | null {
  if (typeof error !== "object" || error === null) return null;
  if (!("code" in error) || error.code !== UNIQUE_VIOLATION) return null;
  if (!("message" in error) || typeof error.message !== "string") return null;
  return error.message.includes(DAY_ODOMETER_CONSTRAINT)
    ? { field: "odometerKm", code: "odometerDuplicateSameDay" }
    : null;
}

/** Why a save failed, for the text the user sees. */
export type SaveErrorKind = "network" | "rejected";

/** SQLSTATE class 22: data exception, e.g. 22003 numeric value out of range. */
const DATA_EXCEPTION_CLASS = "22";
/** SQLSTATE class 23: integrity violation, e.g. 23514 check, 23505 unique. */
const INTEGRITY_VIOLATION_CLASS = "23";

/**
 * Tells data the server turned down from every other failure. Only SQLSTATE classes 22 and 23
 * mean "your input is wrong". Everything else is treated as a problem the user can retry: a
 * failed fetch (supabase-js does not throw, it returns a plain object with `code: ""`), a
 * timeout (57014), a lost connection (08xxx), overload (53300), a serialization failure
 * (40001), or PostgREST's own codes (PGRST000-003, PGRST301/303). A thrown TypeError has no
 * code and counts as network too.
 */
export function saveErrorKind(error: unknown): SaveErrorKind {
  if (typeof error !== "object" || error === null) return "network";
  if (!("code" in error) || typeof error.code !== "string") return "network";
  const isDataError =
    error.code.startsWith(DATA_EXCEPTION_CLASS) || error.code.startsWith(INTEGRITY_VIOLATION_CLASS);
  return isDataError ? "rejected" : "network";
}
