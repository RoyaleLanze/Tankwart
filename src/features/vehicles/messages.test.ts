import { FUEL_TYPES, vehicleSchema } from "./logic/vehicleSchema";
import {
  FUEL_TYPE_LABELS,
  UNKNOWN_ERROR_TEXT,
  deleteVehicleTitle,
  vehicleCountText,
  vehicleErrorText,
} from "./messages";

describe("vehicleErrorText", () => {
  it("returns German text for a code", () => {
    expect(vehicleErrorText("tankCapacityMissing")).toBe("Gib das Tankvolumen ein.");
  });

  // The schema must only ever report our codes, never zod's raw messages.
  it.each([
    [{}],
    [{ name: null, fuelType: null, initialOdometerKm: null, tankCapacityLiters: null }],
    [{ initialOdometerKm: "x", tankCapacityLiters: "0", consumptionLitersPer100Km: "x" }],
    [{ initialOdometerKm: "9".repeat(400), tankCapacityLiters: "9".repeat(308) }],
  ])("has a text for every issue of %j", (input) => {
    const issues = vehicleSchema.safeParse(input).error?.issues ?? [];
    expect(issues.length).toBeGreaterThan(0);
    for (const issue of issues) {
      expect(vehicleErrorText(issue.message)).not.toBe(UNKNOWN_ERROR_TEXT);
    }
  });

  it.each(["Invalid input: expected number", "toString", ""])(
    "never shows an unknown message like %j to the user",
    (message) => {
      expect(vehicleErrorText(message)).toBe(UNKNOWN_ERROR_TEXT);
    },
  );
});

describe("FUEL_TYPE_LABELS", () => {
  it("names the fuel types in the order of the form", () => {
    expect(FUEL_TYPES.map((fuelType) => FUEL_TYPE_LABELS[fuelType])).toEqual([
      "Super E5",
      "Super E10",
      "Diesel",
    ]);
  });
});

describe("vehicleCountText", () => {
  it.each([
    [1, "1 Fahrzeug"],
    [2, "2 Fahrzeuge"],
    [0, "0 Fahrzeuge"],
  ])("%i → %s", (count, text) => {
    expect(vehicleCountText(count)).toBe(text);
  });
});

describe("deleteVehicleTitle", () => {
  it("quotes the name in a question", () => {
    expect(deleteVehicleTitle("Golf")).toBe("„Golf“ löschen?");
  });
});
