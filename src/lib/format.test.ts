import {
  formatConsumption,
  formatDayShort,
  formatEuro,
  formatFetchedAt,
  formatKm,
  formatLiters,
  formatMonth,
  formatPricePerLiter,
} from "./format";

// Units are joined with a non-breaking space; written as a normal space here for readability.
const readable = (text: string) => text.replace(/ /g, " ");

describe("number formats", () => {
  it.each([
    [18_240, "182,40 €"],
    [0, "0,00 €"],
    [5, "0,05 €"],
    [123_456_7, "12.345,67 €"],
    [-1_250, "-12,50 €"],
  ])("formatEuro(%i) = %s", (cents, expected) => {
    expect(readable(formatEuro(cents))).toBe(expected);
  });

  it.each([
    [52_400, "52,4 L"],
    [40_000, "40,0 L"],
    [52_449, "52,4 L"],
    [52_450, "52,5 L"],
    [1_234_500, "1.234,5 L"],
  ])("formatLiters(%i) = %s", (ml, expected) => {
    expect(readable(formatLiters(ml))).toBe(expected);
  });

  it.each([
    [84_230, "84.230 km"],
    [2_000, "2.000 km"],
    [999, "999 km"],
    [0, "0 km"],
  ])("formatKm(%i) = %s", (km, expected) => {
    expect(readable(formatKm(km))).toBe(expected);
  });

  it.each([
    [6_400, "6,4 L/100 km"],
    [6_449, "6,4 L/100 km"],
    [12_000, "12,0 L/100 km"],
  ])("formatConsumption(%i) = %s", (mlPer100Km, expected) => {
    expect(readable(formatConsumption(mlPer100Km))).toBe(expected);
  });

  it("keeps value and unit together with a non-breaking space", () => {
    expect(formatEuro(100)).toBe("1,00 €");
    expect(formatConsumption(6_400)).toBe("6,4 L/100 km");
  });
});

describe("formatPricePerLiter", () => {
  it.each([
    [1749, "1,74", "9", "1 Euro 74,9 Cent pro Liter"],
    [1059, "1,05", "9", "1 Euro 5,9 Cent pro Liter"],
    [2000, "2,00", "0", "2 Euro 0,0 Cent pro Liter"],
    [500, "0,50", "0", "0 Euro 50,0 Cent pro Liter"],
    [4000, "4,00", "0", "4 Euro 0,0 Cent pro Liter"],
  ])("%i → %s + %s", (tenthCents, euroAndCents, tenthCent, accessibilityLabel) => {
    expect(formatPricePerLiter(tenthCents)).toEqual({ euroAndCents, tenthCent, accessibilityLabel });
  });
});

describe("date formats", () => {
  it.each([
    ["2026-11-18", "18. Nov."],
    ["2026-01-01", "1. Jan."],
    ["2026-05-03", "3. Mai"],
    ["2026-12-31", "31. Dez."],
  ])("formatDayShort(%s) = %s", (isoDate, expected) => {
    expect(formatDayShort(isoDate)).toBe(expected);
  });

  it.each([
    ["2026-11-18", "November 2026"],
    ["2026-11-01", "November 2026"],
    ["2026-11-30", "November 2026"],
    ["2027-01-01", "Januar 2027"],
  ])("formatMonth(%s) = %s", (isoDate, expected) => {
    expect(formatMonth(isoDate)).toBe(expected);
  });

  it("never shifts an ISO date by the device time zone", () => {
    // First and last day of a month are where a UTC/local mix-up would show.
    expect(formatDayShort("2026-03-01")).toBe("1. März");
    expect(formatMonth("2026-02-28")).toBe("Februar 2026");
  });

  it("rejects an invalid ISO date instead of printing 'Invalid Date'", () => {
    expect(() => formatDayShort("18.11.2026")).toThrow("Invalid ISO date");
  });

  it.each([
    [new Date(2026, 10, 25, 9, 52), "abgerufen um 09:52"],
    [new Date(2026, 10, 25, 0, 5), "abgerufen um 00:05"],
    [new Date(2026, 10, 25, 23, 59), "abgerufen um 23:59"],
  ])("formatFetchedAt(%s) = %s", (fetchedAt, expected) => {
    expect(formatFetchedAt(fetchedAt)).toBe(expected);
  });
});
