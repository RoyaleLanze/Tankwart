// Validation schemas for the login form (ADR 0009). Errors are codes, not text (ADR 0014):
// each issue's `message` is an AuthFieldErrorCode that messages.ts turns into German text.
import { z } from "zod";

import type { AuthMode } from "../types";

// Must match minimum_password_length in supabase/config.toml (decided on 21.11.2026).
export const MIN_PASSWORD_LENGTH = 8;

export type AuthFieldErrorCode =
  "emailMissing" | "emailInvalid" | "passwordMissing" | "passwordTooShort";

/** Typed shorthand, so a misspelled code is a type error. */
const code = (value: AuthFieldErrorCode) => value;

const email = z
  .string()
  .trim()
  .min(1, code("emailMissing"))
  .pipe(z.email(code("emailInvalid")));

// Signing in only checks that a password was typed. The length rule belongs to registration,
// so the user gets the server's answer ("wrong password") instead of a misleading hint.
const signInSchema = z.object({
  email,
  password: z.string().min(1, code("passwordMissing")),
});

const signUpSchema = z.object({
  email,
  password: z.string().min(MIN_PASSWORD_LENGTH, code("passwordTooShort")),
});

export const authSchemas = {
  signIn: signInSchema,
  signUp: signUpSchema,
} satisfies Record<AuthMode, z.ZodType>;
