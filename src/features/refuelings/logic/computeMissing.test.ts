import { computeMissing } from "./computeMissing";

describe("computeMissing", () => {
  it("computes the total from volume and price", () => {
    // 40 L × 1.749 €/L = 69.96 €
    expect(computeMissing({ volumeMl: 40_000, pricePerLiterTenthCents: 1749 })).toEqual({
      field: "totalCents",
      value: 6996,
    });
  });

  it("computes the volume from total and price", () => {
    expect(computeMissing({ totalCents: 6996, pricePerLiterTenthCents: 1749 })).toEqual({
      field: "volumeMl",
      value: 40_000,
    });
  });

  it("computes the price from total and volume", () => {
    expect(computeMissing({ totalCents: 6996, volumeMl: 40_000 })).toEqual({
      field: "pricePerLiterTenthCents",
      value: 1749,
    });
  });

  it("rounds half up to whole units", () => {
    // 52.4 L × 1.759 €/L = 92.1716 € → 92.17 €
    expect(computeMissing({ volumeMl: 52_400, pricePerLiterTenthCents: 1759 })?.value).toBe(9217);
    // 1 L × 1.745 €/L = 174.5 ct → 175 ct
    expect(computeMissing({ volumeMl: 1000, pricePerLiterTenthCents: 1745 })?.value).toBe(175);
    // 50 € at 1.749 €/L = 28.5877 L → 28588 ml
    expect(computeMissing({ totalCents: 5000, pricePerLiterTenthCents: 1749 })?.value).toBe(28_588);
  });

  it.each([
    ["price rounded from 175 ct per 1 L", { totalCents: 175, volumeMl: 1000 }, 1750],
    ["price rounded down from 69.97 € per 40 L", { totalCents: 6997, volumeMl: 40_000 }, 1749],
    // 1 ct at 4.00 €/L = 2.5 ml, rounded half up
    ["tiny volume from 1 ct at 4.00 €/L", { totalCents: 1, pricePerLiterTenthCents: 4000 }, 3],
  ])("rounds the %s", (_, amounts, expected) => {
    expect(computeMissing(amounts)?.value).toBe(expected);
  });

  it("computes nothing when all three are given, even if they do not match", () => {
    expect(
      computeMissing({ volumeMl: 40_000, pricePerLiterTenthCents: 1749, totalCents: 7000 }),
    ).toBeNull();
  });

  it.each([
    ["nothing", {}],
    ["only volume", { volumeMl: 40_000 }],
    ["only price", { pricePerLiterTenthCents: 1749 }],
    ["only total", { totalCents: 6996 }],
  ])("returns null with %s", (_, amounts) => {
    expect(computeMissing(amounts)).toBeNull();
  });

  it.each([
    ["zero volume", { volumeMl: 0, pricePerLiterTenthCents: 1749 }],
    ["negative price", { volumeMl: 40_000, pricePerLiterTenthCents: -1 }],
    ["zero price as divisor", { totalCents: 6996, pricePerLiterTenthCents: 0 }],
    ["NaN total", { totalCents: Number.NaN, volumeMl: 40_000 }],
    ["fractional volume", { volumeMl: 40_000.5, pricePerLiterTenthCents: 1749 }],
  ])("returns null with %s instead of computing from it", (_, amounts) => {
    expect(computeMissing(amounts)).toBeNull();
  });

  it("never overwrites a typed zero", () => {
    expect(
      computeMissing({ volumeMl: 40_000, pricePerLiterTenthCents: 1749, totalCents: 0 }),
    ).toBeNull();
  });
});
