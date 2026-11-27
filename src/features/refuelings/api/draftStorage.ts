// The only place that reads and writes the refueling draft (ADR 0010). localStorage is global
// once src/lib/supabase.ts has installed it. One key per user and vehicle: another account on
// the device does not see the draft, and a draft for one vehicle never overwrites another's.
import { parseDraft, serializeDraft, type RefuelingDraft } from "../logic/draft";

export const DRAFT_KEY_PREFIX = "refueling-draft:";

const keyFor = (userId: string, vehicleId: string) => `${DRAFT_KEY_PREFIX}${userId}:${vehicleId}`;

export function loadDraft(userId: string, vehicleId: string): RefuelingDraft | null {
  try {
    return parseDraft(localStorage.getItem(keyFor(userId, vehicleId)));
  } catch (error) {
    console.warn("Draft could not be loaded", error);
    return null;
  }
}

/**
 * A failed write (storage full or broken) is only logged: losing the draft is bad, but a
 * crash while the user types would be worse. Returns whether the draft was written.
 */
export function saveDraft(userId: string, vehicleId: string, draft: RefuelingDraft): boolean {
  try {
    localStorage.setItem(keyFor(userId, vehicleId), serializeDraft(draft));
    return true;
  } catch (error) {
    console.warn("Draft could not be saved", error);
    return false;
  }
}

export function clearDraft(userId: string, vehicleId: string): void {
  try {
    localStorage.removeItem(keyFor(userId, vehicleId));
  } catch (error) {
    console.warn("Draft could not be cleared", error);
  }
}
