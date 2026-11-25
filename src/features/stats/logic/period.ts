// Shared building blocks of the statistics (M8, M12, M13): month keys and the key figures of a
// period. Units as in the database (ADR 0012): ml, cents, tenths of a cent per liter, km.
//
// Months are "YYYY-MM" keys cut from the ISO date string. Dates are never turned into Date
// objects, so no time zone can shift a refueling into another month.
//
// Attribution rules, the same for every screen:
// - A refueling belongs to the month of its date (count, cost, liters, price).
// - Its km are the km since the previous refueling of the vehicle; for the first refueling the
//   km since the vehicle's initial odometer.
// - A consumption interval belongs to the month of the full refueling that closes it (M7). An
//   interval that starts before the period still counts completely.
//
// Empty periods: sums (count, cost, liters, km) are 0, values that only exist with data
// (average price, consumption) are null, so an empty month is never shown as "0,00 €/L".

import {
  averageConsumption,
  type ConsumptionInput,
  consumptionByRefueling,
  type RefuelingConsumption,
  sortChronologically,
} from "@/features/refuelings/logic/consumption";

/** Key of a calendar month, "YYYY-MM". */
export type MonthKey = string;

/** The fields of a refueling the statistics need. */
export type StatsInput = ConsumptionInput & {
  pricePerLiterTenthCents: number;
  totalCents: number;
};

/** One refueling with the values derived from its neighbours. */
export type StatsEntry = {
  refueling: StatsInput;
  month: MonthKey;
  distanceKm: number;
  consumption: RefuelingConsumption | undefined;
};

export type PeriodStats = {
  refuelingCount: number;
  totalCents: number;
  volumeMl: number;
  distanceKm: number;
  avgPricePerLiterTenthCents: number | null;
  consumptionMlPer100Km: number | null;
};

export type MonthStats = PeriodStats & { month: MonthKey };

export const MONTHS_PER_YEAR = 12;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_KEY = /^(\d{4})-(\d{2})$/;
const MONTH_KEY_LENGTH = "YYYY-MM".length;

/** "2026-11-25" → "2026-11". Throws on anything that is not an ISO date (developer error). */
export function monthOf(isoDate: string): MonthKey {
  if (!ISO_DATE.test(isoDate)) throw new Error(`Expected YYYY-MM-DD, got "${isoDate}"`);
  return isoDate.slice(0, MONTH_KEY_LENGTH);
}

/** Moves a month key by whole months, e.g. ("2026-01", -1) → "2025-12". */
export function addMonths(month: MonthKey, offset: number): MonthKey {
  const match = MONTH_KEY.exec(month);
  if (match === null) throw new Error(`Expected YYYY-MM, got "${month}"`);
  const index = Number(match[1]) * MONTHS_PER_YEAR + Number(match[2]) - 1 + offset;
  const year = Math.floor(index / MONTHS_PER_YEAR);
  const monthNumber = (index % MONTHS_PER_YEAR) + 1;
  return `${year}-${String(monthNumber).padStart(2, "0")}`;
}

/** The twelve month keys of a year, January first. */
export function monthsOfYear(year: number): MonthKey[] {
  return Array.from({ length: MONTHS_PER_YEAR }, (_, index) => addMonths(`${year}-01`, index));
}

/** All refuelings of one vehicle (any order), oldest first, with km and consumption. */
export function statsEntries(
  refuelings: readonly StatsInput[],
  initialOdometerKm: number,
): StatsEntry[] {
  const consumption = consumptionByRefueling(refuelings);
  let previousKm = initialOdometerKm;
  return sortChronologically(refuelings).map((refueling) => {
    const distanceKm = refueling.odometerKm - previousKm;
    previousKm = refueling.odometerKm;
    const month = monthOf(refueling.refueledOn);
    return { refueling, month, distanceKm, consumption: consumption.get(refueling.id) };
  });
}

/** Entries from month `first` to month `last`, both included. */
export function entriesBetween(
  entries: readonly StatsEntry[],
  first: MonthKey,
  last: MonthKey,
): StatsEntry[] {
  return entries.filter((entry) => entry.month >= first && entry.month <= last);
}

/** Key figures of any set of entries: a month, a 12-month window or a year. */
export function periodStats(entries: readonly StatsEntry[]): PeriodStats {
  const refuelings = entries.map((entry) => entry.refueling);
  return {
    refuelingCount: entries.length,
    totalCents: sum(refuelings, (refueling) => refueling.totalCents),
    volumeMl: sum(refuelings, (refueling) => refueling.volumeMl),
    distanceKm: sum(entries, (entry) => entry.distanceKm),
    avgPricePerLiterTenthCents: averagePricePerLiter(refuelings),
    consumptionMlPer100Km: averageConsumption(entries.flatMap((entry) => entry.consumption ?? [])),
  };
}

/** Key figures of one calendar month. */
export function monthStats(entries: readonly StatsEntry[], month: MonthKey): MonthStats {
  return { month, ...periodStats(entriesBetween(entries, month, month)) };
}

/**
 * Σ(price × liters) / Σ liters, rounded to tenths of a cent, or null without liters. Weighted by
 * liters, so 5 L at a high price count less than 50 L at a low one.
 */
export function averagePricePerLiter(
  refuelings: readonly Pick<StatsInput, "pricePerLiterTenthCents" | "volumeMl">[],
): number | null {
  const volumeMl = sum(refuelings, (refueling) => refueling.volumeMl);
  if (volumeMl === 0) return null;
  const priceTimesVolume = sum(
    refuelings,
    (refueling) => refueling.pricePerLiterTenthCents * refueling.volumeMl,
  );
  return Math.round(priceTimesVolume / volumeMl);
}

function sum<T>(items: readonly T[], value: (item: T) => number): number {
  return items.reduce((total, item) => total + value(item), 0);
}
