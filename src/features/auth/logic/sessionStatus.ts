import { authErrorCode } from "./authErrors";

/**
 * What the app knows about the session on the device:
 * - signedIn: there is a usable session.
 * - signedOut: there is none, or the server rejected it (signed out, refresh token invalid).
 * - unreachable: the access token has expired and could not be renewed because the server was
 *   unreachable. The session stays on the device, so the user is still signed in.
 */
export type SessionStatus = "signedIn" | "signedOut" | "unreachable";

/**
 * Decides from reading the stored session: the session, or the error if reading it failed.
 * supabase-js keeps the stored session only if renewing failed for lack of a connection (or a
 * 5xx answer). After any other failure it has deleted the session, so the user must sign in.
 */
export function sessionStatus(session: object | null, error: unknown = null): SessionStatus {
  if (session !== null) return "signedIn";
  return authErrorCode(error) === "network" ? "unreachable" : "signedOut";
}
