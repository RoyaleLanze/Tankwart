// Validation schema for the vehicle form (M1), ADR 0009. The form holds the text of each input
// in the unit the user types (km, L, L/100 km). The schema parses it and returns a VehicleInput
// in the database units (ADR 0012), so the output can be saved as it is.
// Errors are codes, not text (ADR 0014): messages.ts turns them into German text.
import { z } from "zod";

import { Constants } from "@/lib/database.types";
import { decimalInputText, parseDecimal, parseWholeNumber } from "@/lib/parse";
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

/** Required text; empty, only spaces or no value at all (undefined, null) is `missing`. */
function requiredText(missing: VehicleErrorCode) {
  return z.string(code(missing)).trim().min(1, code(missing));
}

/** Optional text; empty or no value becomes null, like a column that was never set. */
const optionalText = z
  .string()
  .trim()
  .nullish()
  .transform((text) => text || null);

/**
 * A number from the parser: NaN is text it cannot read (`invalid`), Infinity has more digits
 * than a number holds and is reported like any other value that is too large.
 */
function parsedNumber(invalid: VehicleErrorCode) {
  return z.number({
    error: (issue) => (issue.input === Infinity ? code("valueTooLarge") : code(invalid)),
  });
}

/** Whole kilometers as typed, e.g. "84000". */
const odometerKm = requiredText("odometerMissing")
  .transform(parseWholeNumber)
  .pipe(parsedNumber("odometerInvalid").max(MAX_DB_INTEGER, code("valueTooLarge")));

/** Parsed liters → whole ml, checked after rounding, so "0,0004" (0 ml) is rejected like 0. */
function litersAsMl(invalid: VehicleErrorCode) {
  return parsedNumber(invalid)
    .transform((liters) => Math.round(liters * ML_PER_LITER))
    .pipe(parsedNumber(invalid).positive(code(invalid)).max(MAX_DB_INTEGER, code("valueTooLarge")));
}

const tankCapacityMl = requiredText("tankCapacityMissing")
  .transform(parseDecimal)
  .pipe(litersAsMl("tankCapacityInvalid"));

const consumptionMlPer100Km = optionalText
  .transform((text) => (text === null ? null : parseDecimal(text)))
  .pipe(litersAsMl("consumptionInvalid").nullable());

export const vehicleSchema = z
  .object({
    name: requiredText("nameMissing"),
    fuelType: z.enum(FUEL_TYPES, code("fuelTypeMissing")),
    initialOdometerKm: odometerKm,
    tankCapacityLiters: tankCapacityMl,
    makeModel: optionalText,
    licensePlate: optionalText,
    consumptionLitersPer100Km: consumptionMlPer100Km,
  })
  // The form fields are named after what the user types. Their values are already in ml,
  // so only the keys change to the names of the database units.
  .transform(
    ({
      tankCapacityLiters: tankCapacityMl,
      consumptionLitersPer100Km: manufacturerConsumptionMlPer100Km,
      ...rest
    }): VehicleInput => ({ ...rest, tankCapacityMl, manufacturerConsumptionMlPer100Km }),
  ) satisfies z.ZodType<VehicleInput>;

/** The form's values: the text of each input, before parsing. */
export type VehicleFormValues = z.input<typeof vehicleSchema>;

const litersText = (ml: number) => decimalInputText(ml / ML_PER_LITER);

/**
 * The way back for editing: a stored vehicle as the text the form starts with. Saving it
 * unchanged gives the same vehicle again (round trip, see the tests).
 */
export function vehicleToFormValues(vehicle: VehicleInput): VehicleFormValues {
  const consumption = vehicle.manufacturerConsumptionMlPer100Km;
  return {
    name: vehicle.name,
    fuelType: vehicle.fuelType,
    initialOdometerKm: String(vehicle.initialOdometerKm),
    tankCapacityLiters: litersText(vehicle.tankCapacityMl),
    makeModel: vehicle.makeModel ?? "",
    licensePlate: vehicle.licensePlate ?? "",
    consumptionLitersPer100Km: consumption === null ? "" : litersText(consumption),
  };
}
