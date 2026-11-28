import {
  computedAmount,
  createRefuelingFormSchema,
  defaultFormValues,
  formFieldOf,
  odometerWarning,
} from "./formSchema";
import type { RefuelingFormValues } from "./formValues";
import type { RefuelingContext } from "./rules";

const context: RefuelingContext = {
  today: () => "2026-11-25",
  tankCapacityMl: 50_000,
  initialOdometerKm: 80_000,
  otherRefuelings: [{ refueledOn: "2026-11-10", odometerKm: 84_000 }],
};

const valid: RefuelingFormValues = {
  ...defaultFormValues("2026-11-20"),
  volumeLiters: "40,0",
  pricePerLiter: "1,749",
  totalEuros: "69,96",
  odometerKm: "84500",
  stationName: "Aral",
};

function parse(overrides: Partial<RefuelingFormValues> = {}, ctx = context) {
  return createRefuelingFormSchema(ctx).safeParse({ ...valid, ...overrides });
}

/** Form field → error code of every issue; fails the test if the input is accepted. */
function errors(overrides: Partial<RefuelingFormValues>) {
  const result = parse(overrides);
  if (result.success) throw new Error("expected the form values to be rejected");
  return Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]));
}

describe("createRefuelingFormSchema", () => {
  it("turns the typed text into database units", () => {
    expect(parse().data).toEqual({
      refueledOn: "2026-11-20",
      volumeMl: 40_000,
      pricePerLiterTenthCents: 1749,
      totalCents: 6996,
      odometerKm: 84_500,
      stationName: "Aral",
      stationId: null,
      stationAddress: null,
      isFullTank: true,
      previousMissed: false,
      note: null,
    });
  });

  it("accepts a dot as decimal separator and trims text", () => {
    const data = parse({ volumeLiters: " 40.0 ", stationName: " Aral ", note: " Regen " }).data;
    expect(data).toMatchObject({ volumeMl: 40_000, stationName: "Aral", note: "Regen" });
  });

  it.each([
    ["totalEuros", { totalEuros: "" }, { totalCents: 6996 }],
    ["volumeLiters", { volumeLiters: "" }, { volumeMl: 40_000 }],
    ["pricePerLiter", { pricePerLiter: "" }, { pricePerLiterTenthCents: 1749 }],
  ])("computes the third value when %s is empty", (_field, overrides, expected) => {
    expect(parse(overrides).data).toMatchObject(expected);
  });

  it("reports missing values at the form field when two of three are missing", () => {
    expect(errors({ volumeLiters: "", totalEuros: "" })).toEqual({
      volumeLiters: "volumeMissing",
      totalEuros: "totalMissing",
    });
  });

  it("reports a rule at the form field, not at the database unit", () => {
    expect(errors({ pricePerLiter: "4,5" })).toEqual({ pricePerLiter: "priceOutOfRange" });
    expect(errors({ volumeLiters: "60" })).toEqual({ volumeLiters: "volumeAboveTank" });
    expect(errors({ refueledOn: "2026-11-26" })).toEqual({ refueledOn: "dateInFuture" });
  });

  it("does not overwrite a typed zero with a computed value", () => {
    expect(errors({ volumeLiters: "0", totalEuros: "" })).toEqual({
      volumeLiters: "volumeNotPositive",
      totalEuros: "totalMissing",
    });
  });

  it("reports unreadable numbers as missing", () => {
    expect(errors({ odometerKm: "abc" })).toEqual({ odometerKm: "odometerMissing" });
  });

  it.each(["volumeLiters", "pricePerLiter", "totalEuros", "odometerKm"] as const)(
    "reports a number with 400 digits at %s as too large",
    (field) => {
      expect(errors({ [field]: "9".repeat(400) })).toEqual({ [field]: "valueTooLarge" });
    },
  );

  it("reports a computed value that breaks a rule at the computed field", () => {
    // 100 € for 1 L is 100 €/L, 500 € at 1,749 €/L is 285 L in a 50 L tank.
    expect(errors({ volumeLiters: "1", pricePerLiter: "", totalEuros: "100" })).toEqual({
      pricePerLiter: "computedAmountInvalid",
    });
    expect(errors({ volumeLiters: "", pricePerLiter: "1,749", totalEuros: "500" })).toEqual({
      volumeLiters: "computedAmountInvalid",
    });
  });

  it("keeps the rule code at a typed field when another value is computed", () => {
    expect(errors({ pricePerLiter: "4,5", totalEuros: "" })).toEqual({
      pricePerLiter: "priceOutOfRange",
    });
  });

  it("requires a station", () => {
    expect(errors({ stationName: "  " })).toEqual({ stationName: "stationMissing" });
  });

  it("checks the odometer against the neighbours", () => {
    expect(errors({ odometerKm: "83000" })).toEqual({ odometerKm: "odometerNotAbovePrevious" });
    expect(errors({ odometerKm: "79000", refueledOn: "2026-11-05" })).toEqual({
      odometerKm: "odometerBelowInitial",
    });
  });

  it("keeps the station id and address of a suggested station", () => {
    const data = parse({ stationId: "abc", stationAddress: " Hauptstr. 1 " }).data;
    expect(data).toMatchObject({ stationId: "abc", stationAddress: "Hauptstr. 1" });
  });

  it("stores an empty station id and address as null", () => {
    const data = parse({ stationId: " ", stationAddress: " " }).data;
    expect(data).toMatchObject({ stationId: null, stationAddress: null });
  });

  // ADR 0012: no consistency check between the three values, the total stays as typed.
  it("accepts three contradicting amounts and keeps the typed total", () => {
    const result = parse({ volumeLiters: "40", pricePerLiter: "1,749", totalEuros: "5,00" });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ volumeMl: 40_000, totalCents: 500 });
  });
});

