import { refueling } from "../__fixtures__/statsFixture";
import { elapsedMonths, metricValue, summarizeMetric, yearStats } from "./yearStats";

const INITIAL_KM = 9_000;
// April 2026 is the current month: January to April have elapsed.
const TODAY = "2026-04-20";
const NEXT_YEAR = "2027-01-01";

describe("yearStats", () => {
  it("returns twelve empty months for no refuelings", () => {
    const stats = yearStats([], INITIAL_KM, 2026);
    expect(stats.months).toHaveLength(12);
    expect(stats.months[0]).toMatchObject({ month: "2026-01", refuelingCount: 0 });
    expect(stats.months[0].avgPricePerLiterTenthCents).toBeNull();
    expect(stats.total).toMatchObject({ refuelingCount: 0, totalCents: 0, distanceKm: 0 });
  });

  it("puts each refueling into the month of its date", () => {
    const stats = yearStats(
      [
        refueling({ refueledOn: "2026-03-31", odometerKm: 10_000, totalCents: 5_000 }),
        refueling({ refueledOn: "2026-04-01", odometerKm: 10_500, totalCents: 6_000 }),
      ],
      INITIAL_KM,
      2026,
    );
    expect(stats.months[2]).toMatchObject({ refuelingCount: 1, totalCents: 5_000 });
    expect(stats.months[3]).toMatchObject({ refuelingCount: 1, totalCents: 6_000 });
  });

  it("uses other years only as predecessor for km and consumption", () => {
    const stats = yearStats(
      [
        refueling({ refueledOn: "2025-12-28", odometerKm: 10_000 }),
        refueling({ refueledOn: "2026-01-05", odometerKm: 10_400, volumeMl: 24_000 }),
        refueling({ refueledOn: "2027-01-02", odometerKm: 11_000 }),
      ],
      INITIAL_KM,
      2026,
    );
    expect(stats.total.refuelingCount).toBe(1);
    expect(stats.months[0]).toMatchObject({ distanceKm: 400, consumptionMlPer100Km: 6_000 });
    expect(stats.months[11].refuelingCount).toBe(0);
  });

  it("counts the km of the very first refueling from the initial odometer", () => {
    const stats = yearStats([refueling({ refueledOn: "2026-05-01" })], INITIAL_KM, 2026);
    expect(stats.months[4]).toMatchObject({ distanceKm: 1_000, consumptionMlPer100Km: null });
  });

  it("adds up the whole year in total", () => {
    const stats = yearStats(
      [
        refueling({ refueledOn: "2026-01-01", odometerKm: 10_000, totalCents: 7_000 }),
        refueling({ refueledOn: "2026-02-01", odometerKm: 10_100, volumeMl: 10_000 }),
        refueling({ refueledOn: "2026-06-01", odometerKm: 11_000, volumeMl: 45_000 }),
      ],
      INITIAL_KM,
      2026,
    );
    expect(stats.total).toMatchObject({
      refuelingCount: 3,
      volumeMl: 95_000,
      distanceKm: 2_000,
      totalCents: 21_000,
      avgPricePerLiterTenthCents: 1_750,
      // 55 L / 1,000 km, not the mean of 10 and 5 L/100 km.
      consumptionMlPer100Km: 5_500,
    });
  });
});

