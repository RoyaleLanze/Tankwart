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
