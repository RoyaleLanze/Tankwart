import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { subscribeToSession } from "../api/authApi";

type SessionState = {
  session: Session | null;
  /** True until the session stored on the device has been read. */
  isLoading: boolean;
};

/** The current Supabase session. The auth guard in the root layout decides on it. */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ session: null, isLoading: true });

  useEffect(() => subscribeToSession((session) => setState({ session, isLoading: false })), []);

  return state;
}
