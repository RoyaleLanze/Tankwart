// Fixed sample stations for development, seeds and E2E tests (ADR 0005). No API key needed.
// List positions are relative to the request, so distances are the same anywhere in Germany
// (positions outside Germany are rejected before the mock, see GERMANY_BOUNDS).
const KM_PER_DEGREE_LATITUDE = 111;
// A detail request has no position; detail coordinates are placed north of Stuttgart centre.
const MOCK_DETAIL_ORIGIN = { lat: 48.7758, lng: 9.1829 };

const MOCK_STATIONS = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Mock Tankstelle Nord",
    brand: "ARAL",
    street: "Hauptstraße",
    houseNumber: "1",
    postCode: 70173,
    place: "Stuttgart",
    dist: 0.8,
    e5: 1.789,
    e10: 1.729,
    diesel: 1.659,
    isOpen: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Mock Tankstelle Süd",
    brand: "JET",
    street: "Bahnhofstraße",
    houseNumber: "12",
    postCode: 70173,
    place: "Stuttgart",
    dist: 1.9,
    e5: 1.749,
    e10: 1.689,
    diesel: 1.619,
    isOpen: true,
  },
  // Cheapest but closed, so the app must not highlight it (M10).
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "Mock Autohof",
    brand: "ESSO",
    street: "Industriestraße",
    houseNumber: "40",
    postCode: 70174,
    place: "Stuttgart",
    dist: 4.2,
    e5: 1.699,
    e10: 1.639,
    diesel: 1.569,
    isOpen: false,
  },
];

const MOCK_OPENING_TIMES = [
  { text: "Mo-Fr", start: "06:00:00", end: "22:00:00" },
  { text: "Sa, So", start: "08:00:00", end: "20:00:00" },
];

export function mockList(lat: number, lng: number, radiusKm: number) {
  const stations = MOCK_STATIONS.filter((s) => s.dist <= radiusKm).map((s) => ({
    ...s,
    lat: lat + s.dist / KM_PER_DEGREE_LATITUDE,
    lng,
  }));
  return { stations };
}

export function mockDetail(stationId: string) {
  const station = MOCK_STATIONS.find((s) => s.id === stationId);
  if (!station) return null;
  const { dist: _dist, ...rest } = station;
  return {
    station: {
      ...rest,
      lat: MOCK_DETAIL_ORIGIN.lat + station.dist / KM_PER_DEGREE_LATITUDE,
      lng: MOCK_DETAIL_ORIGIN.lng,
      openingTimes: MOCK_OPENING_TIMES,
      overrideOpeningTimes: [],
      wholeDay: false,
    },
  };
}