describe("rounding of typed and computed amounts", () => {
  it.each([
    [
      "total from liters and price",
      { volumeLiters: "41,3", pricePerLiter: "1,759", totalEuros: "" },
      { totalCents: 7265 },
    ],
    [
      "liters from total and price",
      { volumeLiters: "", pricePerLiter: "1,899", totalEuros: "50,00" },
      { volumeMl: 26_330 },
    ],
    [
      "price from total and liters",
      { volumeLiters: "28,5", pricePerLiter: "", totalEuros: "50" },
      { pricePerLiterTenthCents: 1754 },
    ],
  ])("%s", (_name, overrides, expected) => {
    expect(parse(overrides).data).toMatchObject(expected);
  });

  // Documented behavior: more than three decimals are rounded, not rejected.
  it("rounds a price with more than 3 decimals to tenths of a cent", () => {
    expect(parse({ pricePerLiter: "1,7495", totalEuros: "" }).data).toMatchObject({
      pricePerLiterTenthCents: 1750,
    });
  });
});

describe("price limits typed as text", () => {
  it.each(["0,50", "4,00"])("accepts %s €/L", (pricePerLiter) => {
    expect(parse({ pricePerLiter, totalEuros: "" }).success).toBe(true);
  });

  it.each(["0,49", "4,01"])("rejects %s €/L", (pricePerLiter) => {
    expect(errors({ pricePerLiter, totalEuros: "" })).toEqual({ pricePerLiter: "priceOutOfRange" });
  });
});

describe("unreadable input", () => {
  it.each([
    ["dateInvalid", { refueledOn: "2026-02-30" }, "refueledOn"],
    ["totalNotPositive", { totalEuros: "0" }, "totalEuros"],
    ["volumeMissing", { volumeLiters: "-5" }, "volumeLiters"],
    ["odometerMissing", { odometerKm: "84.500" }, "odometerKm"],
  ])("gives %s", (code, overrides, field) => {
    expect(errors(overrides)).toEqual({ [field]: code });
  });
});

describe("formFieldOf", () => {
  it("maps validated fields to the form field of the same value", () => {
    expect(formFieldOf("volumeMl")).toBe("volumeLiters");
    expect(formFieldOf("pricePerLiterTenthCents")).toBe("pricePerLiter");
    expect(formFieldOf("totalCents")).toBe("totalEuros");
    expect(formFieldOf("odometerKm")).toBe("odometerKm");
  });
});

describe("computedAmount", () => {
  it("names the empty field and its value once the other two are valid", () => {
    expect(computedAmount({ ...valid, totalEuros: "" })).toEqual({
      field: "totalCents",
      value: 6996,
    });
  });

  it("is null while fewer or more than two are filled or one is invalid", () => {
    expect(computedAmount(valid)).toBeNull();
    expect(computedAmount({ ...valid, totalEuros: "", volumeLiters: "" })).toBeNull();
    expect(computedAmount({ ...valid, totalEuros: "", volumeLiters: "x" })).toBeNull();
  });
});

describe("odometerWarning", () => {
  it("warns above 2,000 km since the previous refueling", () => {
    expect(odometerWarning({ ...valid, odometerKm: "86001" }, context)).toBe(
      "distanceUnusuallyLarge",
    );
    expect(odometerWarning({ ...valid, odometerKm: "86000" }, context)).toBeUndefined();
  });

  it.each([
    ["empty", ""],
    ["unreadable", "x"],
    ["above the database limit", "2147483648"],
    ["400 digits", "9".repeat(400)],
  ])("is silent for %s text", (_name, odometerKm) => {
    expect(odometerWarning({ ...valid, odometerKm }, context)).toBeUndefined();
  });
});

describe("defaultFormValues", () => {
  it("starts with today and a full tank", () => {
    expect(defaultFormValues("2026-11-27")).toMatchObject({
      refueledOn: "2026-11-27",
      isFullTank: true,
      previousMissed: false,
    });
  });
});
