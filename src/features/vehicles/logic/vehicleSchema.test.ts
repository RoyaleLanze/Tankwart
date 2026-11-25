import { MAX_DB_INTEGER } from "@/lib/units";

import { vehicleSchema, type VehicleFormValues } from "./vehicleSchema";

// Only the required fields, as in the onboarding form.
const valid: VehicleFormValues = {
  name: "Golf VII TDI",
  fuelType: "diesel",
  initialOdometerKm: "84000",
  tankCapacityMl: "50",
  makeModel: "",
  licensePlate: "",
  manufacturerConsumptionMlPer100Km: "",
};

function parse(changes: Partial<Record<keyof VehicleFormValues, unknown>>) {
  return vehicleSchema.safeParse({ ...valid, ...changes });
}

/** Error code per field, e.g. { name: "nameMissing" }; empty when valid. */
function errors(changes: Partial<Record<keyof VehicleFormValues, unknown>>) {
  const result = parse(changes);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message]));
}

describe("vehicleSchema", () => {
  it("turns the form text into database units", () => {
    const result = parse({
      name: "  Golf VII TDI ",
      makeModel: " VW Golf ",
      licensePlate: "WES-GT 740",
      tankCapacityMl: "45,5",
      manufacturerConsumptionMlPer100Km: "5.8",
    });
    expect(result.data).toEqual({
      name: "Golf VII TDI",
      fuelType: "diesel",
      initialOdometerKm: 84_000,
      tankCapacityMl: 45_500,
      makeModel: "VW Golf",
      licensePlate: "WES-GT 740",
      manufacturerConsumptionMlPer100Km: 5_800,
    });
  });

  it("stores empty optional fields as null", () => {
    expect(parse({ makeModel: "  " }).data).toMatchObject({
      makeModel: null,
      licensePlate: null,
      manufacturerConsumptionMlPer100Km: null,
    });
  });

  it.each(["", "   "])("requires a name, %j is missing", (name) => {
    expect(errors({ name })).toEqual({ name: "nameMissing" });
  });

  it.each([undefined, "", "super"])("requires a known fuel type, %j is missing", (fuelType) => {
    expect(errors({ fuelType })).toEqual({ fuelType: "fuelTypeMissing" });
  });

  describe("odometer", () => {
    it.each([
      ["0", {}],
      ["", { initialOdometerKm: "odometerMissing" }],
      ["84.000", { initialOdometerKm: "odometerInvalid" }],
      ["84,5", { initialOdometerKm: "odometerInvalid" }],
      ["-1", { initialOdometerKm: "odometerInvalid" }],
      [String(MAX_DB_INTEGER), {}],
      [String(MAX_DB_INTEGER + 1), { initialOdometerKm: "valueTooLarge" }],
    ])("%j → %j", (initialOdometerKm, expected) => {
      expect(errors({ initialOdometerKm })).toEqual(expected);
    });
  });

  describe("tank capacity (required, > 0)", () => {
    it.each([
      ["0,001", {}],
      ["", { tankCapacityMl: "tankCapacityMissing" }],
      ["0", { tankCapacityMl: "tankCapacityInvalid" }],
      ["0,0004", { tankCapacityMl: "tankCapacityInvalid" }],
      ["abc", { tankCapacityMl: "tankCapacityInvalid" }],
      ["9".repeat(400), { tankCapacityMl: "tankCapacityInvalid" }],
      ["2147483,647", {}],
      ["2147483,648", { tankCapacityMl: "valueTooLarge" }],
    ])("%j → %j", (tankCapacityMl, expected) => {
      expect(errors({ tankCapacityMl })).toEqual(expected);
    });

    it("rounds to whole ml", () => {
      expect(parse({ tankCapacityMl: "45,0006" }).data?.tankCapacityMl).toBe(45_001);
    });
  });

  describe("manufacturer consumption (optional, > 0)", () => {
    it.each([
      ["  ", {}],
      ["0", { manufacturerConsumptionMlPer100Km: "consumptionInvalid" }],
      ["5,8 L", { manufacturerConsumptionMlPer100Km: "consumptionInvalid" }],
    ])("%j → %j", (manufacturerConsumptionMlPer100Km, expected) => {
      expect(errors({ manufacturerConsumptionMlPer100Km })).toEqual(expected);
    });
  });

  it("reports every invalid field at once", () => {
    expect(
      Object.keys(
        errors({ name: "", fuelType: undefined, initialOdometerKm: "", tankCapacityMl: "" }),
      ),
    ).toEqual(["name", "fuelType", "initialOdometerKm", "tankCapacityMl"]);
  });
});