describe("summarizeMetric", () => {
  const stats = yearStats(
    [
      refueling({ refueledOn: "2026-01-05", odometerKm: 9_200, totalCents: 6_000 }),
      refueling({ refueledOn: "2026-02-05", odometerKm: 9_800, totalCents: 8_000 }),
      refueling({
        refueledOn: "2026-04-05",
        odometerKm: 10_200,
        totalCents: 5_000,
        pricePerLiterTenthCents: 1_650,
      }),
    ],
    INITIAL_KM,
    2026,
  );

  it("averages additive metrics over the elapsed months of the current year", () => {
    // Empty March counts, May–December have not begun yet: 19,000 / 4.
    expect(summarizeMetric(stats, "totalCents", TODAY)).toEqual({
      sum: 19_000,
      average: 4_750,
      highestMonth: "2026-02",
      lowestMonth: "2026-04",
    });
  });

  it("never marks an empty month as the lowest", () => {
    expect(metricValue(stats.months[2], "distanceKm")).toBeNull();
    expect(summarizeMetric(stats, "distanceKm", TODAY)).toEqual({
      sum: 1_200,
      average: 300,
      highestMonth: "2026-02",
      lowestMonth: "2026-01",
    });
  });

  it("uses the year value for rates and has no sum", () => {
    expect(summarizeMetric(stats, "avgPricePerLiterTenthCents", TODAY)).toEqual({
      sum: null,
      average: stats.total.avgPricePerLiterTenthCents,
      highestMonth: "2026-01",
      lowestMonth: "2026-04",
    });
  });

  it("counts empty months of a past year in the average", () => {
    // Refueling every second month, 1,000 km each time: 6,000 km over 12 months.
    const everySecondMonth = yearStats(
      [1, 3, 5, 7, 9, 11].map((month, index) =>
        refueling({
          refueledOn: `2025-${String(month).padStart(2, "0")}-15`,
          odometerKm: 10_000 + index * 1_000,
        }),
      ),
      INITIAL_KM,
      2025,
    );
    expect(summarizeMetric(everySecondMonth, "distanceKm", TODAY)).toMatchObject({
      sum: 6_000,
      average: 500,
    });
  });

  it("has no average for a year that has not begun", () => {
    const future = yearStats([refueling({ refueledOn: "2027-02-01" })], INITIAL_KM, 2027);
    expect(summarizeMetric(future, "totalCents", TODAY)).toMatchObject({
      sum: 7_000,
      average: null,
    });
  });

  it("has no average and no marks for a year without refuelings", () => {
    const empty = yearStats([], INITIAL_KM, 2026);
    expect(summarizeMetric(empty, "totalCents", NEXT_YEAR)).toEqual({
      sum: 0,
      average: null,
      highestMonth: null,
      lowestMonth: null,
    });
    expect(summarizeMetric(empty, "consumptionMlPer100Km", NEXT_YEAR).average).toBeNull();
  });

  it("marks no month when all valued months are equal", () => {
    const tie = yearStats(
      [
        refueling({ refueledOn: "2026-03-01", totalCents: 5_000 }),
        refueling({ refueledOn: "2026-07-01", odometerKm: 10_500, totalCents: 5_000 }),
      ],
      INITIAL_KM,
      2026,
    );
    expect(summarizeMetric(tie, "totalCents", NEXT_YEAR)).toMatchObject({
      highestMonth: null,
      lowestMonth: null,
    });
  });

  it("marks no month when only one month has a value", () => {
    const single = yearStats(
      [
        refueling({ refueledOn: "2026-03-01" }),
        refueling({ refueledOn: "2026-07-01", odometerKm: 10_500 }),
      ],
      INITIAL_KM,
      2026,
    );
    // Only July closes a consumption interval.
    expect(summarizeMetric(single, "consumptionMlPer100Km", NEXT_YEAR)).toMatchObject({
      highestMonth: null,
      lowestMonth: null,
    });
  });

  it("prefers the earlier month on a partial tie", () => {
    const partial = yearStats(
      [4_000, 8_000, 8_000, 4_000].map((totalCents, index) =>
        refueling({
          refueledOn: `2026-0${index + 1}-01`,
          odometerKm: 10_000 + index * 500,
          totalCents,
        }),
      ),
      INITIAL_KM,
      2026,
    );
    expect(summarizeMetric(partial, "totalCents", NEXT_YEAR)).toMatchObject({
      highestMonth: "2026-02",
      lowestMonth: "2026-01",
    });
  });
});

describe("elapsedMonths", () => {
  it.each([
    [2025, 12],
    [2026, 4],
    [2027, 0],
  ])("year %i has %i elapsed months in April 2026", (year, expected) => {
    expect(elapsedMonths(year, TODAY)).toBe(expected);
  });

  it("counts the current month from its first day", () => {
    expect(elapsedMonths(2026, "2026-01-01")).toBe(1);
    expect(elapsedMonths(2026, "2026-12-31")).toBe(12);
  });

  it("rejects a today that is not an ISO date", () => {
    expect(() => elapsedMonths(2026, "20.04.2026")).toThrow();
  });
});
