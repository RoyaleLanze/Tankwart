// Home overview (M8): the current month's spending with the difference to the previous month,
// and the average consumption over the last 12 months. Attribution and empty months follow
// period.ts.

import {
  addMonths,
  entriesBetween,
  monthOf,
  monthStats,
  type MonthStats,
  periodStats,
  type StatsInput,
  statsEntries,
} from "./period";

export type HomeOverview = {
  current: MonthStats;
  previous: MonthStats;
  /** current − previous; positive means more spending this month. */
  costDifferenceCents: number;
  /** Distance-weighted over intervals closed within the window, or null if none. */
  averageConsumptionMlPer100Km: number | null;
};

/** "Ø-Verbrauch (12 Monate)": the current calendar month and the 11 before it. */
export const CONSUMPTION_WINDOW_MONTHS = 12;

/** Everything the home screen shows, for all refuelings of the active vehicle. */
export function homeOverview(
  refuelings: readonly StatsInput[],
  initialOdometerKm: number,
  today: string,
): HomeOverview {
  const entries = statsEntries(refuelings, initialOdometerKm);
  const month = monthOf(today);
  const current = monthStats(entries, month);
  const previous = monthStats(entries, addMonths(month, -1));
  const firstWindowMonth = addMonths(month, 1 - CONSUMPTION_WINDOW_MONTHS);
  const window = periodStats(entriesBetween(entries, firstWindowMonth, month));
  return {
    current,
    previous,
    costDifferenceCents: current.totalCents - previous.totalCents,
    averageConsumptionMlPer100Km: window.consumptionMlPer100Km,
  };
}
