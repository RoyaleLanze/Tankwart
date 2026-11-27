// The draft of a new refueling (M15, ADR 0010): what is stored while the form is open.
// Pure functions; reading and writing is in api/draftStorage.ts. The vehicle is part of the
// storage key, not of the draft.
import { z } from "zod";

import { refuelingFormValuesSchema, type RefuelingFormValues } from "./formValues";

/** Raise when the form values change shape, so old drafts are dropped instead of misread. */
export const DRAFT_VERSION = 1;

/** Pause after the last keystroke before the draft is written. */
export const DRAFT_SAVE_DELAY_MS = 500;

const draftSchema = z.object({
  version: z.literal(DRAFT_VERSION),
  // Unknown extra fields are dropped when reading.
  values: refuelingFormValuesSchema,
});

export type RefuelingDraft = z.infer<typeof draftSchema>;

export function createDraft(values: RefuelingFormValues): RefuelingDraft {
  return { version: DRAFT_VERSION, values };
}

export function serializeDraft(draft: RefuelingDraft): string {
  return JSON.stringify(draft);
}

/** Never throws: nothing stored, broken JSON, another version or wrong shape give null. */
export function parseDraft(raw: string | null): RefuelingDraft | null {
  if (raw === null) return null;
  try {
    const result = draftSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * True once the user typed into a field that starts empty. Date and the switches are left out:
 * the form gives them default values, so they alone are no reason to keep a draft.
 */
export function hasUserInput(values: RefuelingFormValues): boolean {
  return [
    values.volumeLiters,
    values.pricePerLiter,
    values.totalEuros,
    values.odometerKm,
    values.stationName,
    values.note,
  ].some((text) => text.trim() !== "");
}
