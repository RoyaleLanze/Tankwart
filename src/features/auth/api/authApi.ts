import { isAuthRetryableFetchError, type Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

import type { Credentials } from "../types";

// Repository for Supabase Auth. Every function throws the Supabase error so the hooks can map it.

export async function signIn({ email, password }: Credentials): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

// Email confirmation is off (supabase/config.toml), so a successful sign-up also signs the user in.
export async function signUp({ email, password }: Credentials): Promise<void> {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
}

// Scope "local" signs out this device only. supabase-js deletes the stored session before it asks
// the server to revoke the refresh token, so signing out also works offline. A failed revoke
// request only leaves that token valid on the server until it expires, which the user cannot fix.
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error && !isAuthRetryableFetchError(error)) throw error;
}

/**
 * Calls back with the stored session right away (event INITIAL_SESSION) and again after every
 * sign-in, sign-out and token refresh. Returns the function that ends the subscription.
 */
export function subscribeToSession(onChange: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => onChange(session));
  return () => data.subscription.unsubscribe();
}
