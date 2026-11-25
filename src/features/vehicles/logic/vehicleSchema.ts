// Validation schema for the vehicle form (M1), ADR 0009. Each field takes the text of its input
// and returns the value in the database unit (ADR 0012), so the output can be saved as it is.
// Errors are codes, not text (ADR 0014): messages.ts turns them into German text.
import { z } from "zod";

import { Constants } from "@/lib/database.types";
import { parseDecimal, parseWholeNumber } from "@/lib/parse";
import { MAX_DB_INTEGER, ML_PER_LITER } from "@/lib/units";

import type { VehicleInput } from "../types";

/** The fuel types in the order of the database enum: e5, e10, diesel. */
export const FUEL_TYPES = Constants.public.Enums.fuel_type;

export type VehicleErrorCode =
  | "nameMissing"
  | "fuelTypeMissing"
  | "odometerMissing"
  | "odometerInvalid"
  | "tankCapacityMissing"
  | "tankCapacityInvalid"
  | "consumptionInvalid"
  | "valueTooLarge";

/** Typed shorthand, so a misspelled code is a type error. */
const code = (value: VehicleErrorCode) => value;

/** Optional free text; empty becomes null, like a column that was never set. */
const optionalText = z
  .string()
  .trim()
  .transform((text) => text || null);

/** Whole kilometers as typed, e.g. "84000". */
const odometerKm = z
  .string()
  .trim()
  .min(1, code("odometerMissing"))
  .transform(parseWholeNumber)
  .pipe(z.number(code("odometerInvalid")).max(MAX_DB_INTEGER, code("valueTooLarge")));

/**
 * Parsed liters → whole ml. The value is checked after rounding, so "0,0004" (0 ml) is
 * rejected like 0. NaN from the parser fails z.number() and also reports `invalid`.
 */
function litersAsMl(invalid: VehicleErrorCode) {
  return z
    .number(code(invalid))
    .transform((liters) => Math.round(liters * ML_PER_LITER))
    .pipe(z.number().positive(code(invalid)).max(MAX_DB_INTEGER, code("valueTooLarge")));
}

const tankCapacityMl = z
  .string()
  .trim()
  .min(1, code("tankCapacityMissing"))
  .transform(parseDecimal)
  .pipe(litersAsMl("tankCapacityInvalid"));

/** Optional: empty becomes null, anything else must be a valid number of liters. */
const consumptionMlPer100Km = z
  .string()
  .trim()
  .transform((text) => (text === "" ? null : parseDecimal(text)))
  .pipe(litersAsMl("consumptionInvalid").nullable());

export const vehicleSchema = z.object({
  name: z.string().trim().min(1, code("nameMissing")),
  fuelType: z.enum(FUEL_TYPES, code("fuelTypeMissing")),
  initialOdometerKm: odometerKm,
  tankCapacityMl,
  makeModel: optionalText,
  licensePlate: optionalText,
  manufacturerConsumptionMlPer100Km: consumptionMlPer100Km,
}) satisfies z.ZodType<VehicleInput>;

/** The form's values: the text of each input, before parsing. */
export type VehicleFormValues = z.input<typeof vehicleSchema>;
