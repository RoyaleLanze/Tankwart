// Business limits for refuelings (M4). Units match the database: ml, tenths of a cent, cents, km.

/** 0.50 €/L, stored as tenths of a cent. */
export const MIN_PRICE_PER_LITER_TENTH_CENTS = 500;
/** 4.00 €/L, stored as tenths of a cent. */
export const MAX_PRICE_PER_LITER_TENTH_CENTS = 4000;
/** A refueling may exceed the tank capacity by 10 % (filler neck, imprecise capacity). */
export const TANK_TOLERANCE_PERCENT = 110;
/** More km since the last refueling than this is suspicious but allowed. */
export const DISTANCE_WARNING_KM = 2000;

/** Data around the refueling that the rules need; supplied by the caller, so the rules stay pure. */
export type RefuelingContext = {
  /** Today as ISO date (YYYY-MM-DD) in the user's time zone. */
  today: string;
  tankCapacityMl: number;
  initialOdometerKm: number;
  /** Odometer of the refueling directly before this one by date, or null if there is none. */
  previousOdometerKm: number | null;
  /** Odometer of the refueling directly after this one by date (when editing), or null. */
  nextOdometerKm: number | null;
};

/** Largest volume accepted for a tank; integer math avoids 50000 * 1.1 = 55000.000000000004. */
export function maxVolumeMl(tankCapacityMl: number): number {
  return Math.floor((tankCapacityMl * TANK_TOLERANCE_PERCENT) / 100);
}

/** Error message for an odometer reading that does not fit between its neighbours, else null. */
export function odometerError(odometerKm: number, context: RefuelingContext): string | null {
  if (odometerKm < context.initialOdometerKm) {
    return "Kilometerstand liegt unter dem Anfangsstand des Fahrzeugs.";
  }
  if (context.previousOdometerKm !== null && odometerKm <= context.previousOdometerKm) {
    return "Kilometerstand muss höher sein als bei der vorherigen Betankung.";
  }
  if (context.nextOdometerKm !== null && odometerKm >= context.nextOdometerKm) {
    return "Kilometerstand muss niedriger sein als bei der nächsten Betankung.";
  }
  return null;
}

/** Warning (not an error) when the distance since the previous refueling is unusually large. */
export function distanceWarning(odometerKm: number, context: RefuelingContext): string | null {
  if (context.previousOdometerKm === null) return null;
  const distanceKm = odometerKm - context.previousOdometerKm;
  return distanceKm > DISTANCE_WARNING_KM
    ? "Ungewöhnlich weit seit der letzten Betankung. Fehlt eine Betankung?"
    : null;
}
