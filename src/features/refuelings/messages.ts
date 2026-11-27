// German texts for the refueling validation codes (ADR 0014). The logic only knows codes;
// wording and number formatting live here, on the presentation side.
import { formatEuro, formatKm } from "@/lib/format";
import { TENTH_CENTS_PER_CENT } from "@/lib/units";

import type { SaveErrorKind } from "./logic/saveError";
import {
  DISTANCE_WARNING_KM,
  MAX_PRICE_PER_LITER_TENTH_CENTS,
  MIN_PRICE_PER_LITER_TENTH_CENTS,
  type RefuelingErrorCode,
  type RefuelingWarningCode,
} from "./logic/rules";

const minPrice = formatEuro(MIN_PRICE_PER_LITER_TENTH_CENTS / TENTH_CENTS_PER_CENT);
const maxPrice = formatEuro(MAX_PRICE_PER_LITER_TENTH_CENTS / TENTH_CENTS_PER_CENT);

// Record over the full union: a new code without a text is a type error.
const ERROR_TEXTS: Record<RefuelingErrorCode, string> = {
  dateInvalid: "Bitte ein gültiges Datum angeben.",
  dateInFuture: "Datum darf nicht in der Zukunft liegen.",
  volumeMissing: "Bitte die Liter angeben.",
  volumeNotPositive: "Liter müssen größer als 0 sein.",
  volumeAboveTank: "Mehr Liter als in den Tank passen.",
  priceMissing: "Bitte den Literpreis angeben.",
  priceOutOfRange: `Literpreis muss zwischen ${minPrice} und ${maxPrice} liegen.`,
  totalMissing: "Bitte den Gesamtbetrag angeben.",
  totalNotPositive: "Gesamtbetrag muss größer als 0 sein.",
  odometerMissing: "Bitte den Kilometerstand angeben.",
  stationMissing: "Bitte die Tankstelle angeben.",
  valueTooLarge: "Wert ist zu groß.",
  odometerBelowInitial: "Kilometerstand liegt unter dem Anfangsstand des Fahrzeugs.",
  odometerNotAbovePrevious: "Kilometerstand muss höher sein als bei der vorherigen Betankung.",
  odometerNotBelowNext: "Kilometerstand muss niedriger sein als bei der nächsten Betankung.",
  odometerDuplicateSameDay: "Am selben Tag gibt es schon eine Betankung mit diesem Kilometerstand.",
  computedAmountInvalid:
    "Der berechnete Wert ist nicht plausibel. Prüfe die beiden eingegebenen Werte.",
};

const WARNING_TEXTS: Record<RefuelingWarningCode, string> = {
  distanceUnusuallyLarge: `Mehr als ${formatKm(DISTANCE_WARNING_KM)} seit der letzten Betankung. Fehlt eine Betankung? Dann aktiviere ‚Vorherige Betankung nicht erfasst‘.`,
};

// Failed requests. Without a network is the usual cause, so the text says what to check.
export const LOAD_ERROR_TEXT =
  "Deine Betankungen konnten nicht geladen werden. Prüfe deine Internetverbindung und versuche es erneut.";
export const SAVE_ERROR_TEXT =
  "Die Betankung konnte nicht gespeichert werden. Prüfe deine Internetverbindung und versuche es erneut.";
// The server was reached but refused the data, so a network hint would mislead.
export const SAVE_REJECTED_TEXT =
  "Die Betankung konnte nicht gespeichert werden. Bitte prüfe deine Eingaben.";
export const DELETE_ERROR_TEXT =
  "Die Betankung konnte nicht gelöscht werden. Prüfe deine Internetverbindung und versuche es erneut.";

/** Shown if a validation message is not one of our codes, so the user never sees a raw code. */
export const UNKNOWN_ERROR_TEXT = "Bitte die Eingabe prüfen.";

function isErrorCode(message: string): message is RefuelingErrorCode {
  return Object.hasOwn(ERROR_TEXTS, message);
}

/** Text for a schema issue; takes the issue's `message`, which is a code. */
export function refuelingErrorText(message: string): string {
  return isErrorCode(message) ? ERROR_TEXTS[message] : UNKNOWN_ERROR_TEXT;
}

/** Text for a failed save; a field error (saveFieldError) is shown at its field instead. */
export function saveErrorText(kind: SaveErrorKind): string {
  return kind === "rejected" ? SAVE_REJECTED_TEXT : SAVE_ERROR_TEXT;
}

export function refuelingWarningText(code: RefuelingWarningCode): string {
  return WARNING_TEXTS[code];
}
