import { computeMissing } from "./computeMissing";
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

    it("rounds the tolerance down for a capacity not divisible by 10", () => {
      // 45,455 ml × 1.1 = 50,000.5 ml → at most 50,000 ml
      const oddTank = { ...context, tankCapacityMl: 45_455 };
      expect(errorFields({ volumeMl: 50_000 }, oddTank)).toEqual([]);
      expect(errorFields({ volumeMl: 50_001 }, oddTank)).toEqual(["volumeMl"]);
    });
  });

  describe("price per liter (0.50–4.00 €)", () => {
    it.each([
      [MIN_PRICE_PER_LITER_TENTH_CENTS - 1, false],
      [MIN_PRICE_PER_LITER_TENTH_CENTS, true],
      [MAX_PRICE_PER_LITER_TENTH_CENTS, true],
      [MAX_PRICE_PER_LITER_TENTH_CENTS + 1, false],
      [1749.5, false],
    ])("%d tenth cents valid: %s", (pricePerLiterTenthCents, ok) => {
      expect(errorFields({ pricePerLiterTenthCents })).toEqual(
        ok ? [] : ["pricePerLiterTenthCents"],
      );
    });
  });

  describe("total", () => {
    it.each([
      [1, true],
      [0, false],
      [-1, false],
      [6996.5, false],
    ])("%d cents valid: %s", (totalCents, ok) => {
      expect(errorFields({ totalCents })).toEqual(ok ? [] : ["totalCents"]);
    });
  });

  describe("empty or non-numeric fields", () => {
    it.each([
      ["volumeMl", "volumeMissing"],
      ["pricePerLiterTenthCents", "priceMissing"],
      ["totalCents", "totalMissing"],
      ["odometerKm", "odometerMissing"],
    ] as const)("%s reports %s", (field, code) => {
      const [issue] = issues({ [field]: undefined }, newestOnly);
      expect(issue.path).toEqual([field]);
      expect(issue.message).toBe(code);
    });
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

    it.each([
      ["below the initial reading", { odometerKm: 79_999 }, "odometerBelowInitial"],
      ["not above the previous refueling", { odometerKm: 84_000 }, "odometerNotAbovePrevious"],
      ["not below the next refueling", { odometerKm: 85_000 }, "odometerNotBelowNext"],
      [
        "same reading on the same day",
        { refueledOn: "2026-11-10", odometerKm: 84_000 },
        "odometerDuplicateSameDay",
      ],
    ])("reports the violated rule: %s", (_, input, code) => {
      const [issue] = issues(input);
      expect(issue.path).toEqual(["odometerKm"]);
      expect(issue.message).toBe(code);
    });

    it("reports the initial reading first, even if the history is inconsistent", () => {
      // An older refueling below the initial reading; 69,000 km violates both rules.
      const inconsistent = {
        ...context,
        otherRefuelings: [{ refueledOn: "2026-11-01", odometerKm: 70_000 }],
      };
      const [issue] = issues({ odometerKm: 69_000 }, inconsistent);
      expect(issue.message).toBe("odometerBelowInitial");
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
      ["2026-11-20T10:00:00Z", false],
    ])("%s valid: %s", (refueledOn, ok) => {
      expect(errorFields({ refueledOn }, firstRefueling)).toEqual(ok ? [] : ["refueledOn"]);
    });

    it.each([
      ["leap day", "2028-03-01", "2028-02-29", true],
      ["no leap day in 2027", "2027-03-01", "2027-02-29", false],
      ["last day of the old year", "2027-01-01", "2026-12-31", true],
      ["tomorrow in the new year", "2026-12-31", "2027-01-01", false],
    ])("%s: today %s, %s valid: %s", (_, today, refueledOn, ok) => {
      expect(errorFields({ refueledOn }, { ...firstRefueling, today: () => today })).toEqual(
        ok ? [] : ["refueledOn"],
      );
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

  it("reports codes, not text", () => {
    const [issue] = issues({ pricePerLiterTenthCents: MAX_PRICE_PER_LITER_TENTH_CENTS + 1 });
    expect(issue.message).toBe("priceOutOfRange");
  });
});

describe("getRefuelingWarnings", () => {
  const previous = 84_000;

  it("reports a warning code", () => {
    expect(getRefuelingWarnings({ odometerKm: 90_000 }, newestOnly)).toEqual({
      odometerKm: "distanceUnusuallyLarge",
    });
  });

  it.each([
    [previous + DISTANCE_WARNING_KM, false],
    [previous + DISTANCE_WARNING_KM + 1, true],
  ])("%i km warns: %s", (odometerKm, warns) => {
    expect("odometerKm" in getRefuelingWarnings({ odometerKm }, newestOnly)).toBe(warns);
  });

  it.each([previous, previous - 1000])(
    "does not warn at or below the previous: %i km",
    (odometerKm) => {
      expect(getRefuelingWarnings({ odometerKm }, newestOnly)).toEqual({});
    },
  );

  it("measures from the nearest lower reading when a later refueling exists", () => {
    // Previous 84,000 km, next 90,000 km: the gap to the next one is irrelevant.
    const wideGap = {
      ...context,
      otherRefuelings: [
        { refueledOn: "2026-11-10", odometerKm: previous },
        { refueledOn: "2026-12-01", odometerKm: 90_000 },
      ],
    };
    expect(getRefuelingWarnings({ odometerKm: previous + DISTANCE_WARNING_KM }, wideGap)).toEqual(
      {},
    );
    expect(
      getRefuelingWarnings({ odometerKm: previous + DISTANCE_WARNING_KM + 1 }, wideGap),
    ).toHaveProperty("odometerKm");
  });

  it("does not warn for the first refueling", () => {
    expect(getRefuelingWarnings({ odometerKm: 99_000 }, firstRefueling)).toEqual({});
  });

  it("is not an error: the schema still accepts the value", () => {
    expect(errorFields({ odometerKm: previous + DISTANCE_WARNING_KM + 1 }, newestOnly)).toEqual([]);
  });
});

describe("computed amounts are still validated (M3 + M4)", () => {
  /** Fills the missing field like the form does, then validates the result. */
  function validateComputed(amounts: Partial<RefuelingInput>): string[] {
    const computed = computeMissing(amounts);
    if (!computed) throw new Error("expected a computed amount");
    return errorFields({ ...amounts, [computed.field]: computed.value });
  }

  it.each([
    // 100 € for 1 L → 100.00 €/L
    [
      "price 100,000 from 100 € / 1 L",
      { totalCents: 10_000, volumeMl: 1000 },
      ["pricePerLiterTenthCents"],
    ],
    // 96.20 € at 1.749 €/L → 55,003 ml > 55,000 ml
    [
      "volume 55,003 ml for a 50 L tank",
      { totalCents: 9620, pricePerLiterTenthCents: 1749 },
      ["volumeMl"],
    ],
    // 96.17 € at 1.749 €/L → 54,986 ml
    ["volume 54,986 ml for a 50 L tank", { totalCents: 9617, pricePerLiterTenthCents: 1749 }, []],
  ])("%s", (_, amounts, expected) => {
    expect(validateComputed(amounts)).toEqual(expected);
  });
});
