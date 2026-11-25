import { mixColors } from "./color";

describe("mixColors", () => {
  it("returns the base at opacity 0 and the overlay at opacity 1", () => {
    expect(mixColors("#FFFFFF", "#4338CA", 0)).toBe("#FFFFFF");
    expect(mixColors("#FFFFFF", "#4338CA", 1)).toBe("#4338CA");
  });

  it("blends each channel and rounds to the nearest value", () => {
    expect(mixColors("#000000", "#FFFFFF", 0.5)).toBe("#808080");
    // Light theme level2: primary at 8 % over surface.
    expect(mixColors("#FFFFFF", "#4338CA", 0.08)).toBe("#F0EFFB");
  });

  it("accepts lowercase hex and always returns uppercase", () => {
    expect(mixColors("#1e293b", "#a5b4fc", 0)).toBe("#1E293B");
  });

  it.each([
    ["#FFF", "#4338CA", 0.5],
    ["#FFFFFF", "indigo", 0.5],
    ["#FFFFFF", "#4338CA", -0.1],
    ["#FFFFFF", "#4338CA", 1.1],
    ["#FFFFFF", "#4338CA", Number.NaN],
  ])("rejects %s over %s at %s", (base, overlay, opacity) => {
    expect(() => mixColors(base, overlay, opacity)).toThrow();
  });
});
