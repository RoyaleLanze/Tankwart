import { AuthError, isAuthRetryableFetchError, type Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

import type { Credentials } from "../types";

// Repository for Supabase Auth. Every function throws the Supabase error so the hooks can map it.

export async function signIn({ email, password }: Credentials): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

// Email confirmation is off (supabase/config.toml), so a successful sign-up also signs the user in.
export async function signUp({ email, password }: Credentials): Promise<void> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  // Without a session the project still requires email confirmation (default of a new cloud
  // project). The user would otherwise stay on the login screen without any message.
  if (!data.session) {
    throw new AuthError("Sign-up needs email confirmation", 400, "email_not_confirmed");
  }
}

// Scope "local" signs out this device only. supabase-js deletes the stored session before it asks
// the server to revoke the refresh token, so signing out also works offline. If that request
// fails, the refresh token stays valid on the server until it is used or revoked, because refresh
// tokens do not expire without session limits ([auth.sessions]). Accepted risk, noted in the PR.
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error && !isAuthRetryableFetchError(error)) throw error;
}

/**
 * The stored session, or null if there is none. supabase-js renews an expired session first and
 * returns the error if that fails; it keeps the session on the device after a network error.
 */
export async function loadSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Calls back after every sign-in, sign-out and token refresh. Returns the function that ends
 * the subscription. The start event INITIAL_SESSION is skipped: it reports a session that could
 * not be renewed offline as null, the same as signed out (#111). `loadSession` covers the start.
 */
export function subscribeToSessionChanges(onChange: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event !== "INITIAL_SESSION") onChange(session);
  });
  return () => data.subscription.unsubscribe();
}
