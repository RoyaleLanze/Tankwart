import { createRefuelingSchema, getRefuelingWarnings, type RefuelingInput } from "./schema";
import {
  DISTANCE_WARNING_KM,
  MAX_PRICE_PER_LITER_TENTH_CENTS,
  MIN_PRICE_PER_LITER_TENTH_CENTS,
  type RefuelingContext,
} from "./rules";

const context: RefuelingContext = {
  today: "2026-11-25",
  tankCapacityMl: 50_000,
  initialOdometerKm: 80_000,
  previousOdometerKm: 84_000,
  nextOdometerKm: 85_000,
};

const valid: RefuelingInput = {
  refueledOn: "2026-11-20",
  volumeMl: 40_000,
  pricePerLiterTenthCents: 1749,
  totalCents: 6996,
  odometerKm: 84_500,
};

/** Field paths with an error, e.g. ["volumeMl"]; empty when valid. */
function errorFields(input: Partial<RefuelingInput>, ctx: RefuelingContext = context): string[] {
  const result = createRefuelingSchema(ctx).safeParse({ ...valid, ...input });
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
}

describe("createRefuelingSchema", () => {
  it("accepts a valid refueling", () => {
    expect(errorFields({})).toEqual([]);
  });

  describe("volume (> 0 and ≤ tank capacity × 1.1)", () => {
    it.each([
      [1, true],
      [0, false],
      [-1000, false],
      [55_000, true],
      [55_001, false],
    ])("%i ml valid: %s", (volumeMl, ok) => {
      expect(errorFields({ volumeMl })).toEqual(ok ? [] : ["volumeMl"]);
    });

    it("uses exact integer math for the tolerance", () => {
      // 33 L tank: 36.3 L allowed, 33000 × 1.1 in floating point is 36300.000000000004
      const smallTank = { ...context, tankCapacityMl: 33_000 };
      expect(errorFields({ volumeMl: 36_300 }, smallTank)).toEqual([]);
      expect(errorFields({ volumeMl: 36_301 }, smallTank)).toEqual(["volumeMl"]);
    });

    it("rejects fractional ml", () => {
      expect(errorFields({ volumeMl: 40_000.5 })).toEqual(["volumeMl"]);
    });
  });

  describe("price per liter (0.50–4.00 €)", () => {
    it.each([
      [MIN_PRICE_PER_LITER_TENTH_CENTS - 1, false],
      [MIN_PRICE_PER_LITER_TENTH_CENTS, true],
      [MAX_PRICE_PER_LITER_TENTH_CENTS, true],
      [MAX_PRICE_PER_LITER_TENTH_CENTS + 1, false],
    ])("%i tenth cents valid: %s", (pricePerLiterTenthCents, ok) => {
      expect(errorFields({ pricePerLiterTenthCents })).toEqual(ok ? [] : ["pricePerLiterTenthCents"]);
    });
  });

  describe("total", () => {
    it.each([
      [1, true],
      [0, false],
    ])("%i cents valid: %s", (totalCents, ok) => {
      expect(errorFields({ totalCents })).toEqual(ok ? [] : ["totalCents"]);
    });
  });

  describe("odometer (> previous, < next, ≥ initial)", () => {
    it.each([
      [84_000, false],
      [84_001, true],
      [84_999, true],
      [85_000, false],
    ])("%i km between neighbours valid: %s", (odometerKm, ok) => {
      expect(errorFields({ odometerKm })).toEqual(ok ? [] : ["odometerKm"]);
    });

    it("allows the initial odometer for the first refueling", () => {
      const first = { ...context, previousOdometerKm: null, nextOdometerKm: null };
      expect(errorFields({ odometerKm: 80_000 }, first)).toEqual([]);
      expect(errorFields({ odometerKm: 79_999 }, first)).toEqual(["odometerKm"]);
    });

    it("has no upper limit for the newest refueling", () => {
      const newest = { ...context, nextOdometerKm: null };
      expect(errorFields({ odometerKm: 999_999 }, newest)).toEqual([]);
    });

    it("explains which neighbour is violated", () => {
      const result = createRefuelingSchema(context).safeParse({ ...valid, odometerKm: 85_000 });
      expect(result.error?.issues[0].message).toMatch(/nächsten Betankung/);
    });
  });

  describe("date (not in the future)", () => {
    it.each([
      ["2026-11-25", true],
      ["2026-11-26", false],
      ["2025-01-01", true],
      ["25.11.2026", false],
      ["2026-02-30", false],
    ])("%s valid: %s", (refueledOn, ok) => {
      expect(errorFields({ refueledOn })).toEqual(ok ? [] : ["refueledOn"]);
    });
  });

  it("reports every invalid field at once", () => {
    expect(errorFields({ volumeMl: 0, pricePerLiterTenthCents: 0, odometerKm: 0 })).toEqual([
      "volumeMl",
      "pricePerLiterTenthCents",
      "odometerKm",
    ]);
  });
});

describe("getRefuelingWarnings", () => {
  const previous = 84_000;

  it.each([
    [previous + DISTANCE_WARNING_KM, false],
    [previous + DISTANCE_WARNING_KM + 1, true],
  ])("%i km warns: %s", (odometerKm, warns) => {
    const warnings = getRefuelingWarnings({ odometerKm }, { ...context, nextOdometerKm: null });
    expect("odometerKm" in warnings).toBe(warns);
  });

  it("does not warn for the first refueling", () => {
    const first = { ...context, previousOdometerKm: null, nextOdometerKm: null };
    expect(getRefuelingWarnings({ odometerKm: 99_000 }, first)).toEqual({});
  });

  it("is not an error: the schema still accepts the value", () => {
    const newest = { ...context, nextOdometerKm: null };
    expect(errorFields({ odometerKm: previous + DISTANCE_WARNING_KM + 1 }, newest)).toEqual([]);
  });
});
