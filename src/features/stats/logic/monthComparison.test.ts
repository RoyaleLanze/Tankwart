import { bargainIds, compareMonths, defaultMonths } from "./monthComparison";
import { refueling } from "./statsFixture";

const INITIAL_KM = 9_500;
const OCTOBER_TO_NOVEMBER = { base: "2026-10", current: "2026-11" };

// October: a (500 km from the initial odometer, start), b (closes 500 km).
// November: c (closes 500 km from b), d (partial), e (closes 1,000 km from c).
const a = refueling({
  refueledOn: "2026-10-05",
  odometerKm: 10_000,
  volumeMl: 40_000,
  pricePerLiterTenthCents: 1_800,
  totalCents: 7_200,
});
const b = refueling({
  refueledOn: "2026-10-20",
  odometerKm: 10_500,
  volumeMl: 30_000,
  pricePerLiterTenthCents: 1_700,
  totalCents: 5_100,
});
const c = refueling({
  refueledOn: "2026-11-03",
  odometerKm: 11_000,
  volumeMl: 35_000,
  pricePerLiterTenthCents: 1_600,
  totalCents: 5_600,
});
const d = refueling({
  refueledOn: "2026-11-15",
  odometerKm: 11_400,
  volumeMl: 20_000,
  pricePerLiterTenthCents: 1_750,
  totalCents: 3_500,
  isFullTank: false,
});
const e = refueling({
  refueledOn: "2026-11-28",
  odometerKm: 12_000,
  volumeMl: 25_000,
  pricePerLiterTenthCents: 1_650,
  totalCents: 4_125,
});
const history = [e, c, a, d, b];

describe("defaultMonths", () => {
  it("compares the current month with the previous one, also in January", () => {
    expect(defaultMonths("2026-11-25")).toEqual(OCTOBER_TO_NOVEMBER);
    expect(defaultMonths("2026-01-01")).toEqual({ base: "2025-12", current: "2026-01" });
  });
});

describe("compareMonths", () => {
  const comparison = compareMonths(history, INITIAL_KM, OCTOBER_TO_NOVEMBER);

  it("computes all figures of a month, km of the first refueling included", () => {
    expect(comparison.base).toEqual({
      month: "2026-10",
      refuelingCount: 2,
      totalCents: 12_300,
      volumeMl: 70_000,
      distanceKm: 1_000,
      // (1,800 × 40 + 1,700 × 30) / 70 = 1,757.14
      avgPricePerLiterTenthCents: 1_757,
      consumptionMlPer100Km: 6_000,
      costPerKmTenthCents: 123,
    });
  });

  it("returns current minus base for every figure", () => {
    expect(comparison.delta).toEqual({
      refuelingCount: 1,
      totalCents: 925,
      volumeMl: 10_000,
      distanceKm: 500,
      avgPricePerLiterTenthCents: -104,
      // (35 + 20 + 25) L / 1,500 km = 5,333 against 6,000
      consumptionMlPer100Km: -667,
      costPerKmTenthCents: -35,
    });
  });

  it("computes savings as price difference times the current month's liters", () => {
    // (1,757 − 1,653) × 80 L = 8,320 tenths of a cent = 832 cents
    expect(comparison.savingsCents).toBe(832);
    const reversed = { base: "2026-11", current: "2026-10" };
    // (1,653 − 1,757) × 70 L = −728 cents
    expect(compareMonths(history, INITIAL_KM, reversed).savingsCents).toBe(-728);
  });

  it("has no rate deltas and no savings when a month is empty", () => {
    const empty = compareMonths(history, INITIAL_KM, { base: "2026-11", current: "2026-12" });
    expect(empty.current).toMatchObject({ totalCents: 0, costPerKmTenthCents: null });
    expect(empty.delta.avgPricePerLiterTenthCents).toBeNull();
    expect(empty.delta.totalCents).toBe(-13_225);
    expect(empty.savingsCents).toBeNull();
  });

  it("allows comparing a month with itself", () => {
    const same = compareMonths(history, INITIAL_KM, { base: "2026-11", current: "2026-11" });
    expect(same.delta.totalCents).toBe(0);
    expect(same.savingsCents).toBe(0);
  });
});

describe("bargainIds", () => {
  it("marks refuelings below the average of their own month", () => {
    expect(bargainIds(history)).toEqual(new Set([b.id, c.id, e.id]));
  });

  it("never marks the only refueling of a month or a price equal to the average", () => {
    expect(bargainIds([a]).size).toBe(0);
    expect(bargainIds([refueling({}), refueling({})]).size).toBe(0);
  });

  it("compares with the rounded average the UI shows", () => {
    // The exact average 1,700.25 is shown as 1,700, so 1,700 is not below it.
    const cheap = refueling({ volumeMl: 30_000, pricePerLiterTenthCents: 1_700 });
    const dear = refueling({ volumeMl: 10_000, pricePerLiterTenthCents: 1_701 });
    expect(bargainIds([cheap, dear]).size).toBe(0);
  });

  it("uses each month's own average", () => {
    const october = refueling({ refueledOn: "2026-10-10", pricePerLiterTenthCents: 1_600 });
    const november = refueling({ refueledOn: "2026-11-10", pricePerLiterTenthCents: 1_900 });
    const novemberCheap = refueling({ refueledOn: "2026-11-20", pricePerLiterTenthCents: 1_800 });
    expect(bargainIds([october, november, novemberCheap])).toEqual(new Set([novemberCheap.id]));
  });
});
