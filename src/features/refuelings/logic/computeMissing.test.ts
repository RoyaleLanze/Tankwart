import { computeMissing } from "./computeMissing";

describe("computeMissing", () => {
  it("computes the total from volume and price", () => {
    // 40 L × 1.749 €/L = 69.96 €
    expect(computeMissing({ volumeMl: 40_000, pricePerLiterTenthCents: 1749 })).toEqual({
      volumeMl: 40_000,
      pricePerLiterTenthCents: 1749,
      totalCents: 6996,
    });
  });

  it("computes the volume from total and price", () => {
    expect(computeMissing({ totalCents: 6996, pricePerLiterTenthCents: 1749 })).toEqual({
      volumeMl: 40_000,
      pricePerLiterTenthCents: 1749,
      totalCents: 6996,
    });
  });

  it("computes the price from total and volume", () => {
    expect(computeMissing({ totalCents: 6996, volumeMl: 40_000 })).toEqual({
      volumeMl: 40_000,
      pricePerLiterTenthCents: 1749,
      totalCents: 6996,
    });
  });

  it("rounds half up to whole units", () => {
    // 52.4 L × 1.759 €/L = 92.1716 € → 92.17 €
    expect(computeMissing({ volumeMl: 52_400, pricePerLiterTenthCents: 1759 })?.totalCents).toBe(
      9217,
    );
    // 0.5 ct rounds up: 1 L × 1.745 €/L = 174.5 ct → 175 ct
    expect(computeMissing({ volumeMl: 1000, pricePerLiterTenthCents: 1745 })?.totalCents).toBe(175);
    // 50 € at 1.749 €/L = 28.5877 L → 28588 ml
    expect(computeMissing({ totalCents: 5000, pricePerLiterTenthCents: 1749 })?.volumeMl).toBe(
      28_588,
    );
  });

  it("keeps all three values unchanged even if they do not match exactly", () => {
    const amounts = { volumeMl: 40_000, pricePerLiterTenthCents: 1749, totalCents: 7000 };
    expect(computeMissing(amounts)).toEqual(amounts);
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
  ])("treats %s as missing and returns null", (_, amounts) => {
    expect(computeMissing(amounts)).toBeNull();
  });
});
