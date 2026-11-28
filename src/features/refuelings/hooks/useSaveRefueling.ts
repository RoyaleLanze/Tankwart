import { i18n } from "@/lib/i18n";

import { getRefueling } from "../api/refuelingsApi";
import { decideRetry, type ReadBack } from "../logic/retryDecision";
import { isAlreadySaved, saveErrorKind, saveFieldError } from "../logic/saveError";
import type { SaveOutcome } from "../logic/saveOutcome";
import { saveErrorText } from "../messages";
import type { RefuelingInput } from "../types";
import { useCreateRefueling } from "./createRefuelingMutation";
import { useInvalidateRefuelings } from "./useRefuelings";

/** Reads the row with this id; a failed read is a result, not an exception. */
async function readBack(id: string): Promise<ReadBack> {
  try {
    const row = await getRefueling(id);
    return row ? { kind: "found", row } : { kind: "notFound" };
  } catch {
    return { kind: "failed" };
  }
}

/**
 * Saves a new refueling with a fixed id and reports the result instead of throwing. If the id
 * already exists in the database although this form never got the answer (lost response), the
 * row is read back and compared with the input (decideRetry, ADR 0017). The list is loaded
 * again whenever the row exists, so it shows what is really stored.
 */
export function useSaveRefueling(vehicleId: string, id: string) {
  const { mutateAsync: createRefueling } = useCreateRefueling();
  const invalidateRefuelings = useInvalidateRefuelings(vehicleId);

  return async function save(input: RefuelingInput): Promise<SaveOutcome> {
    try {
      await createRefueling({ id, vehicleId, input });
      return { status: "saved" };
    } catch (error) {
      if (isAlreadySaved(error)) {
        const row = await readBack(id);
        const decision = decideRetry(row, vehicleId, input);
        if (row.kind === "found") await invalidateRefuelings();
        if (decision === "saved") return { status: "saved" };
        if (decision === "differs") {
          return { status: "differs", message: i18n.t("refuelingForm.savedButDiffers") };
        }
        if (decision === "network") return { status: "failed", message: saveErrorText("network") };
      }
      const fieldError = saveFieldError(error);
      if (fieldError) return { status: "fieldError", error: fieldError };
      return { status: "failed", message: saveErrorText(saveErrorKind(error)) };
    }
  };
}
