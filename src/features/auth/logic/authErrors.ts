import { MIN_PASSWORD_LENGTH } from "./authSchema";

export const NETWORK_ERROR_MESSAGE =
  "Keine Verbindung zum Server. Prüfe deine Internetverbindung und versuche es erneut.";
export const UNKNOWN_ERROR_MESSAGE = "Das hat nicht geklappt. Versuche es später erneut.";

const ALREADY_REGISTERED = "Zu dieser E-Mail gibt es schon ein Konto. Melde dich an.";

// Supabase Auth error codes: https://supabase.com/docs/guides/auth/debugging/error-codes
const MESSAGES_BY_CODE = new Map<string, string>([
  ["invalid_credentials", "E-Mail oder Passwort ist falsch."],
  ["user_already_exists", ALREADY_REGISTERED],
  ["email_exists", ALREADY_REGISTERED],
  ["email_address_invalid", "Diese E-Mail-Adresse wird nicht akzeptiert."],
  [
    "weak_password",
    `Das Passwort ist zu schwach. Nutze mindestens ${MIN_PASSWORD_LENGTH} Zeichen.`,
  ],
  ["over_request_rate_limit", "Zu viele Versuche. Warte kurz und versuche es dann erneut."],
  ["email_not_confirmed", "Bestätige zuerst deine E-Mail-Adresse über den Link in der Mail."],
]);

// supabase-js reports "no network" and 5xx answers as AuthRetryableFetchError.
const NETWORK_ERROR_NAME = "AuthRetryableFetchError";

/** Turns any error from Supabase Auth into a German message for the user. */
export function authErrorMessage(error: unknown): string {
  if (typeof error !== "object" || error === null) {
    return UNKNOWN_ERROR_MESSAGE;
  }
  if ("name" in error && error.name === NETWORK_ERROR_NAME) {
    return NETWORK_ERROR_MESSAGE;
  }
  if ("code" in error && typeof error.code === "string") {
    return MESSAGES_BY_CODE.get(error.code) ?? UNKNOWN_ERROR_MESSAGE;
  }
  return UNKNOWN_ERROR_MESSAGE;
}
