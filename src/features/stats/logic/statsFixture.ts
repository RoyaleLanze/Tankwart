// Test data for the statistics tests; not used by the app.

import type { StatsInput } from "./period";

let nextId = 0;

/** Full refueling of 40 L at 1,75⁰ € (70 €) by default; override what a test is about. */
export function refueling(overrides: Partial<StatsInput>): StatsInput {
  nextId += 1;
  return {
    id: `r${nextId}`,
    refueledOn: "2026-11-01",
    odometerKm: 10_000,
    volumeMl: 40_000,
    pricePerLiterTenthCents: 1750,
    totalCents: 7000,
    isFullTank: true,
    previousMissed: false,
    ...overrides,
  };
}
