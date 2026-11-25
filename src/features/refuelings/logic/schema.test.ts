import { createRefuelingSchema, getRefuelingWarnings, type RefuelingInput } from "./schema";
import {
  DISTANCE_WARNING_KM,
  MAX_DB_INTEGER,
  MAX_PRICE_PER_LITER_TENTH_CENTS,
  MIN_PRICE_PER_LITER_TENTH_CENTS,
  type RefuelingContext,
} from "./rules";

// History: 84,000 km on Nov 10, 85,000 km on Dec 1 (edit case: the new entry sits between them).
const context: RefuelingContext = {
  today: () => "2026-11-25",
  tankCapacityMl: 50_000,
  initialOdometerKm: 80_000,
  otherRefuelings: [
    { refueledOn: "2026-11-10", odometerKm: 84_000 },
    { refueledOn: "2026-12-01", odometerKm: 85_000 },
  ],
};
const firstRefueling: RefuelingContext = { ...context, otherRefuelings: [] };
const newestOnly: RefuelingContext = {
  ...context,
  otherRefuelings: [{ refueledOn: "2026-11-10", odometerKm: 84_000 }],
};

const valid: RefuelingInput = {
  refueledOn: "2026-11-20",
  volumeMl: 40_000,
  pricePerLiterTenthCents: 1749,
  totalCents: 6996,
  odometerKm: 84_500,
};

function issues(input: Partial<RefuelingInput>, ctx: RefuelingContext = context) {
  const result = createRefuelingSchema(ctx).safeParse({ ...valid, ...input });
  return result.success ? [] : result.error.issues;
}

/** Field paths with an error, e.g. ["volumeMl"]; empty when valid. */
function errorFields(input: Partial<RefuelingInput>, ctx: RefuelingContext = context): string[] {
  return issues(input, ctx).map((issue) => issue.path.join("."));
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

  describe("empty or non-numeric fields", () => {
    it.each(["volumeMl", "pricePerLiterTenthCents", "totalCents", "odometerKm"] as const)(
      "%s reports a German message",
      (field) => {
        const [issue] = issues({ [field]: undefined }, newestOnly);
        expect(issue.path).toEqual([field]);
        expect(issue.message).toMatch(/^Bitte .* angeben\.$/);
      },
    );
  });

  it("rejects values above the database integer limit", () => {
    expect(errorFields({ odometerKm: MAX_DB_INTEGER + 1 }, newestOnly)).toEqual(["odometerKm"]);
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
      expect(errorFields({ odometerKm: 80_000 }, firstRefueling)).toEqual([]);
      expect(errorFields({ odometerKm: 79_999 }, firstRefueling)).toEqual(["odometerKm"]);
    });

    it("has no upper limit besides the database for the newest refueling", () => {
      expect(errorFields({ odometerKm: 999_999 }, newestOnly)).toEqual([]);
    });

    it("explains which neighbour is violated", () => {
      expect(issues({ odometerKm: 85_000 })[0].message).toMatch(/nächsten Betankung/);
    });

    it("finds the neighbours from the entered date", () => {
      // Moved before Nov 10: now 84,000 is the next refueling, so 84,500 is too high.
      expect(errorFields({ refueledOn: "2026-11-01", odometerKm: 84_500 })).toEqual(["odometerKm"]);
      expect(errorFields({ refueledOn: "2026-11-01", odometerKm: 83_000 })).toEqual([]);
    });

    it("allows any order on the same day except an identical reading", () => {
      const sameDay = { refueledOn: "2026-11-10" };
      expect(errorFields({ ...sameDay, odometerKm: 83_900 })).toEqual([]);
      expect(errorFields({ ...sameDay, odometerKm: 84_100 })).toEqual([]);
      expect(errorFields({ ...sameDay, odometerKm: 84_000 })).toEqual(["odometerKm"]);
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
      expect(errorFields({ refueledOn }, firstRefueling)).toEqual(ok ? [] : ["refueledOn"]);
    });

    it("reads today at validation time, not when the schema is built", () => {
      let today = "2026-11-25";
      const schema = createRefuelingSchema({ ...firstRefueling, today: () => today });
      const nextDay = { ...valid, refueledOn: "2026-11-26" };
      expect(schema.safeParse(nextDay).success).toBe(false);
      today = "2026-11-26";
      expect(schema.safeParse(nextDay).success).toBe(true);
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
    expect("odometerKm" in getRefuelingWarnings({ odometerKm }, newestOnly)).toBe(warns);
  });

  it("does not warn for the first refueling", () => {
    expect(getRefuelingWarnings({ odometerKm: 99_000 }, firstRefueling)).toEqual({});
  });

  it("is not an error: the schema still accepts the value", () => {
    expect(errorFields({ odometerKm: previous + DISTANCE_WARNING_KM + 1 }, newestOnly)).toEqual([]);
  });
});
