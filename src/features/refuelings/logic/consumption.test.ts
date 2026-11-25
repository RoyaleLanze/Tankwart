import {
  averageConsumption,
  consumptionByRefueling,
  type ConsumptionInput,
  sortChronologically,
} from "./consumption";

let nextId = 0;
/** Full refueling by default; override what a test is about. */
function refueling(overrides: Partial<ConsumptionInput>): ConsumptionInput {
  nextId += 1;
  return {
    id: `r${nextId}`,
    refueledOn: "2026-11-01",
    odometerKm: 0,
    volumeMl: 40_000,
    isFullTank: true,
    previousMissed: false,
    ...overrides,
  };
}

describe("consumptionByRefueling", () => {
  it("returns nothing for no refuelings", () => {
    expect(consumptionByRefueling([]).size).toBe(0);
  });

  it("uses the first full refueling only as starting point", () => {
    const first = refueling({ odometerKm: 10_000 });
    expect(consumptionByRefueling([first]).get(first.id)).toEqual({ kind: "start" });
  });

  it("computes liters per 100 km between two full refuelings", () => {
    const start = refueling({ refueledOn: "2026-11-01", odometerKm: 10_000 });
    const end = refueling({ refueledOn: "2026-11-15", odometerKm: 10_625, volumeMl: 40_000 });
    // 40 L / 625 km = 6.4 L/100 km
    expect(consumptionByRefueling([start, end]).get(end.id)).toEqual({
      kind: "interval",
      mlPer100Km: 6400,
      volumeMl: 40_000,
      distanceKm: 625,
    });
  });

  it("adds partial refuelings to the next full one", () => {
    const start = refueling({ refueledOn: "2026-11-01", odometerKm: 10_000 });
    const partial = refueling({
      refueledOn: "2026-11-08",
      odometerKm: 10_300,
      volumeMl: 20_000,
      isFullTank: false,
    });
    const end = refueling({ refueledOn: "2026-11-15", odometerKm: 10_800, volumeMl: 30_000 });
    const results = consumptionByRefueling([start, partial, end]);
    expect(results.get(partial.id)).toEqual({ kind: "partial" });
    // (20 L + 30 L) / 800 km = 6.25 L/100 km
    expect(results.get(end.id)).toMatchObject({ mlPer100Km: 6250, volumeMl: 50_000 });
  });

  it("ignores the liters of the starting refueling itself", () => {
    const start = refueling({ odometerKm: 10_000, volumeMl: 99_000 });
    const end = refueling({ refueledOn: "2026-11-15", odometerKm: 11_000, volumeMl: 60_000 });
    expect(consumptionByRefueling([start, end]).get(end.id)).toMatchObject({ mlPer100Km: 6000 });
  });

  it("treats partial refuelings before the first full one as partial without effect", () => {
    const partial = refueling({ odometerKm: 9_000, isFullTank: false, volumeMl: 10_000 });
    const start = refueling({ refueledOn: "2026-11-02", odometerKm: 10_000 });
    const end = refueling({ refueledOn: "2026-11-15", odometerKm: 11_000, volumeMl: 50_000 });
    const results = consumptionByRefueling([partial, start, end]);
    expect(results.get(partial.id)).toEqual({ kind: "partial" });
    expect(results.get(start.id)).toEqual({ kind: "start" });
    expect(results.get(end.id)).toMatchObject({ mlPer100Km: 5000 });
  });

  describe("missed refuelings", () => {
    it("does not count an interval whose closing refueling had a gap before it", () => {
      const start = refueling({ odometerKm: 10_000 });
      const end = refueling({ refueledOn: "2026-11-15", odometerKm: 11_000, previousMissed: true });
      expect(consumptionByRefueling([start, end]).get(end.id)).toEqual({ kind: "notCounted" });
    });

    it("does not count an interval with a gap before a partial refueling in it", () => {
      const start = refueling({ odometerKm: 10_000 });
      const partial = refueling({
        refueledOn: "2026-11-08",
        odometerKm: 10_400,
        isFullTank: false,
        previousMissed: true,
      });
      const end = refueling({ refueledOn: "2026-11-15", odometerKm: 11_000 });
      expect(consumptionByRefueling([start, partial, end]).get(end.id)).toEqual({
        kind: "notCounted",
      });
    });

    it("counts the next interval again after a gap", () => {
      const start = refueling({ odometerKm: 10_000 });
      const afterGap = refueling({
        refueledOn: "2026-11-15",
        odometerKm: 11_000,
        previousMissed: true,
      });
      const next = refueling({ refueledOn: "2026-11-30", odometerKm: 11_500, volumeMl: 30_000 });
      const results = consumptionByRefueling([start, afterGap, next]);
      expect(results.get(afterGap.id)).toEqual({ kind: "notCounted" });
      expect(results.get(next.id)).toMatchObject({ kind: "interval", mlPer100Km: 6000 });
    });

    it("ignores a gap before the very first full refueling", () => {
      const first = refueling({ odometerKm: 10_000, previousMissed: true });
      const end = refueling({ refueledOn: "2026-11-15", odometerKm: 11_000 });
      const results = consumptionByRefueling([first, end]);
      expect(results.get(first.id)).toEqual({ kind: "start" });
      expect(results.get(end.id)).toMatchObject({ kind: "interval" });
    });
  });

  it("does not count an interval without distance", () => {
    const start = refueling({ odometerKm: 10_000 });
    const sameKm = refueling({ refueledOn: "2026-11-02", odometerKm: 10_000 });
    expect(consumptionByRefueling([start, sameKm]).get(sameKm.id)).toEqual({ kind: "notCounted" });
  });

  it("rounds to whole ml per 100 km", () => {
    const start = refueling({ odometerKm: 10_000 });
    // 40 L / 600 km = 6666.67 ml per 100 km
    const end = refueling({ refueledOn: "2026-11-15", odometerKm: 10_600, volumeMl: 40_000 });
    expect(consumptionByRefueling([start, end]).get(end.id)).toMatchObject({ mlPer100Km: 6667 });
  });

  it("sorts the input itself, so the order of the database rows does not matter", () => {
    const start = refueling({ refueledOn: "2026-11-01", odometerKm: 10_000 });
    const end = refueling({ refueledOn: "2026-11-15", odometerKm: 10_500, volumeMl: 30_000 });
    expect(consumptionByRefueling([end, start]).get(end.id)).toMatchObject({ mlPer100Km: 6000 });
  });
});

