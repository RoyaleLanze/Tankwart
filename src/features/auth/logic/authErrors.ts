/** A failed Supabase Auth call as a code; messages.ts has the German text (ADR 0014). */
export type AuthServerErrorCode =
  | "invalidCredentials"
  | "alreadyRegistered"
  | "emailNotAccepted"
  | "weakPassword"
  | "rateLimited"
  | "emailNotConfirmed"
  | "network"
  | "unknown";

// Supabase Auth error codes: https://supabase.com/docs/guides/auth/debugging/error-codes
const CODES_BY_SUPABASE_CODE = new Map<string, AuthServerErrorCode>([
  ["invalid_credentials", "invalidCredentials"],
  ["user_already_exists", "alreadyRegistered"],
  ["email_exists", "alreadyRegistered"],
  ["email_address_invalid", "emailNotAccepted"],
  ["weak_password", "weakPassword"],
  ["over_request_rate_limit", "rateLimited"],
  ["email_not_confirmed", "emailNotConfirmed"],
]);

// supabase-js reports "no network" and 5xx answers as AuthRetryableFetchError.
const NETWORK_ERROR_NAME = "AuthRetryableFetchError";

/** Classifies any error thrown by Supabase Auth. */
export function authErrorCode(error: unknown): AuthServerErrorCode {
  if (typeof error !== "object" || error === null) {
    return "unknown";
  }
  if ("name" in error && error.name === NETWORK_ERROR_NAME) {
    return "network";
  }
  if ("code" in error && typeof error.code === "string") {
    return CODES_BY_SUPABASE_CODE.get(error.code) ?? "unknown";
  }
  return "unknown";
}
