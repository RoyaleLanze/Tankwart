// The values of the refueling form (M4): the text of each input, before parsing. The schema
// below is not for validating input (schema.ts does that) but for checking what was stored as a
// draft (M15), so it accepts half-finished input such as empty strings.
import { z } from "zod";

import { decimalInputText } from "@/lib/parse";
import { CENTS_PER_EURO, ML_PER_LITER, TENTH_CENTS_PER_EURO } from "@/lib/units";

import type { RefuelingInput } from "../types";

export const refuelingFormValuesSchema = z.object({
  /** ISO date (YYYY-MM-DD) or empty. */
  refueledOn: z.string(),
  volumeLiters: z.string(),
  pricePerLiter: z.string(),
  totalEuros: z.string(),
  odometerKm: z.string(),
  /** Tankerkönig station id; null when the station was typed in as free text (M5). */
  stationId: z.string().nullable(),
  stationName: z.string(),
  stationAddress: z.string(),
  isFullTank: z.boolean(),
  previousMissed: z.boolean(),
  note: z.string(),
});

export type RefuelingFormValues = z.infer<typeof refuelingFormValuesSchema>;

/**
 * The form values for editing a stored refueling: database units back to the text the user
 * types (decimal comma, no unit, no grouping), so saving without a change yields the same
 * values (see decimalInputText). Missing optional fields become empty text.
 */
export function formValuesOf(refueling: RefuelingInput): RefuelingFormValues {
  return {
    refueledOn: refueling.refueledOn,
    volumeLiters: decimalInputText(refueling.volumeMl / ML_PER_LITER),
    pricePerLiter: decimalInputText(refueling.pricePerLiterTenthCents / TENTH_CENTS_PER_EURO),
    totalEuros: decimalInputText(refueling.totalCents / CENTS_PER_EURO),
    odometerKm: String(refueling.odometerKm),
    stationId: refueling.stationId,
    stationName: refueling.stationName,
    stationAddress: refueling.stationAddress ?? "",
    isFullTank: refueling.isFullTank,
    previousMissed: refueling.previousMissed,
    note: refueling.note ?? "",
  };
}