describe("consumptionByRefueling edge cases", () => {
  it("adds several consecutive partial refuelings to the next full one", () => {
    const start = refueling({ odometerKm: 10_000 });
    const partials = [10_200, 10_400, 10_600].map((odometerKm, i) =>
      refueling({
        refueledOn: `2026-11-0${i + 2}`,
        odometerKm,
        volumeMl: 10_000,
        isFullTank: false,
      }),
    );
    const end = refueling({ refueledOn: "2026-11-10", odometerKm: 11_000, volumeMl: 20_000 });
    const results = consumptionByRefueling([start, ...partials, end]);
    for (const partial of partials) expect(results.get(partial.id)).toEqual({ kind: "partial" });
    // (3 × 10 L + 20 L) / 1000 km = 5 L/100 km
    expect(results.get(end.id)).toEqual({
      kind: "interval",
      mlPer100Km: 5000,
      volumeMl: 50_000,
      distanceKm: 1_000,
    });
  });

  it("leaves a partial refueling after the last full one open without a value", () => {
    const start = refueling({ odometerKm: 10_000 });
    const end = refueling({ refueledOn: "2026-11-15", odometerKm: 10_500, volumeMl: 30_000 });
    const openPartial = refueling({
      refueledOn: "2026-11-20",
      odometerKm: 10_700,
      volumeMl: 99_000,
      isFullTank: false,
      previousMissed: true,
    });
    const results = consumptionByRefueling([start, end, openPartial]);
    expect(results.get(openPartial.id)).toEqual({ kind: "partial" });
    expect(results.get(end.id)).toMatchObject({ kind: "interval", mlPer100Km: 6000 });
    expect(averageConsumption(results.values())).toBe(6000);
  });

  it("does not count an interval with several gaps in it", () => {
    const start = refueling({ odometerKm: 10_000 });
    const partialA = refueling({
      refueledOn: "2026-11-05",
      odometerKm: 10_300,
      isFullTank: false,
      previousMissed: true,
    });
    const partialB = refueling({
      refueledOn: "2026-11-10",
      odometerKm: 10_600,
      isFullTank: false,
      previousMissed: true,
    });
    const end = refueling({ refueledOn: "2026-11-15", odometerKm: 11_000 });
    expect(consumptionByRefueling([start, partialA, partialB, end]).get(end.id)).toEqual({
      kind: "notCounted",
    });
  });

  it("handles gaps in consecutive intervals independently", () => {
    const start = refueling({ refueledOn: "2026-11-01", odometerKm: 10_000 });
    const gapA = refueling({ refueledOn: "2026-11-08", odometerKm: 10_500, previousMissed: true });
    const gapB = refueling({ refueledOn: "2026-11-15", odometerKm: 11_000, previousMissed: true });
    const counted = refueling({ refueledOn: "2026-11-22", odometerKm: 11_400, volumeMl: 24_000 });
    const results = consumptionByRefueling([start, gapA, gapB, counted]);
    expect(results.get(gapA.id)).toEqual({ kind: "notCounted" });
    expect(results.get(gapB.id)).toEqual({ kind: "notCounted" });
    expect(results.get(counted.id)).toMatchObject({ kind: "interval", distanceKm: 400 });
  });

  it("orders two full refuelings on the same day by odometer", () => {
    const start = refueling({ refueledOn: "2026-11-01", odometerKm: 10_000 });
    const morning = refueling({ refueledOn: "2026-11-15", odometerKm: 10_500, volumeMl: 30_000 });
    const evening = refueling({ refueledOn: "2026-11-15", odometerKm: 10_600, volumeMl: 5_000 });
    const results = consumptionByRefueling([evening, morning, start]);
    expect(results.get(morning.id)).toMatchObject({ mlPer100Km: 6000, distanceKm: 500 });
    expect(results.get(evening.id)).toMatchObject({ mlPer100Km: 5000, distanceKm: 100 });
  });

  it.each([
    ["a month boundary", "2026-10-28", "2026-11-03"],
    ["a year boundary", "2026-12-28", "2027-01-03"],
  ])("computes an interval across %s", (_label, startDate, endDate) => {
    const start = refueling({ refueledOn: startDate, odometerKm: 10_000 });
    const end = refueling({ refueledOn: endDate, odometerKm: 10_400, volumeMl: 24_000 });
    expect(consumptionByRefueling([end, start]).get(end.id)).toMatchObject({
      kind: "interval",
      mlPer100Km: 6000,
    });
  });

  it.each([
    ["no refuelings", []],
    ["only partial refuelings", [false, false]],
    ["a single full refueling", [true]],
    ["one full refueling between partial ones", [false, true, false]],
  ])("has no average with %s", (_label, fullTankFlags: boolean[]) => {
    const refuelings = fullTankFlags.map((isFullTank, i) =>
      refueling({ refueledOn: `2026-11-0${i + 1}`, odometerKm: 10_000 + i * 500, isFullTank }),
    );
    expect(averageConsumption(consumptionByRefueling(refuelings).values())).toBeNull();
  });

  it("averages a mixed 12-month history like the hand calculation", () => {
    const history = [
      refueling({ refueledOn: "2026-01-05", odometerKm: 10_000 }),
      refueling({ refueledOn: "2026-02-03", odometerKm: 10_600, volumeMl: 36_000 }),
      refueling({
        refueledOn: "2026-03-02",
        odometerKm: 11_000,
        volumeMl: 15_000,
        isFullTank: false,
      }),
      refueling({ refueledOn: "2026-04-01", odometerKm: 11_500, volumeMl: 45_000 }),
      refueling({
        refueledOn: "2026-05-04",
        odometerKm: 12_100,
        volumeMl: 30_000,
        previousMissed: true,
      }),
      refueling({ refueledOn: "2026-06-02", odometerKm: 12_900, volumeMl: 48_000 }),
      refueling({
        refueledOn: "2026-07-01",
        odometerKm: 13_200,
        volumeMl: 20_000,
        isFullTank: false,
      }),
      refueling({
        refueledOn: "2026-08-03",
        odometerKm: 13_500,
        volumeMl: 20_000,
        isFullTank: false,
      }),
      refueling({ refueledOn: "2026-09-01", odometerKm: 14_000, volumeMl: 22_000 }),
      refueling({
        refueledOn: "2026-10-05",
        odometerKm: 14_700,
        volumeMl: 25_000,
        isFullTank: false,
        previousMissed: true,
      }),
      refueling({ refueledOn: "2026-11-02", odometerKm: 15_000, volumeMl: 30_000 }),
      refueling({
        refueledOn: "2026-12-01",
        odometerKm: 15_400,
        volumeMl: 20_000,
        isFullTank: false,
      }),
    ];
    const results = consumptionByRefueling([...history].reverse());
    expect(history.map((r) => results.get(r.id)?.kind)).toEqual([
      "start",
      "interval",
      "partial",
      "interval",
      "notCounted",
      "interval",
      "partial",
      "partial",
      "interval",
      "partial",
      "notCounted",
      "partial",
    ]);
    // Counted: 36 L/600 km, (15 + 45) L/900 km, 48 L/800 km, (20 + 20 + 22) L/1100 km
    // → 206 L / 3400 km = 6.0588 L/100 km
    expect(averageConsumption(results.values())).toBe(6059);
  });
});

