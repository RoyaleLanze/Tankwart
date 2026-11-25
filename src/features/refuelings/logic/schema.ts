// Validation schema for a refueling (M4), ADR 0009. Messages are shown at the field, so they are German.
import { z } from "zod";

import { formatEuro, TENTH_CENTS_PER_CENT } from "@/lib/format";

import {
  distanceWarning,
  MAX_DB_INTEGER,
  MAX_PRICE_PER_LITER_TENTH_CENTS,
  maxVolumeMl,
  MIN_PRICE_PER_LITER_TENTH_CENTS,
  odometerError,
  type RefuelingContext,
} from "./rules";

const PRICE_RANGE_MESSAGE = `Literpreis muss zwischen ${formatEuro(
  MIN_PRICE_PER_LITER_TENTH_CENTS / TENTH_CENTS_PER_CENT,
)} und ${formatEuro(MAX_PRICE_PER_LITER_TENTH_CENTS / TENTH_CENTS_PER_CENT)} liegen.`;
const TOO_LARGE_MESSAGE = "Wert ist zu groß.";

/** Whole number field with a German message for empty, non-numeric and fractional input. */
function wholeNumber(missingMessage: string) {
  return z.int({ error: missingMessage }).max(MAX_DB_INTEGER, TOO_LARGE_MESSAGE);
}

/** Builds the schema for one vehicle; the context rules close over it. */
export function createRefuelingSchema(context: RefuelingContext) {
  return z
    .object({
      refueledOn: z.iso
        // abort: an invalid date must not also be reported as lying in the future.
        .date({ error: "Bitte ein gültiges Datum angeben.", abort: true })
        // ISO dates compare correctly as strings; today() is read at validation time.
        .refine((date) => date <= context.today(), "Datum darf nicht in der Zukunft liegen."),
      volumeMl: wholeNumber("Bitte die Liter angeben.")
        .positive("Liter müssen größer als 0 sein.")
        .max(maxVolumeMl(context.tankCapacityMl), "Mehr Liter als in den Tank passen."),
      pricePerLiterTenthCents: wholeNumber("Bitte den Literpreis angeben.")
        .min(MIN_PRICE_PER_LITER_TENTH_CENTS, PRICE_RANGE_MESSAGE)
        .max(MAX_PRICE_PER_LITER_TENTH_CENTS, PRICE_RANGE_MESSAGE),
      totalCents: wholeNumber("Bitte den Gesamtbetrag angeben.").positive(
        "Gesamtbetrag muss größer als 0 sein.",
      ),
      odometerKm: wholeNumber("Bitte den Kilometerstand angeben."),
    })
    // Needs date and odometer together, so it runs on the object and reports at the odometer.
    // `when` lets it run even if other fields are invalid, as long as these two are valid.
    .superRefine(
      ({ odometerKm, refueledOn }, ctx) => {
        const message = odometerError(odometerKm, refueledOn, context);
        if (message) ctx.addIssue({ code: "custom", message, path: ["odometerKm"] });
      },
      { when: (payload) => !payload.issues.some((issue) => ODOMETER_INPUTS.has(issue.path?.[0])) },
    );
}

const ODOMETER_INPUTS = new Set<PropertyKey | undefined>(["odometerKm", "refueledOn"]);

export type RefuelingInput = z.infer<ReturnType<typeof createRefuelingSchema>>;

/** Warnings do not block saving, so they are kept apart from the schema's errors. */
export function getRefuelingWarnings(
  input: Pick<RefuelingInput, "odometerKm">,
  context: RefuelingContext,
): { odometerKm?: string } {
  const warning = distanceWarning(input.odometerKm, context);
  return warning ? { odometerKm: warning } : {};
}
