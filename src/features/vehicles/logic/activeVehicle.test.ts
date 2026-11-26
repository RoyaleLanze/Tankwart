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
    expect(pickActiveVehicle([], null)).toBeUndefined();
  });

  it("returns the only vehicle without a choice", () => {
    expect(pickActiveVehicle([older], null)).toBe(older);
  });

  it("compares different offsets by the instant, not by the text", () => {
    // 12:00+02:00 is 10:00 UTC, earlier than 11:00Z although "12" > "11" as text.
    const early = vehicle("c", "2026-11-20T12:00:00+02:00");
    const late = vehicle("d", "2026-11-20T11:00:00Z");
    expect(pickActiveVehicle([late, early], null)).toBe(late);
  });

  it("treats Z and +00:00 of the same instant as a tie", () => {
    const withZ = vehicle("c", "2026-11-20T10:00:00Z");
    const withOffset = vehicle("d", "2026-11-20T10:00:00+00:00");
    expect(pickActiveVehicle([withZ, withOffset], null)).toBe(withOffset);
    expect(pickActiveVehicle([withOffset, withZ], null)).toBe(withZ);
  });

  it("compares timestamps with and without fractions", () => {
    // As text ".5Z" > ".123456Z" is right by luck, but "Z" > ".5Z" would be wrong.
    const whole = vehicle("c", "2026-11-20T10:00:00Z");
    const half = vehicle("d", "2026-11-20T10:00:00.5Z");
    const micro = vehicle("e", "2026-11-20T10:00:00.123456Z");
    expect(pickActiveVehicle([half, micro], null)).toBe(half);
    expect(pickActiveVehicle([whole, micro], null)).toBe(micro);
    expect(pickActiveVehicle([micro, half, whole], null)).toBe(half);
  });
});
