import {
  computedAmount,
  createRefuelingFormSchema,
  defaultFormValues,
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

/** Field name → error code of every issue. */
function errors(overrides: Partial<RefuelingFormValues>) {
  const result = parse(overrides);
  if (result.success) return {};
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

  it("reports unreadable and huge numbers", () => {
    expect(errors({ odometerKm: "abc" })).toEqual({ odometerKm: "odometerMissing" });
    expect(errors({ odometerKm: "9".repeat(400) })).toEqual({ odometerKm: "valueTooLarge" });
    expect(errors({ volumeLiters: "9".repeat(400) })).toHaveProperty("volumeLiters");
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

  it("is silent for empty or unreadable text", () => {
    expect(odometerWarning({ ...valid, odometerKm: "" }, context)).toBeUndefined();
    expect(odometerWarning({ ...valid, odometerKm: "x" }, context)).toBeUndefined();
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
