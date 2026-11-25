import { homeOverview } from "./overview";
import { refueling } from "./statsFixture";

const INITIAL_KM = 9_000;
const TODAY = "2026-11-25";

describe("homeOverview", () => {
  it("returns empty months and no consumption without refuelings", () => {
    const overview = homeOverview([], INITIAL_KM, TODAY);
    expect(overview.current).toMatchObject({ month: "2026-11", refuelingCount: 0, totalCents: 0 });
    expect(overview.current.avgPricePerLiterTenthCents).toBeNull();
    expect(overview.previous.month).toBe("2026-10");
    expect(overview.costDifferenceCents).toBe(0);
    expect(overview.averageConsumptionMlPer100Km).toBeNull();
  });

  it("compares the current month with the previous one", () => {
    const history = [
      refueling({ refueledOn: "2026-10-10", odometerKm: 10_000, totalCents: 6_000 }),
      refueling({ refueledOn: "2026-11-10", odometerKm: 10_600, totalCents: 7_500 }),
      refueling({ refueledOn: "2026-11-24", odometerKm: 11_100, totalCents: 4_000 }),
    ];
    const overview = homeOverview(history, INITIAL_KM, TODAY);
    expect(overview.current).toMatchObject({ refuelingCount: 2, totalCents: 11_500 });
    // km since the October refueling count for November.
    expect(overview.current.distanceKm).toBe(1_100);
    expect(overview.previous.totalCents).toBe(6_000);
    expect(overview.costDifferenceCents).toBe(5_500);
  });

  it("reports a negative difference when spending went down", () => {
    const history = [
      refueling({ refueledOn: "2026-10-10", totalCents: 9_000 }),
      refueling({ refueledOn: "2026-11-10", odometerKm: 10_500, totalCents: 2_500 }),
    ];
    expect(homeOverview(history, INITIAL_KM, TODAY).costDifferenceCents).toBe(-6_500);
  });

  it("compares January with December of the year before", () => {
    const history = [
      refueling({ refueledOn: "2025-12-31", odometerKm: 10_000, totalCents: 5_000 }),
      refueling({ refueledOn: "2026-01-01", odometerKm: 10_400, totalCents: 6_000 }),
    ];
    const overview = homeOverview(history, INITIAL_KM, "2026-01-15");
    expect(overview.previous).toMatchObject({ month: "2025-12", totalCents: 5_000 });
    expect(overview.current.distanceKm).toBe(400);
  });

  it("counts the km of the very first refueling from the initial odometer", () => {
    const overview = homeOverview([refueling({ odometerKm: 9_350 })], INITIAL_KM, TODAY);
    expect(overview.current.distanceKm).toBe(350);
  });

  it("ignores refuelings after the current month", () => {
    const history = [refueling({ refueledOn: "2026-12-01" })];
    expect(homeOverview(history, INITIAL_KM, TODAY).current.refuelingCount).toBe(0);
  });
});

describe("homeOverview 12-month consumption", () => {
  it("covers the current month and the 11 before it", () => {
    const history = [
      refueling({ refueledOn: "2025-02-01", odometerKm: 10_000 }),
      refueling({ refueledOn: "2026-02-01", odometerKm: 10_500, volumeMl: 30_000 }),
    ];
    expect(homeOverview(history, INITIAL_KM, "2027-01-31").averageConsumptionMlPer100Km).toBe(
      6_000,
    );
    expect(homeOverview(history, INITIAL_KM, "2027-02-01").averageConsumptionMlPer100Km).toBeNull();
  });

  it("counts an interval that starts before the window completely", () => {
    const history = [
      refueling({ refueledOn: "2025-11-30", odometerKm: 10_000 }),
      refueling({ refueledOn: "2025-12-01", odometerKm: 10_500, volumeMl: 35_000 }),
    ];
    // The window for 2026-11 starts at 2025-12; 35 L / 500 km = 7.0 L/100 km.
    expect(homeOverview(history, INITIAL_KM, TODAY).averageConsumptionMlPer100Km).toBe(7_000);
  });

  it("weights intervals by km and leaves out one with a missed refueling", () => {
    const history = [
      refueling({ refueledOn: "2026-01-05", odometerKm: 10_000 }),
      refueling({ refueledOn: "2026-02-05", odometerKm: 10_100, volumeMl: 10_000 }),
      refueling({ refueledOn: "2026-06-05", odometerKm: 11_000, volumeMl: 45_000 }),
      refueling({ refueledOn: "2026-09-05", odometerKm: 12_000, previousMissed: true }),
    ];
    // 55 L / 1,000 km = 5.5 L/100 km; the plain mean of 10.0 and 5.0 would be 7.5.
    expect(homeOverview(history, INITIAL_KM, TODAY).averageConsumptionMlPer100Km).toBe(5_500);
  });
});
