import { parseStationList } from "./pricesResponse";

const FETCHED_AT = "2026-11-26T09:52:00.000Z";

/** One station as the prices function returns it (Tankerkönig list.php fields). */
function apiStation(overrides: Record<string, unknown> = {}) {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Mock Tankstelle Nord",
    brand: "ARAL",
    street: "Hauptstraße",
    houseNumber: "1",
    postCode: 70173,
    place: "Stuttgart",
    lat: 48.78,
    lng: 9.18,
    dist: 0.8,
    e5: 1.789,
    e10: 1.729,
    diesel: 1.659,
    isOpen: true,
    ...overrides,
  };
}

const parseOne = (overrides: Record<string, unknown>) =>
  parseStationList({ stations: [apiStation(overrides)], fetchedAt: FETCHED_AT }).stations[0];

describe("parseStationList", () => {
  it("maps a station to the app's units", () => {
    expect(parseStationList({ stations: [apiStation()], fetchedAt: FETCHED_AT })).toEqual({
      stations: [
        {
          id: "00000000-0000-4000-8000-000000000001",
          name: "Mock Tankstelle Nord",
          brand: "ARAL",
          street: "Hauptstraße",
          houseNumber: "1",
          place: "Stuttgart",
          isOpen: true,
          distanceMeters: 800,
          pricesTenthCents: { e5: 1789, e10: 1729, diesel: 1659 },
        },
      ],
      fetchedAt: new Date(FETCHED_AT),
    });
  });

  it("rounds euros and kilometers without float errors", () => {
    // 1.005 * 1000 = 1004.9999… and 4.2 * 1000 = 4200.000…1 in floating point
    const station = parseOne({ e5: 1.005, dist: 4.2 });
    expect(station.pricesTenthCents.e5).toBe(1005);
    expect(station.distanceMeters).toBe(4200);
  });

  it("treats a price that rounds to 0 tenth cents as not sold", () => {
    expect(parseOne({ e5: 0.0004 }).pricesTenthCents.e5).toBeNull();
    expect(parseOne({ e5: 0.0005 }).pricesTenthCents.e5).toBe(1);
  });

  it.each([[false], [null], [0], [-1.5], ["1.749"], [undefined]])(
    "treats the price %j as not sold",
    (e10) => {
      expect(parseOne({ e10 }).pricesTenthCents.e10).toBeNull();
    },
  );

  it.each([[""], ["  "], [null], [undefined]])("treats the text %j as missing", (text) => {
    const station = parseOne({ brand: text, houseNumber: text });
    expect(station.brand).toBeNull();
    expect(station.houseNumber).toBeNull();
  });

  it("keeps a station without street, house number, place and brand", () => {
    const station = parseOne({ street: null, houseNumber: null, place: "", brand: undefined });
    expect(station).toMatchObject({ street: null, houseNumber: null, place: null, brand: null });
  });

  it("accepts a distance of 0 and skips a negative one", () => {
    const body = {
      stations: [apiStation({ id: "a", dist: 0 }), apiStation({ id: "b", dist: -0.1 })],
      fetchedAt: FETCHED_AT,
    };
    const { stations } = parseStationList(body);
    expect(stations.map((station) => station.id)).toEqual(["a"]);
    expect(stations[0].distanceMeters).toBe(0);
  });

  it("skips only the invalid station and keeps the rest", () => {
    const body = {
      stations: [
        apiStation({ id: "a" }),
        apiStation({ id: undefined }),
        "junk",
        apiStation({ id: "b" }),
      ],
      fetchedAt: FETCHED_AT,
    };
    expect(parseStationList(body).stations.map((station) => station.id)).toEqual(["a", "b"]);
  });

  it("reads the fetch time in the format toISOString() sends", () => {
    const iso = new Date(Date.UTC(2026, 10, 26, 9, 52, 0, 123)).toISOString();
    expect(parseStationList({ stations: [], fetchedAt: iso }).fetchedAt).toEqual(new Date(iso));
  });

  it("returns an empty list when no station is in the radius", () => {
    expect(parseStationList({ stations: [], fetchedAt: FETCHED_AT }).stations).toEqual([]);
  });

  it.each([
    ["no object", null],
    ["no stations", { fetchedAt: FETCHED_AT }],
    ["no fetch time", { stations: [] }],
    ["an invalid fetch time", { stations: [], fetchedAt: "gestern" }],
    ["stations of the wrong type", { stations: "none", fetchedAt: FETCHED_AT }],
  ])("rejects an answer with %s", (_case, body) => {
    expect(() => parseStationList(body)).toThrow();
  });
});
