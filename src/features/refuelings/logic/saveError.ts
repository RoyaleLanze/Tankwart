// A failed save as a field error, where the database checks a rule the form also checks.
import type { RefuelingErrorCode } from "./rules";
import type { RefuelingFields } from "./schema";

/** Postgres error code for a violated unique constraint. */
const UNIQUE_VIOLATION = "23505";
/** Same vehicle, day and odometer (migration 20261125120000, ADR 0012). */
const DAY_ODOMETER_CONSTRAINT = "refuelings_vehicle_day_odometer_key";

/** The primary key: the same id was inserted before (ADR 0017). */
const PRIMARY_KEY_CONSTRAINT = "refuelings_pkey";

export type SaveFieldError = { field: keyof RefuelingFields; code: RefuelingErrorCode };

/**
 * The field error for a Supabase error thrown while saving, or null for any other error.
 * PostgREST does not report the constraint separately, only inside the message.
 */
export function saveFieldError(error: unknown): SaveFieldError | null {
  return hasUniqueViolation(error, DAY_ODOMETER_CONSTRAINT)
    ? { field: "odometerKm", code: "odometerDuplicateSameDay" }
    : null;
}

function hasUniqueViolation(error: unknown, constraint: string): boolean {
  if (typeof error !== "object" || error === null) return false;
  if (!("code" in error) || error.code !== UNIQUE_VIOLATION) return false;
  if (!("message" in error) || typeof error.message !== "string") return false;
  return error.message.includes(constraint);
}

/**
 * True if the insert failed because a row with this id exists. That can mean an earlier attempt
 * went through although the app never saw the answer; the caller reads the row to find out.
 */
export function isAlreadySaved(error: unknown): boolean {
  return hasUniqueViolation(error, PRIMARY_KEY_CONSTRAINT);
}

/**
 * PostgREST code for `.single()` finding no row. An update of a refueling that was deleted
 * meanwhile, or belongs to someone else (RLS hides it), ends up here.
 */
const NO_ROW_FOUND = "PGRST116";

/** True if an update of one row found nothing: the refueling no longer exists. */
export function isRefuelingGone(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  return "code" in error && error.code === NO_ROW_FOUND;
}

/** Why a save failed, for the text the user sees. */
export type SaveErrorKind = "network" | "rejected" | "gone";

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
  if (isRefuelingGone(error)) return "gone";
  if (typeof error !== "object" || error === null) return "network";
  if (!("code" in error) || typeof error.code !== "string") return "network";
  const isDataError =
    error.code.startsWith(DATA_EXCEPTION_CLASS) || error.code.startsWith(INTEGRITY_VIOLATION_CLASS);
  return isDataError ? "rejected" : "network";
}
