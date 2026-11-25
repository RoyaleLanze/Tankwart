import { refueling } from "./statsFixture";
import { metricValue, summarizeMetric, yearStats } from "./yearStats";

const INITIAL_KM = 9_000;

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

  it("sums additive metrics and averages over months with refuelings", () => {
    // March and May–December are empty and do not pull the average down.
    expect(summarizeMetric(stats, "totalCents")).toEqual({
      sum: 19_000,
      average: 6_333,
      highestMonth: "2026-02",
      lowestMonth: "2026-04",
    });
  });

  it("never marks an empty month as the lowest", () => {
    expect(metricValue(stats.months[2], "distanceKm")).toBeNull();
    expect(summarizeMetric(stats, "distanceKm")).toEqual({
      sum: 1_200,
      average: 400,
      highestMonth: "2026-02",
      lowestMonth: "2026-01",
    });
  });

  it("uses the year value for rates and has no sum", () => {
    expect(summarizeMetric(stats, "avgPricePerLiterTenthCents")).toEqual({
      sum: null,
      average: stats.total.avgPricePerLiterTenthCents,
      highestMonth: "2026-01",
      lowestMonth: "2026-04",
    });
  });

  it("has no average and no marks for a year without refuelings", () => {
    const empty = yearStats([], INITIAL_KM, 2026);
    expect(summarizeMetric(empty, "totalCents")).toEqual({
      sum: 0,
      average: null,
      highestMonth: null,
      lowestMonth: null,
    });
    expect(summarizeMetric(empty, "consumptionMlPer100Km").average).toBeNull();
  });

  it("prefers the earlier month on a tie and marks a single month twice", () => {
    const tie = yearStats(
      [
        refueling({ refueledOn: "2026-03-01", totalCents: 5_000 }),
        refueling({ refueledOn: "2026-07-01", odometerKm: 10_500, totalCents: 5_000 }),
      ],
      INITIAL_KM,
      2026,
    );
    expect(summarizeMetric(tie, "totalCents")).toMatchObject({
      highestMonth: "2026-03",
      lowestMonth: "2026-03",
    });
    expect(summarizeMetric(tie, "consumptionMlPer100Km")).toMatchObject({
      highestMonth: "2026-07",
      lowestMonth: "2026-07",
    });
  });
});
