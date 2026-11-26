// Errors of the prices function as codes; messages.ts has the German texts (ADR 0014).

/** Mirrors PricesErrorCode in supabase/functions/prices/handler.ts; a test keeps both in sync. */
export const PRICES_ERROR_CODES = [
  "methodNotAllowed",
  "unauthorized",
  "invalidInput",
  "outsideGermany",
  "stationNotFound",
  "missingApiKey",
  "upstreamUnavailable",
  "rateLimited",
  "internalError",
] as const;

export type PricesErrorCode = (typeof PRICES_ERROR_CODES)[number];

/**
 * Codes of the function plus two the app adds: `network` if the request did not reach the
 * function, `unknown` if the answer was not one of our codes (e.g. a gateway error page).
 */
export type StationsErrorCode = PricesErrorCode | "network" | "unknown";

function isPricesErrorCode(value: unknown): value is PricesErrorCode {
  return PRICES_ERROR_CODES.some((code) => code === value);
}

/** Reads the code from an error body `{ error: code }` of the function. */
export function pricesErrorCode(body: unknown): StationsErrorCode {
  if (typeof body !== "object" || body === null || !("error" in body)) return "unknown";
  return isPricesErrorCode(body.error) ? body.error : "unknown";
}
