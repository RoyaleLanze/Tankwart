// German texts of the vehicle feature (ADR 0014). The logic only knows codes and enum values;
// the wording lives here, on the presentation side.
import type { VehicleErrorCode } from "./logic/vehicleSchema";
import type { FuelType } from "./types";

/** Names as on the pump and in Tankerkönig (M1). */
export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  e5: "Super E5",
  e10: "Super E10",
  diesel: "Diesel",
};

// Record over the full union: a new code without a text is a type error.
const ERROR_TEXTS: Record<VehicleErrorCode, string> = {
  nameMissing: "Gib einen Namen ein.",
  fuelTypeMissing: "Wähle einen Kraftstoff.",
  odometerMissing: "Gib den Kilometerstand ein.",
  odometerInvalid: "Gib den Kilometerstand als ganze Zahl ohne Punkt ein.",
  tankCapacityMissing: "Gib das Tankvolumen ein.",
  tankCapacityInvalid: "Das Tankvolumen muss eine Zahl größer als 0 sein.",
  consumptionInvalid: "Der Verbrauch muss eine Zahl größer als 0 sein.",
  valueTooLarge: "Der Wert ist zu groß.",
  initialOdometerAboveRefueling:
    "Der Kilometerstand liegt über dem einer vorhandenen Betankung. Gib einen niedrigeren Stand ein.",
  tankCapacityBelowRefueling:
    "Eine vorhandene Betankung passt nicht in dieses Tankvolumen. Gib ein größeres Volumen ein.",
};

// Failed requests. Without a network is the usual cause, so the text says what to check.
export const LOAD_ERROR_TEXT =
  "Deine Fahrzeuge konnten nicht geladen werden. Prüfe deine Internetverbindung und versuche es erneut.";
export const SAVE_ERROR_TEXT =
  "Das Fahrzeug konnte nicht gespeichert werden. Prüfe deine Internetverbindung und versuche es erneut.";
export const SWITCH_ERROR_TEXT =
  "Das Fahrzeug konnte nicht gewechselt werden. Prüfe deine Internetverbindung und versuche es erneut.";

/** Shown if a validation message is not one of our codes, so the user never sees a raw code. */
export const UNKNOWN_ERROR_TEXT = "Bitte prüfe deine Eingabe.";

function isErrorCode(message: string): message is VehicleErrorCode {
  return Object.hasOwn(ERROR_TEXTS, message);
}

/** Text for a schema issue; takes the issue's `message`, which is a code. */
export function vehicleErrorText(message: string): string {
  return isErrorCode(message) ? ERROR_TEXTS[message] : UNKNOWN_ERROR_TEXT;
}
