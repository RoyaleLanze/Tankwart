import { useCallback, useEffect, useState } from "react";

import { loadSession, subscribeToSessionChanges } from "../api/authApi";
import { sessionStatus, type SessionStatus } from "../logic/sessionStatus";

export type SessionState = {
  /** "loading" until the stored session has been read and, if it had expired, renewed. */
  status: SessionStatus | "loading";
  /** Reads the stored session again, for "Erneut versuchen" when the server was unreachable. */
  retry: () => void;
};

/** The state of the Supabase session. The auth guard in the root layout decides on it. */
export function useSession(): SessionState {
  const [status, setStatus] = useState<SessionState["status"]>("loading");

  const read = useCallback(() => {
    loadSession().then(
      (session) => setStatus(sessionStatus(session)),
      (error: unknown) => setStatus(sessionStatus(null, error)),
    );
  }, []);

  useEffect(() => {
    read();
    return subscribeToSessionChanges((session) => setStatus(sessionStatus(session)));
  }, [read]);

  const retry = useCallback(() => {
    setStatus("loading");
    read();
  }, [read]);

  return { status, retry };
}
