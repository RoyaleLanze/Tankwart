// Business limits for refuelings (M4). Units match the database: ml, tenths of a cent, cents, km.

/** 0.50 €/L, stored as tenths of a cent. */
export const MIN_PRICE_PER_LITER_TENTH_CENTS = 500;
/** 4.00 €/L, stored as tenths of a cent. */
export const MAX_PRICE_PER_LITER_TENTH_CENTS = 4000;
/** A refueling may fill up to 110 % of the tank capacity (filler neck, imprecise capacity). */
export const MAX_FILL_PERCENT_OF_TANK = 110;
/** More km since the last refueling than this is suspicious but allowed. */
export const DISTANCE_WARNING_KM = 2000;
/** Largest value of a Postgres `integer` column; larger values would fail on insert. */
export const MAX_DB_INTEGER = 2_147_483_647;

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

/** Largest volume accepted for a tank; integer math avoids 50000 * 1.1 = 55000.000000000004. */
export function maxVolumeMl(tankCapacityMl: number): number {
  return Math.floor((tankCapacityMl * MAX_FILL_PERCENT_OF_TANK) / 100);
}

/**
 * Error message if the odometer does not fit the history, else null. Earlier dates need a
 * lower odometer, later dates a higher one. On the same day the order is free (ADR 0012
 * orders same-day refuelings by odometer), only an identical reading is rejected.
 * ISO dates compare correctly as strings.
 */
export function odometerError(
  odometerKm: number,
  refueledOn: string,
  context: RefuelingContext,
): string | null {
  if (odometerKm < context.initialOdometerKm) {
    return "Kilometerstand liegt unter dem Anfangsstand des Fahrzeugs.";
  }
  for (const other of context.otherRefuelings) {
    if (other.refueledOn < refueledOn && odometerKm <= other.odometerKm) {
      return "Kilometerstand muss höher sein als bei der vorherigen Betankung.";
    }
    if (other.refueledOn > refueledOn && odometerKm >= other.odometerKm) {
      return "Kilometerstand muss niedriger sein als bei der nächsten Betankung.";
    }
    if (other.refueledOn === refueledOn && odometerKm === other.odometerKm) {
      return "Am selben Tag gibt es schon eine Betankung mit diesem Kilometerstand.";
    }
  }
  return null;
}

/** Warning (not an error) when the distance since the previous refueling is unusually large. */
export function distanceWarning(odometerKm: number, context: RefuelingContext): string | null {
  const lower = context.otherRefuelings
    .map((other) => other.odometerKm)
    .filter((km) => km < odometerKm);
  if (lower.length === 0) return null;
  return odometerKm - Math.max(...lower) > DISTANCE_WARNING_KM
    ? "Ungewöhnlich weit seit der letzten Betankung. Fehlt eine Betankung?"
    : null;
}
