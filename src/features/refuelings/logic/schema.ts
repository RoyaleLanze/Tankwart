// Validation schema for a refueling (M4), ADR 0009. Errors are codes, not text (ADR 0014):
// each issue's `message` is a RefuelingErrorCode that messages.ts turns into German text.
import { z } from "zod";

import {
  distanceWarning,
  MAX_DB_INTEGER,
  MAX_PRICE_PER_LITER_TENTH_CENTS,
  maxVolumeMl,
  MIN_PRICE_PER_LITER_TENTH_CENTS,
  odometerError,
  type RefuelingContext,
  type RefuelingErrorCode,
  type RefuelingWarningCode,
} from "./rules";

/** Typed shorthand, so a misspelled code is a type error. */
const code = (value: RefuelingErrorCode) => value;

/**
 * Whole number field; `missing` covers empty, non-numeric and fractional input. z.int also
 * rejects values beyond the safe integer range itself, which must not read as "missing".
 */
function wholeNumber(missing: RefuelingErrorCode) {
  return z
    .int({
      error: (issue) =>
        issue.code === "too_big" || issue.code === "too_small" ? code("valueTooLarge") : missing,
    })
    .max(MAX_DB_INTEGER, code("valueTooLarge"));
}

/** Builds the schema for one vehicle; the context rules close over it. */
export function createRefuelingSchema(context: RefuelingContext) {
  return (
    z
      .object({
        refueledOn: z.iso
          // abort: an invalid date must not also be reported as lying in the future.
          .date({ error: code("dateInvalid"), abort: true })
          // ISO dates compare correctly as strings; today() is read at validation time.
          .refine((date) => date <= context.today(), code("dateInFuture")),
        volumeMl: wholeNumber("volumeMissing")
          .positive(code("volumeNotPositive"))
          .max(maxVolumeMl(context.tankCapacityMl), code("volumeAboveTank")),
        pricePerLiterTenthCents: wholeNumber("priceMissing")
          .min(MIN_PRICE_PER_LITER_TENTH_CENTS, code("priceOutOfRange"))
          .max(MAX_PRICE_PER_LITER_TENTH_CENTS, code("priceOutOfRange")),
        totalCents: wholeNumber("totalMissing").positive(code("totalNotPositive")),
        odometerKm: wholeNumber("odometerMissing"),
        // Free text until station search (M5); trimmed, so only spaces count as missing.
        stationName: z
          .string({ error: code("stationMissing") })
          .trim()
          .min(1, code("stationMissing")),
      })
      // Needs date and odometer together, so it runs on the object and reports at the odometer.
      // `when` lets it run even if other fields are invalid, as long as these two are valid.
      .superRefine(
        ({ odometerKm, refueledOn }, ctx) => {
          const error = odometerError(odometerKm, refueledOn, context);
          if (error) ctx.addIssue({ code: "custom", message: error, path: ["odometerKm"] });
        },
        { when: (payload) => !payload.issues.some(blocksOdometerCheck) },
      )
  );
}

const ODOMETER_INPUTS = new Set<PropertyKey | undefined>(["odometerKm", "refueledOn"]);

/** An issue on the whole input (empty path, e.g. null) or on date/odometer skips the check. */
function blocksOdometerCheck(issue: { path?: PropertyKey[] }): boolean {
  return !issue.path?.length || ODOMETER_INPUTS.has(issue.path[0]);
}

/** The validated fields; types.ts adds the ones without rules to the full RefuelingInput. */
export type RefuelingFields = z.infer<ReturnType<typeof createRefuelingSchema>>;

/** Warnings do not block saving, so they are kept apart from the schema's errors. */
export function getRefuelingWarnings(
  input: Pick<RefuelingFields, "odometerKm">,
  context: RefuelingContext,
): { odometerKm?: RefuelingWarningCode } {
  const warning = distanceWarning(input.odometerKm, context);
  return warning ? { odometerKm: warning } : {};
}
