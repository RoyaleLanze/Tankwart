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

describe("sortChronologically", () => {
  it("orders by date, then by odometer on the same day (ADR 0012)", () => {
    const a = refueling({ refueledOn: "2026-11-02", odometerKm: 10_500 });
    const b = refueling({ refueledOn: "2026-11-01", odometerKm: 10_000 });
    const c = refueling({ refueledOn: "2026-11-02", odometerKm: 10_200 });
    expect(sortChronologically([a, b, c]).map((r) => r.id)).toEqual([b.id, c.id, a.id]);
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
