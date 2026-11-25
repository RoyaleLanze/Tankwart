import { FUEL_TYPES } from "./logic/vehicleSchema";
import { FUEL_TYPE_LABELS, UNKNOWN_ERROR_TEXT, vehicleErrorText } from "./messages";

describe("vehicleErrorText", () => {
  it("returns German text for a code", () => {
    expect(vehicleErrorText("tankCapacityMissing")).toBe("Gib das Tankvolumen ein.");
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
