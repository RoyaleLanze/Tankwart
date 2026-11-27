import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { clearDraft, loadDraft, saveDraft } from "../api/draftStorage";
import { createDraft, DRAFT_SAVE_DELAY_MS } from "../logic/draft";
import type { RefuelingFormValues } from "../logic/formValues";

/**
 * The draft of a new refueling (M15). Loaded once on mount; `restored` is the stored values if
 * they belong to this vehicle (a draft for another vehicle stays untouched), else null.
 * `save` writes after a pause in typing; a pending write is flushed at once when the app goes
 * to the background or the form unmounts, because the process may be killed after that.
 */
export function useRefuelingDraft(userId: string, vehicleId: string) {
  const [restored] = useState<RefuelingFormValues | null>(() => {
    const draft = loadDraft(userId);
    return draft?.vehicleId === vehicleId ? draft.values : null;
  });
  const pending = useRef<RefuelingFormValues | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    if (pending.current) saveDraft(userId, createDraft(vehicleId, pending.current));
    pending.current = null;
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
    clearDraft(userId);
  }, [userId]);

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
