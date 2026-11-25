// Validation schema for a refueling (M4), ADR 0009. Messages are shown at the field, so they are German.
import { z } from "zod";

import {
  distanceWarning,
  MAX_PRICE_PER_LITER_TENTH_CENTS,
  maxVolumeMl,
  MIN_PRICE_PER_LITER_TENTH_CENTS,
  odometerError,
  type RefuelingContext,
} from "./rules";

const PRICE_RANGE_MESSAGE = "Literpreis muss zwischen 0,50 € und 4,00 € liegen.";

/** Builds the schema for one vehicle and position in the history; the context rules close over it. */
export function createRefuelingSchema(context: RefuelingContext) {
  return z.object({
    refueledOn: z.iso
      // abort: an invalid date must not also be reported as lying in the future.
      .date({ error: "Bitte ein gültiges Datum angeben.", abort: true })
      // ISO dates compare correctly as strings.
      .refine((date) => date <= context.today, "Datum darf nicht in der Zukunft liegen."),
    volumeMl: z
      .int()
      .positive("Liter müssen größer als 0 sein.")
      .max(maxVolumeMl(context.tankCapacityMl), "Mehr Liter als in den Tank passen."),
    pricePerLiterTenthCents: z
      .int()
      .min(MIN_PRICE_PER_LITER_TENTH_CENTS, PRICE_RANGE_MESSAGE)
      .max(MAX_PRICE_PER_LITER_TENTH_CENTS, PRICE_RANGE_MESSAGE),
    totalCents: z.int().positive("Gesamtbetrag muss größer als 0 sein."),
    odometerKm: z.int().check((ctx) => {
      const message = odometerError(ctx.value, context);
      if (message) ctx.issues.push({ code: "custom", message, input: ctx.value });
    }),
  });
}

export type RefuelingInput = z.infer<ReturnType<typeof createRefuelingSchema>>;

/** Warnings do not block saving, so they are kept apart from the schema's errors. */
export function getRefuelingWarnings(
  input: Pick<RefuelingInput, "odometerKm">,
  context: RefuelingContext,
): { odometerKm?: string } {
  const warning = distanceWarning(input.odometerKm, context);
  return warning ? { odometerKm: warning } : {};
}
