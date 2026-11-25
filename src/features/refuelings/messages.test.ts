import { refuelingErrorText, refuelingWarningText, UNKNOWN_ERROR_TEXT } from "./messages";

// Units are joined with a non-breaking space; written as a normal space here for readability.
const readable = (text: string) => text.replace(/ /g, " ");

describe("refuelingErrorText", () => {
  it("names the price limits, formatted from the constants", () => {
    expect(readable(refuelingErrorText("priceOutOfRange"))).toBe(
      "Literpreis muss zwischen 0,50 € und 4,00 € liegen.",
    );
  });

  it("returns German text for a code", () => {
    expect(refuelingErrorText("odometerBelowInitial")).toBe(
      "Kilometerstand liegt unter dem Anfangsstand des Fahrzeugs.",
    );
  });

  it.each(["Invalid input: expected number", "toString", ""])(
    "never shows an unknown message like %j to the user",
    (message) => {
      expect(refuelingErrorText(message)).toBe(UNKNOWN_ERROR_TEXT);
    },
  );
});

describe("refuelingWarningText", () => {
  it("names the distance limit, formatted from the constant", () => {
    expect(readable(refuelingWarningText("distanceUnusuallyLarge"))).toBe(
      "Mehr als 2.000 km seit der letzten Betankung. Fehlt eine Betankung?",
    );
  });
});
