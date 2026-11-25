// German texts for the auth codes (ADR 0014). The logic only knows codes; the wording lives here.
import type { AuthServerErrorCode } from "./logic/authErrors";
import { MIN_PASSWORD_LENGTH, type AuthFieldErrorCode } from "./logic/authSchema";

// Records over the full unions: a new code without a text is a type error.
const FIELD_ERROR_TEXTS: Record<AuthFieldErrorCode, string> = {
  emailMissing: "Gib deine E-Mail-Adresse ein.",
  emailInvalid: "Diese E-Mail-Adresse ist ungültig.",
  passwordMissing: "Gib dein Passwort ein.",
  passwordTooShort: `Das Passwort braucht mindestens ${MIN_PASSWORD_LENGTH} Zeichen.`,
};

const SERVER_ERROR_TEXTS: Record<AuthServerErrorCode, string> = {
  invalidCredentials: "E-Mail oder Passwort ist falsch.",
  alreadyRegistered: "Zu dieser E-Mail gibt es schon ein Konto. Melde dich an.",
  emailNotAccepted: "Diese E-Mail-Adresse wird nicht akzeptiert.",
  weakPassword: `Das Passwort ist zu schwach. Nutze mindestens ${MIN_PASSWORD_LENGTH} Zeichen.`,
  rateLimited: "Zu viele Versuche. Warte kurz und versuche es dann erneut.",
  emailNotConfirmed: "Bestätige zuerst deine E-Mail-Adresse über den Link in der Mail.",
  network: "Keine Verbindung zum Server. Prüfe deine Internetverbindung und versuche es erneut.",
  unknown: "Das hat nicht geklappt. Versuche es später erneut.",
};

/** Shown if a validation message is not one of our codes, so the user never sees a raw code. */
export const UNKNOWN_FIELD_ERROR_TEXT = "Bitte prüfe deine Eingabe.";

function isFieldErrorCode(message: string): message is AuthFieldErrorCode {
  return Object.hasOwn(FIELD_ERROR_TEXTS, message);
}

/** Text for a schema issue; takes the issue's `message`, which is a code. */
export function authFieldErrorText(message: string): string {
  return isFieldErrorCode(message) ? FIELD_ERROR_TEXTS[message] : UNKNOWN_FIELD_ERROR_TEXT;
}

export function authServerErrorText(code: AuthServerErrorCode): string {
  return SERVER_ERROR_TEXTS[code];
}
