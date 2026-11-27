import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { clearDraft, loadDraft, saveDraft } from "../api/draftStorage";
import { createDraft, DRAFT_SAVE_DELAY_MS, hasUserInput } from "../logic/draft";
import type { RefuelingFormValues } from "../logic/formValues";

/**
 * The draft of a new refueling (M15), one per user and vehicle. `restored` is read once on
 * mount, so the screen must mount the hook again for another user or vehicle (e.g. with
 * `key={vehicleId}`). `save` writes after a pause in typing; a pending write is flushed at
 * once when the app goes to the background or the form unmounts, because the process may be
 * killed after that. Values without any user input delete the draft instead of storing it.
 */
export function useRefuelingDraft(userId: string, vehicleId: string) {
  const [restored] = useState(() => loadDraft(userId, vehicleId)?.values ?? null);
  const pending = useRef<RefuelingFormValues | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const values = pending.current;
    if (!values) return;
    if (!hasUserInput(values)) {
      clearDraft(userId, vehicleId);
      pending.current = null;
    } else if (saveDraft(userId, vehicleId, createDraft(values))) {
      pending.current = null; // on failure it stays, the next flush tries again
    }
  }, [userId, vehicleId]);

  const save = useCallback(
    (values: RefuelingFormValues) => {
      pending.current = values;
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, DRAFT_SAVE_DELAY_MS);
    },
    [flush],
  );

  const clear = useCallback(() => {
    clearTimeout(timer.current);
    pending.current = null;
    clearDraft(userId, vehicleId);
  }, [userId, vehicleId]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") flush();
    });
    return () => {
      subscription.remove();
      flush();
    };
  }, [flush]);

  return { restored, save, clear };
}
