import type { StationPriceInput } from "./cheapestStation";
import { DEFAULT_RADIUS_KM, RADIUS_OPTIONS_KM, sortStations } from "./sortStations";

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

const ids = (stations: StationPriceInput[]) => stations.map((s) => s.id);

describe("radius options", () => {
  it("offers 2, 5, 10 and 25 km with 5 km as default (M9)", () => {
    expect(RADIUS_OPTIONS_KM).toEqual([2, 5, 10, 25]);
    expect(DEFAULT_RADIUS_KM).toBe(5);
  });
});

describe("sortStations", () => {
  const stations = [
    station("farCheap", 4000, 1699),
    station("near", 300, 1799),
    station("middle", 1500, 1749),
  ];

  it("sorts by price, cheapest first", () => {
    expect(ids(sortStations(stations, "e5", "price"))).toEqual(["farCheap", "middle", "near"]);
  });

  it("sorts by distance, nearest first", () => {
    expect(ids(sortStations(stations, "e5", "distance"))).toEqual(["near", "middle", "farCheap"]);
  });

  it("puts stations without a price for the fuel last, nearest first", () => {
    const withGaps = [
      station("noPriceFar", 3000, null),
      station("noPriceNear", 100, null),
      ...stations,
    ];
    expect(ids(sortStations(withGaps, "e5", "price"))).toEqual([
      "farCheap",
      "middle",
      "near",
      "noPriceNear",
      "noPriceFar",
    ]);
    expect(ids(sortStations(withGaps, "e5", "distance")).slice(-2)).toEqual([
      "noPriceNear",
      "noPriceFar",
    ]);
  });

  it("uses the price of the selected fuel", () => {
    const mixed = [
      station("a", 100, 1700, { pricesTenthCents: { e5: 1700, e10: null, diesel: 1659 } }),
      station("b", 800, 1800, { pricesTenthCents: { e5: 1800, e10: null, diesel: 1609 } }),
    ];
    expect(ids(sortStations(mixed, "e5", "price"))).toEqual(["a", "b"]);
    expect(ids(sortStations(mixed, "diesel", "price"))).toEqual(["b", "a"]);
    expect(ids(sortStations(mixed, "e10", "price"))).toEqual(["a", "b"]);
  });

  it("breaks a price tie by distance and a distance tie by price", () => {
    const ties = [
      station("far", 900, 1749),
      station("near", 200, 1749),
      station("dear", 200, 1799),
    ];
    expect(ids(sortStations(ties, "e5", "price"))).toEqual(["near", "far", "dear"]);
    expect(ids(sortStations(ties, "e5", "distance"))).toEqual(["near", "dear", "far"]);
  });

  it("lets the id decide when price and distance are equal, independent of input order", () => {
    const same = [station("b", 500, 1749), station("a", 500, 1749)];
    expect(ids(sortStations(same, "e5", "price"))).toEqual(["a", "b"]);
    expect(ids(sortStations([...same].reverse(), "e5", "distance"))).toEqual(["a", "b"]);
  });

  it("keeps closed stations in their place", () => {
    const withClosed = [
      station("open", 300, 1799),
      station("closed", 2000, 1699, { isOpen: false }),
    ];
    expect(ids(sortStations(withClosed, "e5", "price"))).toEqual(["closed", "open"]);
  });

  it("returns an empty list for no stations", () => {
    expect(sortStations([], "e5", "price")).toEqual([]);
  });

  it("does not reorder the input array", () => {
    sortStations(stations, "e5", "price");
    expect(ids(stations)).toEqual(["farCheap", "near", "middle"]);
  });
});
