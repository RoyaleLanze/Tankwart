import {
  addMonths,
  averagePricePerLiter,
  entriesBetween,
  monthOf,
  monthStats,
  monthsOfYear,
  periodStats,
  statsEntries,
} from "./period";
import { refueling } from "./statsFixture";

const INITIAL_KM = 9_000;

describe("monthOf", () => {
  it("keeps the first and last day in their month", () => {
    // new Date("2026-03-01") would be February west of UTC.
    expect(monthOf("2026-03-01")).toBe("2026-03");
    expect(monthOf("2026-12-31")).toBe("2026-12");
  });

  it.each(["", "2026-11", "25.11.2026", "2026-11-25T23:30:00Z"])("rejects %p", (value) => {
    expect(() => monthOf(value)).toThrow("Expected YYYY-MM-DD");
  });
});

describe("addMonths", () => {
  it.each([
    ["2026-11", -1, "2026-10"],
    ["2026-01", -1, "2025-12"],
    ["2026-12", 1, "2027-01"],
    ["2026-11", -11, "2025-12"],
    ["2026-03", -15, "2024-12"],
    ["2026-05", 0, "2026-05"],
  ])("%s %+d → %s", (month, offset, expected) => {
    expect(addMonths(month, offset)).toBe(expected);
  });

  it.each(["2026-1", "2026-11-01", "November"])("rejects %p", (value) => {
    expect(() => addMonths(value, 1)).toThrow("Expected YYYY-MM");
  });
});

describe("monthsOfYear", () => {
  it("lists January to December", () => {
    const months = monthsOfYear(2026);
    expect(months).toHaveLength(12);
    expect([months[0], months[8], months[11]]).toEqual(["2026-01", "2026-09", "2026-12"]);
  });
});

describe("statsEntries", () => {
  it("counts the first refueling's km from the initial odometer", () => {
    const [first] = statsEntries([refueling({ odometerKm: 9_400 })], INITIAL_KM);
    expect(first.distanceKm).toBe(400);
  });

  it("counts km since the previous refueling, in date order then odometer", () => {
    const entries = statsEntries(
      [
        refueling({ refueledOn: "2026-11-30", odometerKm: 10_700 }),
        refueling({ refueledOn: "2026-10-01", odometerKm: 10_000 }),
        refueling({ refueledOn: "2026-11-30", odometerKm: 10_650 }),
      ],
      INITIAL_KM,
    );
    expect(entries.map((entry) => [entry.month, entry.distanceKm])).toEqual([
      ["2026-10", 1_000],
      ["2026-11", 650],
      ["2026-11", 50],
    ]);
  });
});

describe("entriesBetween", () => {
  it("includes both boundary months, across the turn of the year", () => {
    const entries = statsEntries(
      ["2025-11-30", "2025-12-01", "2026-01-31", "2026-02-01"].map((refueledOn, index) =>
        refueling({ refueledOn, odometerKm: 10_000 + index * 500 }),
      ),
      INITIAL_KM,
    );
    const months = entriesBetween(entries, "2025-12", "2026-01").map((entry) => entry.month);
    expect(months).toEqual(["2025-12", "2026-01"]);
  });
});

describe("periodStats", () => {
  it("has zero sums and null rates without refuelings", () => {
    expect(periodStats([])).toEqual({
      refuelingCount: 0,
      totalCents: 0,
      volumeMl: 0,
      distanceKm: 0,
      avgPricePerLiterTenthCents: null,
      consumptionMlPer100Km: null,
    });
  });

  it("sums a period including partial refuelings", () => {
    const entries = statsEntries(
      [
        refueling({ odometerKm: 10_000, volumeMl: 30_000, totalCents: 5_220 }),
        refueling({ odometerKm: 10_500, volumeMl: 20_500, totalCents: 3_567, isFullTank: false }),
      ],
      INITIAL_KM,
    );
    expect(periodStats(entries)).toMatchObject({
      refuelingCount: 2,
      totalCents: 8_787,
      volumeMl: 50_500,
      distanceKm: 1_500,
    });
  });

  it("counts an interval that starts before the period completely", () => {
    const entries = statsEntries(
      [
        refueling({ refueledOn: "2026-09-25", odometerKm: 10_000 }),
        refueling({
          refueledOn: "2026-09-30",
          odometerKm: 10_200,
          isFullTank: false,
          volumeMl: 10_000,
        }),
        refueling({ refueledOn: "2026-10-05", odometerKm: 10_500, volumeMl: 20_000 }),
      ],
      INITIAL_KM,
    );
    expect(monthStats(entries, "2026-09").consumptionMlPer100Km).toBeNull();
    // (10 L + 20 L) / 500 km = 6 L/100 km, although 10 L were bought in September.
    expect(monthStats(entries, "2026-10").consumptionMlPer100Km).toBe(6_000);
  });

  it("has no consumption for an interval with a missed refueling, but its km", () => {
    const entries = statsEntries(
      [refueling({ odometerKm: 10_000 }), refueling({ odometerKm: 10_600, previousMissed: true })],
      INITIAL_KM,
    );
    expect(periodStats(entries)).toMatchObject({ distanceKm: 1_600, consumptionMlPer100Km: null });
  });
});

describe("averagePricePerLiter", () => {
  it("is null without liters", () => {
    expect(averagePricePerLiter([])).toBeNull();
  });

  it("weights prices by liters", () => {
    const small = refueling({ volumeMl: 5_000, pricePerLiterTenthCents: 2_000 });
    const large = refueling({ volumeMl: 45_000, pricePerLiterTenthCents: 1_600 });
    // (2,000 × 5 + 1,600 × 45) / 50 = 1,640; the plain mean would be 1,800.
    expect(averagePricePerLiter([small, large])).toBe(1_640);
  });

  it("rounds to tenths of a cent", () => {
    const first = refueling({ volumeMl: 10_000, pricePerLiterTenthCents: 1_749 });
    const second = refueling({ volumeMl: 20_000, pricePerLiterTenthCents: 1_750 });
    // (1,749 + 2 × 1,750) / 3 = 1,749.67
    expect(averagePricePerLiter([first, second])).toBe(1_750);
  });
});
