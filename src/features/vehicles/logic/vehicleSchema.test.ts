import { MAX_DB_INTEGER } from "@/lib/units";

import type { VehicleInput } from "../types";

import { vehicleSchema, vehicleToFormValues, type VehicleFormValues } from "./vehicleSchema";

type Changes = Partial<Record<keyof VehicleFormValues, unknown>>;

// The required fields with empty optional fields, as the onboarding form sends them.
const valid: VehicleFormValues = {
  name: "Golf VII TDI",
  fuelType: "diesel",
  initialOdometerKm: "84000",
  tankCapacityLiters: "50",
  makeModel: "",
  licensePlate: "",
  consumptionLitersPer100Km: "",
};

function parse(changes: Changes) {
  return vehicleSchema.safeParse({ ...valid, ...changes });
}

/** Error code per field, e.g. { name: "nameMissing" }; empty when valid. */
function errors(changes: Changes) {
  const result = parse(changes);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message]));
}

/** Table rows: one input per row, the expected error of that field or {} if valid. */
function expectErrors(field: keyof VehicleFormValues, rows: [unknown, string | null][]) {
  it.each(rows)(`${field} %j → %j`, (value, error) => {
    expect(errors({ [field]: value })).toEqual(error ? { [field]: error } : {});
  });
}

const tooManyDigits = "9".repeat(400);

