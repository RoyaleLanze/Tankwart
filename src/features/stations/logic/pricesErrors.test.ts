// Node types only for this test, which reads the function source; the app itself has no Node.
/// <reference types="node" />
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PRICES_ERROR_CODES, pricesErrorCode } from "./pricesErrors";

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
