// Business limits for refuelings (M4). Units match the database: ml, tenths of a cent, cents, km.

/** 0.50 €/L, stored as tenths of a cent. */
export const MIN_PRICE_PER_LITER_TENTH_CENTS = 500;
/** 4.00 €/L, stored as tenths of a cent. */
export const MAX_PRICE_PER_LITER_TENTH_CENTS = 4000;
/** A refueling may fill up to 110 % of the tank capacity (filler neck, imprecise capacity). */
export const MAX_FILL_PERCENT_OF_TANK = 110;
/** More km since the last refueling than this is suspicious but allowed. */
export const DISTANCE_WARNING_KM = 2000;
// Lives in lib because the vehicle schema needs it too; re-exported so imports here stay the same.
export { MAX_DB_INTEGER } from "@/lib/units";

/** Validation results as codes; the feature's messages.ts turns them into German text (ADR 0014). */
export type RefuelingErrorCode =
  | "dateInvalid"
  | "dateInFuture"
  | "volumeMissing"
  | "volumeNotPositive"
  | "volumeAboveTank"
  | "priceMissing"
  | "priceOutOfRange"
  | "totalMissing"
  | "totalNotPositive"
  | "odometerMissing"
  | "stationMissing"
  | "valueTooLarge"
  | "odometerBelowInitial"
  | "odometerNotAbovePrevious"
  | "odometerNotBelowNext"
  | "odometerDuplicateSameDay"
  // Form only: the field was computed from the other two and breaks a rule (formSchema.ts).
  | "computedAmountInvalid";

export type RefuelingWarningCode = "distanceUnusuallyLarge";

/** Another refueling of the same vehicle, as far as the odometer rules need it. */
export type OtherRefueling = { refueledOn: string; odometerKm: number };

/** Data around the refueling that the rules need; supplied by the caller, so the rules stay pure. */
export type RefuelingContext = {
  /** Returns today as ISO date (YYYY-MM-DD) in the user's time zone, read at validation time. */
  today: () => string;
  tankCapacityMl: number;
  initialOdometerKm: number;
  /** All other refuelings of the vehicle; when editing, without the edited one. */
  otherRefuelings: readonly OtherRefueling[];
};

/**
 * The refuelings the rules compare against: all but the one being saved. A first save whose
 * response got lost already put that row in the list, and a retry must not clash with itself.
 */
export function withoutRefueling<T extends { id: string }>(
  refuelings: readonly T[],
  id: string,
): T[] {
  return refuelings.filter((refueling) => refueling.id !== id);
}

/** Largest volume accepted for a tank; integer math avoids 50000 * 1.1 = 55000.000000000004. */
export function maxVolumeMl(tankCapacityMl: number): number {
  return Math.floor((tankCapacityMl * MAX_FILL_PERCENT_OF_TANK) / 100);
}

/**
 * Error code if the odometer does not fit the history, else null. Earlier dates need a
 * lower odometer, later dates a higher one. On the same day the order is free (ADR 0012
 * orders same-day refuelings by odometer), only an identical reading is rejected.
 * ISO dates compare correctly as strings.
 */
export function odometerError(
  odometerKm: number,
  refueledOn: string,
  context: RefuelingContext,
): RefuelingErrorCode | null {
  if (odometerKm < context.initialOdometerKm) return "odometerBelowInitial";
  for (const other of context.otherRefuelings) {
    if (other.refueledOn < refueledOn && odometerKm <= other.odometerKm) {
      return "odometerNotAbovePrevious";
    }
    if (other.refueledOn > refueledOn && odometerKm >= other.odometerKm) {
      return "odometerNotBelowNext";
    }
    if (other.refueledOn === refueledOn && odometerKm === other.odometerKm) {
      return "odometerDuplicateSameDay";
    }
  }
  return null;
}

/** Warning (not an error) when the distance since the previous refueling is unusually large. */
export function distanceWarning(
  odometerKm: number,
  context: RefuelingContext,
): RefuelingWarningCode | null {
  const lower = context.otherRefuelings
    .map((other) => other.odometerKm)
    .filter((km) => km < odometerKm);
  if (lower.length === 0) return null;
  return odometerKm - Math.max(...lower) > DISTANCE_WARNING_KM
    ? "distanceUnusuallyLarge"
    : null;
}