describe("vehicleSchema", () => {
  it("turns the form text into a vehicle in database units", () => {
    const result = parse({
      name: "  Golf VII TDI ",
      makeModel: " VW Golf ",
      licensePlate: "WES-GT 740",
      tankCapacityLiters: "45,5",
      consumptionLitersPer100Km: "5.8",
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

  it.each([
    ["empty", { makeModel: "  ", licensePlate: "  ", consumptionLitersPer100Km: " " }],
    [
      "undefined",
      { makeModel: undefined, licensePlate: undefined, consumptionLitersPer100Km: undefined },
    ],
    ["null", { makeModel: null, licensePlate: null, consumptionLitersPer100Km: null }],
  ])("stores %s optional fields as null", (_, changes) => {
    expect(parse(changes).data).toMatchObject({
      makeModel: null,
      licensePlate: null,
      manufacturerConsumptionMlPer100Km: null,
    });
  });

  it.each(["ka-xy 99", "Ka-Xy 99"])("stores the plate %j in capitals", (licensePlate) => {
    expect(parse({ licensePlate }).data?.licensePlate).toBe("KA-XY 99");
  });

  it("drops keys that are not form fields, such as user_id", () => {
    expect(parse({ user_id: "other-user" } as Changes).data).not.toHaveProperty("user_id");
  });

  describe("name (required)", () => {
    expectErrors("name", [
      ["", "nameMissing"],
      ["   ", "nameMissing"],
      [undefined, "nameMissing"],
    ]);
  });

  describe("fuel type (required)", () => {
    expectErrors("fuelType", [
      ["e5", null],
      ["e10", null],
      [undefined, "fuelTypeMissing"],
      ["E5", "fuelTypeMissing"],
      ["super", "fuelTypeMissing"],
    ]);
  });

  describe("odometer (required, whole km)", () => {
    expectErrors("initialOdometerKm", [
      ["0", null],
      [String(MAX_DB_INTEGER), null],
      ["", "odometerMissing"],
      ["   ", "odometerMissing"],
      [undefined, "odometerMissing"],
      ["84.000", "odometerInvalid"],
      ["84,5", "odometerInvalid"],
      ["-1", "odometerInvalid"],
      [String(MAX_DB_INTEGER + 1), "valueTooLarge"],
      [tooManyDigits, "valueTooLarge"],
    ]);
  });

  describe("tank capacity (required, > 0 after rounding to ml)", () => {
    expectErrors("tankCapacityLiters", [
      ["0,0005", null],
      ["2147483,647", null],
      ["", "tankCapacityMissing"],
      ["   ", "tankCapacityMissing"],
      ["0", "tankCapacityInvalid"],
      ["0,0004", "tankCapacityInvalid"],
      ["abc", "tankCapacityInvalid"],
      ["2147483,648", "valueTooLarge"],
      ["9".repeat(308), "valueTooLarge"],
      [tooManyDigits, "valueTooLarge"],
    ]);

    it("rounds to whole ml", () => {
      expect(parse({ tankCapacityLiters: "45,0006" }).data?.tankCapacityMl).toBe(45_001);
    });
  });

  describe("manufacturer consumption (optional, > 0)", () => {
    expectErrors("consumptionLitersPer100Km", [
      ["0,0005", null],
      ["2147483,647", null],
      ["0", "consumptionInvalid"],
      ["0,0004", "consumptionInvalid"],
      ["-5", "consumptionInvalid"],
      ["5,8 L", "consumptionInvalid"],
      ["2147483,648", "valueTooLarge"],
      [tooManyDigits, "valueTooLarge"],
    ]);
  });

  it("reports every invalid field at once", () => {
    const empty = { name: "", fuelType: undefined, initialOdometerKm: "", tankCapacityLiters: "" };
    expect(Object.keys(errors(empty))).toEqual([
      "name",
      "fuelType",
      "initialOdometerKm",
      "tankCapacityLiters",
    ]);
  });
});

describe("vehicleToFormValues", () => {
  const stored: VehicleInput = {
    name: "Golf VII TDI",
    fuelType: "diesel",
    initialOdometerKm: 84_000,
    tankCapacityMl: 45_501,
    makeModel: "VW Golf",
    licensePlate: "WES-GT 740",
    manufacturerConsumptionMlPer100Km: 5_850,
  };

  it("writes amounts as liters with a comma, without rounding or unit", () => {
    expect(vehicleToFormValues(stored)).toMatchObject({
      initialOdometerKm: "84000",
      tankCapacityLiters: "45,501",
      consumptionLitersPer100Km: "5,85",
    });
  });

  it("shows unset optional fields as empty text", () => {
    const bare = { ...stored, makeModel: null, licensePlate: null };
    expect(vehicleToFormValues({ ...bare, manufacturerConsumptionMlPer100Km: null })).toMatchObject(
      { makeModel: "", licensePlate: "", consumptionLitersPer100Km: "" },
    );
  });

  // Saving the edit form unchanged must not change the vehicle (no factor 1000, no rounding).
  it.each([
    ["all fields", stored],
    [
      "whole liters",
      { ...stored, tankCapacityMl: 50_000, manufacturerConsumptionMlPer100Km: 6_000 },
    ],
    ["1 ml", { ...stored, tankCapacityMl: 1, manufacturerConsumptionMlPer100Km: 1 }],
    [
      "largest values",
      { ...stored, initialOdometerKm: MAX_DB_INTEGER, tankCapacityMl: MAX_DB_INTEGER },
    ],
    [
      "only required",
      { ...stored, makeModel: null, licensePlate: null, manufacturerConsumptionMlPer100Km: null },
    ],
  ])("round trip keeps the vehicle: %s", (_, vehicle) => {
    expect(vehicleSchema.parse(vehicleToFormValues(vehicle))).toEqual(vehicle);
  });

  // Amounts where ml / 1000 is not exact in binary floating point.
  it.each([1, 7, 999, 1001, 45_501, 1_999_999, MAX_DB_INTEGER - 1])(
    "round trip keeps %i ml in both amount fields",
    (ml) => {
      const vehicle = { ...stored, tankCapacityMl: ml, manufacturerConsumptionMlPer100Km: ml };
      expect(vehicleSchema.parse(vehicleToFormValues(vehicle))).toEqual(vehicle);
    },
  );

  it("normalises text another client stored with spaces (see vehicleToFormValues)", () => {
    const untrimmed = { ...stored, name: " Golf ", makeModel: "", licensePlate: "ka-tw 1 " };
    expect(vehicleSchema.parse(vehicleToFormValues(untrimmed))).toMatchObject({
      name: "Golf",
      makeModel: null,
      licensePlate: "KA-TW 1",
    });
  });
});
