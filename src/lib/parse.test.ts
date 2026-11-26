import { decimalInputText, parseDecimal, parseWholeNumber } from "./parse";

describe("parseWholeNumber", () => {
  it.each([
    ["84000", 84_000],
    ["0", 0],
    [" 120 ", 120],
    ["007", 7],
  ])("reads %j as %d", (text, expected) => {
    expect(parseWholeNumber(text)).toBe(expected);
  });

  it.each(["", " ", "84.000", "84,5", "-5", "+5", "1e3", "84 000", "abc"])("rejects %j", (text) => {
    expect(parseWholeNumber(text)).toBeNaN();
  });
});

describe("parseDecimal", () => {
  it.each([
    ["50", 50],
    ["45,5", 45.5],
    ["45.5", 45.5],
    [" 5,8 ", 5.8],
    ["0,05", 0.05],
    ["0", 0],
  ])("reads %j as %d", (text, expected) => {
    expect(parseDecimal(text)).toBe(expected);
  });

  it.each(["", ",5", "5,", "1,2,3", "1.000,5", "-5", "5 L", "abc"])("rejects %j", (text) => {
    expect(parseDecimal(text)).toBeNaN();
  });

  it("reads a dot as decimal separator, never as thousands separator", () => {
    expect(parseDecimal("1.000")).toBe(1);
  });
});

describe("decimalInputText", () => {
  it.each([
    [50, "50"],
    [45.5, "45,5"],
    [45.501, "45,501"],
    [0.001, "0,001"],
  ])("writes %d as %j, which parseDecimal reads back", (value, text) => {
    expect(decimalInputText(value)).toBe(text);
    expect(parseDecimal(text)).toBe(value);
  });
});

it("returns Infinity for more digits than a number holds", () => {
  const digits = "9".repeat(400);
  expect([parseWholeNumber(digits), parseDecimal(digits)]).toEqual([Infinity, Infinity]);
});
