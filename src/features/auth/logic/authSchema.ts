import { z } from "zod";

import type { AuthMode } from "../types";

// Must match minimum_password_length in supabase/config.toml (decided on 21.11.2026).
export const MIN_PASSWORD_LENGTH = 8;

const email = z
  .string()
  .trim()
  .min(1, "Gib deine E-Mail-Adresse ein.")
  .pipe(z.email("Diese E-Mail-Adresse ist ungültig."));

// Signing in only checks that a password was typed. The length rule belongs to registration,
// so the user gets the server's answer ("wrong password") instead of a misleading hint.
const signInSchema = z.object({
  email,
  password: z.string().min(1, "Gib dein Passwort ein."),
});

const signUpSchema = z.object({
  email,
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Das Passwort braucht mindestens ${MIN_PASSWORD_LENGTH} Zeichen.`),
});

export const authSchemas = {
  signIn: signInSchema,
  signUp: signUpSchema,
} satisfies Record<AuthMode, z.ZodType>;
