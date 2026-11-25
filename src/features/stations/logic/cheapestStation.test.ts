import { cheapestStation, savingsVolumeMl, type StationPriceInput } from "./cheapestStation";

const TANK_ML = 50_000;

function station(
  id: string,
  distanceMeters: number,
  e5: number | null,
  overrides: Partial<StationPriceInput> = {},
): StationPriceInput {
  return {
    id,
    isOpen: true,
    distanceMeters,
    pricesTenthCents: { e5, e10: null, diesel: null },
    ...overrides,
  };
}

describe("savingsVolumeMl", () => {
  it("takes 80 % of the tank", () => {
    expect(savingsVolumeMl(50_000)).toBe(40_000);
    expect(savingsVolumeMl(45_000)).toBe(36_000);
  });

  it("rounds to whole ml", () => {
    // 80 % of 12 345 ml = 9876 ml exactly, of 12 346 ml = 9876.8 ml → 9877 ml
    expect(savingsVolumeMl(12_345)).toBe(9876);
    expect(savingsVolumeMl(12_346)).toBe(9877);
  });
});

describe("cheapestStation", () => {
  it("returns the cheapest station and the savings against the nearest", () => {
    const stations = [station("near", 300, 1799), station("cheap", 2500, 1749)];
    // 40 L × 5 ct/L = 2.00 €
    expect(cheapestStation(stations, "e5", TANK_ML)).toEqual({
      cheapestId: "cheap",
      nearestId: "near",
      volumeMl: 40_000,
      savingsCents: 200,
    });
  });

  it("saves nothing when the nearest station is the cheapest", () => {
    const stations = [station("near", 300, 1749), station("far", 2500, 1799)];
    expect(cheapestStation(stations, "e5", TANK_ML)).toMatchObject({
      cheapestId: "near",
      nearestId: "near",
      savingsCents: 0,
    });
  });

  it("works with a single station", () => {
    expect(cheapestStation([station("only", 900, 1749)], "e5", TANK_ML)).toMatchObject({
      cheapestId: "only",
      nearestId: "only",
      savingsCents: 0,
    });
  });

  it("returns null for an empty list", () => {
    expect(cheapestStation([], "e5", TANK_ML)).toBeNull();
  });

  it("ignores closed stations, also as reference", () => {
    const stations = [
      station("closedCheap", 100, 1599, { isOpen: false }),
      station("near", 400, 1799),
      station("cheap", 2000, 1749),
    ];
    expect(cheapestStation(stations, "e5", TANK_ML)).toMatchObject({
      cheapestId: "cheap",
      nearestId: "near",
      savingsCents: 200,
    });
  });

  it("returns null if all stations are closed", () => {
    const stations = [station("a", 100, 1749, { isOpen: false })];
    expect(cheapestStation(stations, "e5", TANK_ML)).toBeNull();
  });

  it("ignores stations without a price for the selected fuel", () => {
    const stations = [
      station("noE5", 100, null),
      station("near", 400, 1799),
      station("cheap", 900, 1759),
    ];
    expect(cheapestStation(stations, "e5", TANK_ML)).toMatchObject({
      cheapestId: "cheap",
      nearestId: "near",
      savingsCents: 160,
    });
  });

  it("uses the price of the selected fuel", () => {
    const stations = [
      station("a", 100, 1700, { pricesTenthCents: { e5: 1700, e10: null, diesel: 1659 } }),
      station("b", 800, 1800, { pricesTenthCents: { e5: 1800, e10: null, diesel: 1609 } }),
    ];
    expect(cheapestStation(stations, "e5", TANK_ML)?.cheapestId).toBe("a");
    expect(cheapestStation(stations, "diesel", TANK_ML)).toMatchObject({
      cheapestId: "b",
      nearestId: "a",
      savingsCents: 200,
    });
  });

  it("returns null if no station sells the fuel", () => {
    expect(cheapestStation([station("a", 100, 1749)], "diesel", TANK_ML)).toBeNull();
  });

  it("prefers the nearer station when two are equally cheap", () => {
    const stations = [
      station("farCheap", 3000, 1749),
      station("nearCheap", 1200, 1749),
      station("nearest", 200, 1799),
    ];
    expect(cheapestStation(stations, "e5", TANK_ML)?.cheapestId).toBe("nearCheap");
  });

  it("takes the cheaper one as reference when two are equally near", () => {
    const stations = [
      station("dear", 500, 1899),
      station("fair", 500, 1799),
      station("cheap", 2000, 1749),
    ];
    expect(cheapestStation(stations, "e5", TANK_ML)).toMatchObject({
      nearestId: "fair",
      savingsCents: 200,
    });
  });

  it("does not depend on the order of the input", () => {
    const stations = [station("b", 500, 1749), station("a", 500, 1749), station("c", 100, 1799)];
    const reversed = [...stations].reverse();
    expect(cheapestStation(stations, "e5", TANK_ML)).toEqual(
      cheapestStation(reversed, "e5", TANK_ML),
    );
    expect(cheapestStation(stations, "e5", TANK_ML)?.cheapestId).toBe("a");
  });

  it("does not reorder the input array", () => {
    const stations = [station("far", 2000, 1749), station("near", 100, 1799)];
    cheapestStation(stations, "e5", TANK_ML);
    expect(stations.map((s) => s.id)).toEqual(["far", "near"]);
  });

  it("rounds the savings to whole cents", () => {
    // 80 % of 45 L = 36 L; 36 L × 0.3 ct/L = 10.8 ct → 11 ct
    const stations = [station("near", 100, 1752), station("cheap", 900, 1749)];
    expect(cheapestStation(stations, "e5", 45_000)?.savingsCents).toBe(11);
    // 80 % of 52.5 L = 42 L; 42 L × 0.1 ct/L = 4.2 ct → 4 ct
    const tenth = [station("near", 100, 1750), station("cheap", 900, 1749)];
    expect(cheapestStation(tenth, "e5", 52_500)?.savingsCents).toBe(4);
  });
});
