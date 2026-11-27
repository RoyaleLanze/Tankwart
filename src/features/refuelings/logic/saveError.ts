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

/**
 * Tells a failure to reach the server from data the server turned down. supabase-js does not
 * throw on a failed fetch (offline, timeout): it returns a plain object with `code: ""`
 * (postgrest-js, FetchError). Any answer from the server carries a non-empty code: a Postgres
 * SQLSTATE such as 23514 (check) or 22003 (overflow), or a PostgREST code such as PGRST116.
 * Anything without such a code, including a thrown TypeError, counts as network.
 */
export function saveErrorKind(error: unknown): SaveErrorKind {
  if (typeof error !== "object" || error === null) return "network";
  const hasServerCode = "code" in error && typeof error.code === "string" && error.code !== "";
  return hasServerCode ? "rejected" : "network";
}
