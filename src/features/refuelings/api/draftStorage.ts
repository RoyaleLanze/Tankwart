// The only place that reads and writes the refueling draft (ADR 0010). localStorage is global
// once src/lib/supabase.ts has installed it. One key per user, so another account on the same
// device never sees the draft.
import { parseDraft, serializeDraft, type RefuelingDraft } from "../logic/draft";

export const DRAFT_KEY_PREFIX = "refueling-draft:";

const keyFor = (userId: string) => `${DRAFT_KEY_PREFIX}${userId}`;

export function loadDraft(userId: string): RefuelingDraft | null {
  try {
    return parseDraft(localStorage.getItem(keyFor(userId)));
  } catch {
    return null;
  }
}

/**
 * A failed write (storage full or broken) is only logged: losing the draft is bad, but a
 * crash while the user types would be worse. Returns whether the draft was written.
 */
export function saveDraft(userId: string, draft: RefuelingDraft): boolean {
  try {
    localStorage.setItem(keyFor(userId), serializeDraft(draft));
    return true;
  } catch (error) {
    console.warn("Draft could not be saved", error);
    return false;
  }
}

export function clearDraft(userId: string): void {
  try {
    localStorage.removeItem(keyFor(userId));
  } catch (error) {
    console.warn("Draft could not be cleared", error);
  }
}
