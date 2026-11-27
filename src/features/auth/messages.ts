// Texts for the auth codes (ADR 0014, 0016). The logic only knows codes; they map to i18n keys
// here and the wording lives in src/locales.
import { i18n, translate, type TextKey } from "@/lib/i18n";

import type { AuthServerErrorCode } from "./logic/authErrors";
import { MIN_PASSWORD_LENGTH, type AuthFieldErrorCode } from "./logic/authSchema";

// Records over the full unions: a new code without a key is a type error.
const FIELD_ERROR_KEYS: Record<AuthFieldErrorCode, TextKey> = {
  emailMissing: "auth.fieldErrors.emailMissing",
  emailInvalid: "auth.fieldErrors.emailInvalid",
  passwordMissing: "auth.fieldErrors.passwordMissing",
  passwordTooShort: "auth.fieldErrors.passwordTooShort",
};

const SERVER_ERROR_KEYS: Record<AuthServerErrorCode, TextKey> = {
  invalidCredentials: "auth.serverErrors.invalidCredentials",
  alreadyRegistered: "auth.serverErrors.alreadyRegistered",
  emailNotAccepted: "auth.serverErrors.emailNotAccepted",
  weakPassword: "auth.serverErrors.weakPassword",
  rateLimited: "auth.serverErrors.rateLimited",
  emailNotConfirmed: "auth.serverErrors.emailNotConfirmed",
  network: "common.networkError",
  unknown: "auth.serverErrors.unknown",
};

/** Shown if a validation message is not one of our codes, so the user never sees a raw code. */
export const UNKNOWN_FIELD_ERROR_TEXT = i18n.t("auth.fieldErrors.unknown");

function isFieldErrorCode(message: string): message is AuthFieldErrorCode {
  return Object.hasOwn(FIELD_ERROR_KEYS, message);
}

/** Text for a schema issue; takes the issue's `message`, which is a code. */
export function authFieldErrorText(message: string): string {
  return isFieldErrorCode(message)
    ? translate(FIELD_ERROR_KEYS[message], { min: MIN_PASSWORD_LENGTH })
    : UNKNOWN_FIELD_ERROR_TEXT;
}

export function authServerErrorText(code: AuthServerErrorCode): string {
  return translate(SERVER_ERROR_KEYS[code], { min: MIN_PASSWORD_LENGTH });
}
