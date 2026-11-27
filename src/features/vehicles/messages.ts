// Texts of the vehicle feature (ADR 0014, 0016). The logic only knows codes and enum values;
// they map to i18n keys here and the wording lives in src/locales.
import { i18n, translate, type TextKey } from "@/lib/i18n";

import type { VehicleErrorCode } from "./logic/vehicleSchema";
import type { FuelType } from "./types";

/** Names as on the pump and in Tankerkönig (M1). */
export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  e5: i18n.t("vehicles.fuelTypes.e5"),
  e10: i18n.t("vehicles.fuelTypes.e10"),
  diesel: i18n.t("vehicles.fuelTypes.diesel"),
};

// Record over the full union: a new code without a key is a type error.
const ERROR_KEYS: Record<VehicleErrorCode, TextKey> = {
  nameMissing: "vehicles.errors.nameMissing",
  fuelTypeMissing: "vehicles.errors.fuelTypeMissing",
  odometerMissing: "vehicles.errors.odometerMissing",
  odometerInvalid: "vehicles.errors.odometerInvalid",
  tankCapacityMissing: "vehicles.errors.tankCapacityMissing",
  tankCapacityInvalid: "vehicles.errors.tankCapacityInvalid",
  consumptionInvalid: "vehicles.errors.consumptionInvalid",
  valueTooLarge: "vehicles.errors.valueTooLarge",
};

// Failed requests. Without a network is the usual cause, so the text says what to check.
// Built once at load in the start language; a language change needs a restart (ADR 0016).
export const LOAD_ERROR_TEXT = i18n.t("vehicles.loadError");
export const SAVE_ERROR_TEXT = i18n.t("vehicles.saveError");
export const SWITCH_ERROR_TEXT = i18n.t("vehicles.switchError");
export const DELETE_ERROR_TEXT = i18n.t("vehicles.deleteError");

/** Confirmation before deleting (M1). Says what else is lost, because it cannot be undone. */
export function deleteVehicleTitle(name: string): string {
  return i18n.t("vehicles.deleteTitle", { name });
}
export const DELETE_VEHICLE_MESSAGE = i18n.t("vehicles.deleteMessage");

/** Edit screen of a vehicle that was deleted meanwhile, e.g. on another device. */
export const NOT_FOUND_TEXT = i18n.t("vehicles.notFound");

/** "1 Fahrzeug", "2 Fahrzeuge" (settings, mockup 7.9). Plural forms live in the locale file. */
export function vehicleCountText(count: number): string {
  return i18n.t("vehicles.count", { count });
}

/** Shown if a validation message is not one of our codes, so the user never sees a raw code. */
export const UNKNOWN_ERROR_TEXT = i18n.t("vehicles.errors.unknown");

function isErrorCode(message: string): message is VehicleErrorCode {
  return Object.hasOwn(ERROR_KEYS, message);
}

/** Text for a schema issue; takes the issue's `message`, which is a code. */
export function vehicleErrorText(message: string): string {
  return isErrorCode(message) ? translate(ERROR_KEYS[message]) : UNKNOWN_ERROR_TEXT;
}
