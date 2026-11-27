// Texts for the refueling validation codes (ADR 0014, 0016). The logic only knows codes; they
// map to i18n keys here, and limits are formatted here, on the presentation side.
import { formatEuro, formatKm } from "@/lib/format";
import { i18n, translate, type TextKey } from "@/lib/i18n";
import { TENTH_CENTS_PER_CENT } from "@/lib/units";

import {
  DISTANCE_WARNING_KM,
  MAX_PRICE_PER_LITER_TENTH_CENTS,
  MIN_PRICE_PER_LITER_TENTH_CENTS,
  type RefuelingErrorCode,
  type RefuelingWarningCode,
} from "./logic/rules";

// Record over the full union: a new code without a key is a type error.
const ERROR_KEYS: Record<RefuelingErrorCode, TextKey> = {
  dateInvalid: "refuelings.errors.dateInvalid",
  dateInFuture: "refuelings.errors.dateInFuture",
  volumeMissing: "refuelings.errors.volumeMissing",
  volumeNotPositive: "refuelings.errors.volumeNotPositive",
  volumeAboveTank: "refuelings.errors.volumeAboveTank",
  priceMissing: "refuelings.errors.priceMissing",
  priceOutOfRange: "refuelings.errors.priceOutOfRange",
  totalMissing: "refuelings.errors.totalMissing",
  totalNotPositive: "refuelings.errors.totalNotPositive",
  odometerMissing: "refuelings.errors.odometerMissing",
  valueTooLarge: "refuelings.errors.valueTooLarge",
  odometerBelowInitial: "refuelings.errors.odometerBelowInitial",
  odometerNotAbovePrevious: "refuelings.errors.odometerNotAbovePrevious",
  odometerNotBelowNext: "refuelings.errors.odometerNotBelowNext",
  odometerDuplicateSameDay: "refuelings.errors.odometerDuplicateSameDay",
};

const WARNING_KEYS: Record<RefuelingWarningCode, TextKey> = {
  distanceUnusuallyLarge: "refuelings.warnings.distanceUnusuallyLarge",
};

// Failed requests. Without a network is the usual cause, so the text says what to check.
export const LOAD_ERROR_TEXT = i18n.t("refuelings.loadError");
export const SAVE_ERROR_TEXT = i18n.t("refuelings.saveError");
export const DELETE_ERROR_TEXT = i18n.t("refuelings.deleteError");

/** Shown if a validation message is not one of our codes, so the user never sees a raw code. */
export const UNKNOWN_ERROR_TEXT = i18n.t("refuelings.errors.unknown");

function isErrorCode(message: string): message is RefuelingErrorCode {
  return Object.hasOwn(ERROR_KEYS, message);
}

/** Text for a schema issue; takes the issue's `message`, which is a code. */
export function refuelingErrorText(message: string): string {
  if (!isErrorCode(message)) return UNKNOWN_ERROR_TEXT;
  // The limits are formatted per call, so they follow the active language.
  return translate(ERROR_KEYS[message], {
    min: formatEuro(MIN_PRICE_PER_LITER_TENTH_CENTS / TENTH_CENTS_PER_CENT),
    max: formatEuro(MAX_PRICE_PER_LITER_TENTH_CENTS / TENTH_CENTS_PER_CENT),
  });
}

export function refuelingWarningText(code: RefuelingWarningCode): string {
  return translate(WARNING_KEYS[code], { distance: formatKm(DISTANCE_WARNING_KM) });
}
