import type { Vehicle } from "../types";

import { pickActiveVehicle } from "./activeVehicle";

function vehicle(id: string, createdAt: string): Vehicle {
  return {
    id,
    name: `Auto ${id}`,
    fuelType: "e10",
    initialOdometerKm: 0,
    tankCapacityMl: 50000,
    makeModel: null,
    licensePlate: null,
    manufacturerConsumptionMlPer100Km: null,
    createdAt,
  };
}

const older = vehicle("a", "2026-11-01T10:00:00+00:00");
const newer = vehicle("b", "2026-11-20T10:00:00+00:00");

describe("pickActiveVehicle", () => {
  it("returns the stored choice", () => {
    expect(pickActiveVehicle([older, newer], "a")).toBe(older);
  });

  it("falls back to the most recently added vehicle without a choice", () => {
    expect(pickActiveVehicle([older, newer], null)).toBe(newer);
  });

  it("falls back when the chosen vehicle no longer exists", () => {
    expect(pickActiveVehicle([older, newer], "deleted")).toBe(newer);
  });

  it("does not rely on the order of the list", () => {
    expect(pickActiveVehicle([newer, older], null)).toBe(newer);
  });

  it("takes the later one in the list on the same creation time", () => {
    const twin = vehicle("c", newer.createdAt);
    expect(pickActiveVehicle([newer, twin], null)).toBe(twin);
  });

  it("returns undefined without vehicles", () => {
    expect(pickActiveVehicle([], "a")).toBeUndefined();
  });
});
