// Month comparison and bargains (M13). Attribution and empty months follow period.ts.

import { ML_TENTH_CENTS_PER_CENT, TENTH_CENTS_PER_CENT } from "@/lib/units";

import {
  addMonths,
  averagePricePerLiter,
  entriesBetween,
  type MonthKey,
  monthOf,
  monthStats,
  type MonthStats,
  priceTimesVolume,
  type StatsEntry,
  type StatsInput,
  statsEntries,
} from "./period";

/** A month with the figures only the comparison shows. */
export type ComparedMonth = MonthStats & {
  /** Spending per km driven, or null without km. */
  costPerKmTenthCents: number | null;
};

type Figure = Exclude<keyof ComparedMonth, "month">;
/** Current minus base per figure; null if one of the two values is null. */
export type MonthDelta = Record<Figure, number | null>;

export type MonthComparison = {
  base: ComparedMonth;
  current: ComparedMonth;
  delta: MonthDelta;
  /** Positive: the current month was cheaper per liter than the base month. */
  savingsCents: number | null;
};

/** Default selection: the month before today as base, today's month as current. */
export function defaultMonths(today: string): { base: MonthKey; current: MonthKey } {
  const current = monthOf(today);
  return { base: addMonths(current, -1), current };
}

/** Both months, their differences (current minus base) and the savings. */
export function compareMonths(
  refuelings: readonly StatsInput[],
  initialOdometerKm: number,
  months: { base: MonthKey; current: MonthKey },
): MonthComparison {
  const entries = statsEntries(refuelings, initialOdometerKm);
  const base = withCostPerKm(monthStats(entries, months.base));
  const current = withCostPerKm(monthStats(entries, months.current));
  const savingsCents = savings(entries, base, current);
  return { base, current, delta: delta(base, current), savingsCents };
}

/**
 * Ids of refuelings that are strictly cheaper than the average price of their month. Compared
 * with the rounded average the UI shows, so a bargain never displays the same price as the average.
 */
export function bargainIds(refuelings: readonly StatsInput[]): Set<string> {
  const bargains = new Set<string>();
  for (const inMonth of groupByMonth(refuelings).values()) {
    const average = averagePricePerLiter(inMonth);
    for (const refueling of inMonth) {
      if (average !== null && refueling.pricePerLiterTenthCents < average) {
        bargains.add(refueling.id);
      }
    }
  }
  return bargains;
}

function withCostPerKm(month: MonthStats): ComparedMonth {
  const { totalCents, distanceKm } = month;
  const costPerKmTenthCents =
    distanceKm > 0 ? Math.round((totalCents * TENTH_CENTS_PER_CENT) / distanceKm) : null;
  return { ...month, costPerKmTenthCents };
}

function delta(base: ComparedMonth, current: ComparedMonth): MonthDelta {
  const diff = (figure: Figure) => difference(base[figure], current[figure]);
  return {
    refuelingCount: diff("refuelingCount"),
    totalCents: diff("totalCents"),
    volumeMl: diff("volumeMl"),
    distanceKm: diff("distanceKm"),
    avgPricePerLiterTenthCents: diff("avgPricePerLiterTenthCents"),
    consumptionMlPer100Km: diff("consumptionMlPer100Km"),
    costPerKmTenthCents: diff("costPerKmTenthCents"),
  };
}

function difference(base: number | null, current: number | null): number | null {
  return base === null || current === null ? null : current - base;
}

/**
 * (Ø price base − Ø price current) × liters of the current month, in cents. Uses the exact,
 * unrounded averages and rounds only the result, so rounding the prices adds no error. A tiny
 * loss would round to −0, which formats as "−0,00 €"; `|| 0` turns it into 0.
 * Rearranged to Σ(p × V) base × V current / V base − Σ(p × V) current.
 */
function savings(
  entries: readonly StatsEntry[],
  base: ComparedMonth,
  current: ComparedMonth,
): number | null {
  if (base.volumeMl === 0 || current.volumeMl === 0) return null;
  const basePriceTimesVolume = priceTimesVolume(refuelingsIn(entries, base.month));
  const atBasePrice = (basePriceTimesVolume * current.volumeMl) / base.volumeMl;
  const paid = priceTimesVolume(refuelingsIn(entries, current.month));
  return Math.round((atBasePrice - paid) / ML_TENTH_CENTS_PER_CENT) || 0;
}

function refuelingsIn(entries: readonly StatsEntry[], month: MonthKey): StatsInput[] {
  return entriesBetween(entries, month, month).map((entry) => entry.refueling);
}

function groupByMonth(refuelings: readonly StatsInput[]): Map<MonthKey, StatsInput[]> {
  const groups = new Map<MonthKey, StatsInput[]>();
  for (const refueling of refuelings) {
    const month = monthOf(refueling.refueledOn);
    groups.set(month, [...(groups.get(month) ?? []), refueling]);
  }
  return groups;
}
