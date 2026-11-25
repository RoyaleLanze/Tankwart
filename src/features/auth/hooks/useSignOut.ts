import { useState } from "react";

import { signOut } from "../api/authApi";
import { authErrorCode } from "../logic/authErrors";
import { authServerErrorText } from "../messages";

export function useSignOut() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setIsSigningOut(true);
    setError(null);
    try {
      await signOut();
      // No navigation here: the auth guard shows the login screen once the session is gone.
    } catch (caught) {
      setError(authServerErrorText(authErrorCode(caught)));
    } finally {
      setIsSigningOut(false);
    }
  }

  return { signOut: handleSignOut, isSigningOut, error };
}
