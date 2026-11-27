// The values of the refueling form (M4): the text of each input, before parsing. The schema
// below is not for validating input (schema.ts does that) but for checking what was stored as a
// draft (M15), so it accepts half-finished input such as empty strings.
import { z } from "zod";

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
