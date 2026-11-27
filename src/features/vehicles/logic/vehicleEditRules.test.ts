import { vehicleEditErrors } from "./vehicleEditRules";

const vehicle = { initialOdometerKm: 84000, tankCapacityMl: 50000 };
const refueling = (odometerKm: number, volumeMl: number) => ({ odometerKm, volumeMl });

describe("vehicleEditErrors", () => {
  it("accepts any edit without refuelings", () => {
    expect(vehicleEditErrors({ initialOdometerKm: 999999, tankCapacityMl: 1 }, [])).toEqual({});
  });

  it("accepts values that fit all refuelings", () => {
    expect(vehicleEditErrors(vehicle, [refueling(84500, 40000)])).toEqual({});
  });

  describe("initial odometer", () => {
    it("accepts an odometer equal to the lowest refueling", () => {
      expect(vehicleEditErrors(vehicle, [refueling(84000, 40000)])).toEqual({});
    });

    it("rejects an odometer 1 km above the lowest refueling", () => {
      expect(vehicleEditErrors(vehicle, [refueling(83999, 40000)])).toEqual({
        initialOdometerKm: "initialOdometerAboveRefueling",
      });
    });

    it("compares with the lowest of several refuelings, in any order", () => {
      const refuelings = [
        refueling(90000, 40000),
        refueling(83000, 40000),
        refueling(85000, 40000),
      ];
      expect(vehicleEditErrors(vehicle, refuelings).initialOdometerKm).toBe(
        "initialOdometerAboveRefueling",
      );
    });
  });

  describe("tank capacity", () => {
    it("accepts a refueling of exactly 110 %", () => {
      expect(vehicleEditErrors(vehicle, [refueling(84500, 55000)])).toEqual({});
    });

    it("rejects a refueling 1 ml above 110 %", () => {
      expect(vehicleEditErrors(vehicle, [refueling(84500, 55001)])).toEqual({
        tankCapacityLiters: "tankCapacityBelowRefueling",
      });
    });

    it("rounds the limit down for a tank that is not a round number", () => {
      // 50001 ml * 110 % = 55001.1 ml, so 55001 ml is the last accepted volume
      const tank = { initialOdometerKm: 84000, tankCapacityMl: 50001 };
      expect(vehicleEditErrors(tank, [refueling(84500, 55001)])).toEqual({});
      expect(vehicleEditErrors(tank, [refueling(84500, 55002)])).toEqual({
        tankCapacityLiters: "tankCapacityBelowRefueling",
      });
    });

    it("checks the largest of several refuelings", () => {
      const refuelings = [
        refueling(84500, 30000),
        refueling(85000, 56000),
        refueling(85500, 20000),
      ];
      expect(vehicleEditErrors(vehicle, refuelings).tankCapacityLiters).toBe(
        "tankCapacityBelowRefueling",
      );
    });
  });

  it("reports both fields at once", () => {
    expect(vehicleEditErrors(vehicle, [refueling(80000, 60000)])).toEqual({
      initialOdometerKm: "initialOdometerAboveRefueling",
      tankCapacityLiters: "tankCapacityBelowRefueling",
    });
  });
});
