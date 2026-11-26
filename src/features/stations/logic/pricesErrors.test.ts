// Node types only for this test, which reads the function source; the app itself has no Node.
/// <reference types="node" />
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PRICES_ERROR_CODES, pricesErrorCode } from "./pricesErrors";
import { RADIUS_OPTIONS_KM } from "./sortStations";

const HANDLER_PATH = join(__dirname, "../../../../supabase/functions/prices/handler.ts");

/** The string literals of `export type PricesErrorCode = …;` in the function's source. */
function codesInHandler(): string[] {
  const source = readFileSync(HANDLER_PATH, "utf8");
  const union = /export type PricesErrorCode =([^;]+);/.exec(source)?.[1] ?? "";
  return [...union.matchAll(/"(\w+)"/g)].map((match) => match[1]);
}

describe("PRICES_ERROR_CODES", () => {
  // The app cannot import the Deno function, so the codes are copied; this test catches drift.
  it("lists exactly the codes of the prices function", () => {
    expect([...PRICES_ERROR_CODES].sort()).toEqual(codesInHandler().sort());
  });
});

describe("RADIUS_OPTIONS_KM", () => {
  // Same drift guard as above: the function rejects every radius that is not in its own list.
  it("lists exactly the radii of the prices function", () => {
    const source = readFileSync(HANDLER_PATH, "utf8");
    const list = /export const RADIUS_OPTIONS_KM = \[([^\]]+)\]/.exec(source)?.[1] ?? "";
    const radii = list.split(",").map((radius) => Number(radius.trim()));
    expect([...RADIUS_OPTIONS_KM]).toEqual(radii);
  });
});

describe("pricesErrorCode", () => {
  it.each(PRICES_ERROR_CODES)("reads the code %s from the body", (code) => {
    expect(pricesErrorCode({ error: code })).toBe(code);
  });

  it.each([
    [null],
    ["rateLimited"],
    [{}],
    [{ error: "somethingNew" }],
    [{ error: "toString" }],
    [{ error: 429 }],
    [{ message: "Internal Server Error" }],
  ])("falls back to unknown for %j", (body) => {
    expect(pricesErrorCode(body)).toBe("unknown");
  });
});
