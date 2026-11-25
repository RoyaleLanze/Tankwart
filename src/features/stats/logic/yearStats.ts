// Year chart (M12): one entry per month plus the whole year, and the summary of the metric the
// chart shows. Attribution and empty months follow period.ts; km and consumption of January
// also use the refuelings of the year before.

import {
  entriesBetween,
  type MonthKey,
  monthStats,
  type MonthStats,
  monthsOfYear,
  periodStats,
  type PeriodStats,
  type StatsInput,
  statsEntries,
} from "./period";

/** The values the chart can switch between (M12). */
export type YearMetric =
  "distanceKm" | "totalCents" | "avgPricePerLiterTenthCents" | "consumptionMlPer100Km";

export type YearStats = { year: number; months: MonthStats[]; total: PeriodStats };

/** Sum, average and the marked months for the chosen metric (M12). */
export type MetricSummary = {
  /** Only for km and spending; a sum of prices or consumptions means nothing. */
  sum: number | null;
  average: number | null;
  highestMonth: MonthKey | null;
  lowestMonth: MonthKey | null;
};

/** Metrics that add up over months; the others are rates over the whole year. */
const ADDITIVE_METRICS: ReadonlySet<YearMetric> = new Set(["distanceKm", "totalCents"]);

/** Statistics of one year for all refuelings of one vehicle (any order, any years). */
export function yearStats(
  refuelings: readonly StatsInput[],
  initialOdometerKm: number,
  year: number,
): YearStats {
  const entries = statsEntries(refuelings, initialOdometerKm);
  const months = monthsOfYear(year);
  return {
    year,
    months: months.map((month) => monthStats(entries, month)),
    total: periodStats(entriesBetween(entries, months[0], months[months.length - 1])),
  };
}

/**
 * The bar of a month, or null for a month without a value. A month without refuelings has no
 * bar even for km and spending (0 there), so it is never marked as the lowest month.
 */
export function metricValue(month: MonthStats, metric: YearMetric): number | null {
  return month.refuelingCount === 0 ? null : month[metric];
}

/**
 * Additive metrics: sum of the year and average per month with a value (empty months, such as
 * the rest of the current year, would otherwise pull the average down). Rates: the value of the
 * whole year, weighted like a single month, not the mean of the monthly values.
 */
export function summarizeMetric(stats: YearStats, metric: YearMetric): MetricSummary {
  const valued = stats.months.flatMap((month) => {
    const value = metricValue(month, metric);
    return value === null ? [] : [{ month: month.month, value }];
  });
  const extremes = extremeMonths(valued);
  if (!ADDITIVE_METRICS.has(metric)) {
    return { sum: null, average: stats.total[metric], ...extremes };
  }
  const total = valued.reduce((sum, month) => sum + month.value, 0);
  const average = valued.length > 0 ? Math.round(total / valued.length) : null;
  return { sum: total, average, ...extremes };
}

/**
 * On a tie the earlier month wins. If highest and lowest are equal (one valued month or all the
 * same), no month is marked, since a mark would highlight nothing.
 */
function extremeMonths(
  valued: readonly { month: MonthKey; value: number }[],
): Pick<MetricSummary, "highestMonth" | "lowestMonth"> {
  const unmarked = { highestMonth: null, lowestMonth: null };
  if (valued.length === 0) return unmarked;
  let highest = valued[0];
  let lowest = valued[0];
  for (const entry of valued) {
    if (entry.value > highest.value) highest = entry;
    if (entry.value < lowest.value) lowest = entry;
  }
  if (highest.value === lowest.value) return unmarked;
  return { highestMonth: highest.month, lowestMonth: lowest.month };
}