describe("sortChronologically", () => {
  it("orders by date, then by odometer on the same day (ADR 0012)", () => {
    const a = refueling({ refueledOn: "2026-11-02", odometerKm: 10_500 });
    const b = refueling({ refueledOn: "2026-11-01", odometerKm: 10_000 });
    const c = refueling({ refueledOn: "2026-11-02", odometerKm: 10_200 });
    expect(sortChronologically([a, b, c]).map((r) => r.id)).toEqual([b.id, c.id, a.id]);
  });

  it("breaks a tie of date and odometer by id, so the result does not depend on row order", () => {
    const x = refueling({ id: "b", refueledOn: "2026-11-02", odometerKm: 10_500 });
    const y = refueling({ id: "a", refueledOn: "2026-11-02", odometerKm: 10_500 });
    expect(sortChronologically([x, y]).map((r) => r.id)).toEqual(["a", "b"]);
    expect(sortChronologically([y, x]).map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("does not change the input array", () => {
    const input = [
      refueling({ refueledOn: "2026-11-02" }),
      refueling({ refueledOn: "2026-11-01" }),
    ];
    const before = [...input];
    sortChronologically(input);
    expect(input).toEqual(before);
  });
});

describe("averageConsumption", () => {
  it("is null with fewer than two full refuelings (hint instead of a value)", () => {
    expect(averageConsumption([])).toBeNull();
    expect(averageConsumption([{ kind: "start" }, { kind: "partial" }])).toBeNull();
  });

  it("is null if every interval is not counted", () => {
    expect(averageConsumption([{ kind: "start" }, { kind: "notCounted" }])).toBeNull();
  });

  it("weights by distance: total liters / total km", () => {
    // 10 L / 100 km (10 L/100 km) and 60 L / 1000 km (6 L/100 km) → 70 L / 1100 km = 6.36
    expect(
      averageConsumption([
        { kind: "interval", mlPer100Km: 10_000, volumeMl: 10_000, distanceKm: 100 },
        { kind: "interval", mlPer100Km: 6_000, volumeMl: 60_000, distanceKm: 1_000 },
        { kind: "notCounted" },
      ]),
    ).toBe(6364);
  });

  it("accepts the results map directly", () => {
    const start = refueling({ odometerKm: 10_000 });
    const end = refueling({ refueledOn: "2026-11-15", odometerKm: 10_625 });
    expect(averageConsumption(consumptionByRefueling([start, end]).values())).toBe(6400);
  });
});
