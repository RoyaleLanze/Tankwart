import { useQueryClient } from "@tanstack/react-query";

import { getRefueling } from "../api/refuelingsApi";
import {
  isAlreadySaved,
  saveErrorKind,
  saveFieldError,
  type SaveFieldError,
} from "../logic/saveError";
import { saveErrorText } from "../messages";
import type { RefuelingInput } from "../types";
import { useCreateRefueling } from "./createRefuelingMutation";
import { refuelingsKey } from "./useRefuelings";

/** How one save attempt ended; the form turns it into what the user sees. */
export type SaveOutcome =
  | { status: "saved" }
  | { status: "fieldError"; error: SaveFieldError }
  | { status: "failed"; message: string };

/** Whether the row with this id exists, i.e. an earlier attempt went through unnoticed. */
async function rowExists(id: string): Promise<boolean> {
  try {
    return (await getRefueling(id)) !== null;
  } catch {
    // Cannot tell, so the original error counts: the user may retry with the same id.
    return false;
  }
}

/**
 * Saves a new refueling with a fixed id and reports the result instead of throwing. If the id
 * already exists in the database although this form never got the answer (lost response), the
 * refueling is saved: the list is loaded again and the outcome is "saved" (ADR 0017).
 */
export function useSaveRefueling(vehicleId: string, id: string) {
  const { mutateAsync: createRefueling } = useCreateRefueling();
  const queryClient = useQueryClient();

  return async function save(input: RefuelingInput): Promise<SaveOutcome> {
    try {
      await createRefueling({ id, vehicleId, input });
      return { status: "saved" };
    } catch (error) {
      if (isAlreadySaved(error) && (await rowExists(id))) {
        await queryClient.invalidateQueries({ queryKey: refuelingsKey(vehicleId) });
        return { status: "saved" };
      }
      const fieldError = saveFieldError(error);
      if (fieldError) return { status: "fieldError", error: fieldError };
      return { status: "failed", message: saveErrorText(saveErrorKind(error)) };
    }
  };
}
