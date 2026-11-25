// Fuel consumption by the full-tank method (M7). Units as in the database: ml, km.
//
// Each full refueling closes an interval: all liters after the previous full refueling up to
// and including this one, divided by the km in between. The first full refueling is only the
// starting point. An interval with a missed refueling ("previous_missed") is not counted.

/** The fields of a refueling the calculation needs. */
export type ConsumptionInput = {
  id: string;
  refueledOn: string;
  odometerKm: number;
  volumeMl: number;
  isFullTank: boolean;
  previousMissed: boolean;
};

/** What the history shows for one refueling (design-system.md → EntryListItem). */
export type RefuelingConsumption =
  | { kind: "interval"; mlPer100Km: number; volumeMl: number; distanceKm: number }
  | { kind: "start" }
  | { kind: "partial" }
  | { kind: "notCounted" };

const KM_PER_100_KM = 100;

/** Oldest first; same day ordered by odometer (ADR 0012). Returns a new array. */
export function sortChronologically<T extends ConsumptionInput>(refuelings: readonly T[]): T[] {
  return [...refuelings].sort((a, b) =>
    a.refueledOn === b.refueledOn
      ? a.odometerKm - b.odometerKm
      : a.refueledOn.localeCompare(b.refueledOn),
  );
}

/** Consumption result per refueling id, for all refuelings of one vehicle in any order. */
export function consumptionByRefueling(
  refuelings: readonly ConsumptionInput[],
): Map<string, RefuelingConsumption> {
  const results = new Map<string, RefuelingConsumption>();
  let start: ConsumptionInput | null = null;
  let volumeSinceStart = 0;
  let intervalValid = true;

  for (const refueling of sortChronologically(refuelings)) {
    if (refueling.previousMissed) intervalValid = false;
    volumeSinceStart += refueling.volumeMl;

    if (!refueling.isFullTank) {
      results.set(refueling.id, { kind: "partial" });
      continue;
    }
    results.set(refueling.id, closeInterval(start, refueling, volumeSinceStart, intervalValid));
    start = refueling;
    volumeSinceStart = 0;
    intervalValid = true;
  }
  return results;
}

function closeInterval(
  start: ConsumptionInput | null,
  end: ConsumptionInput,
  volumeMl: number,
  valid: boolean,
): RefuelingConsumption {
  if (start === null) return { kind: "start" };
  const distanceKm = end.odometerKm - start.odometerKm;
  if (!valid || distanceKm <= 0) return { kind: "notCounted" };
  const mlPer100Km = Math.round((volumeMl * KM_PER_100_KM) / distanceKm);
  return { kind: "interval", mlPer100Km, volumeMl, distanceKm };
}

/**
 * Average over counted intervals, weighted by distance (total liters / total km), or null if
 * there is none, i.e. fewer than two full refuelings: then a hint is shown instead (M7).
 */
export function averageConsumption(results: Iterable<RefuelingConsumption>): number | null {
  let volumeMl = 0;
  let distanceKm = 0;
  for (const result of results) {
    if (result.kind !== "interval") continue;
    volumeMl += result.volumeMl;
    distanceKm += result.distanceKm;
  }
  return distanceKm > 0 ? Math.round((volumeMl * KM_PER_100_KM) / distanceKm) : null;
}
