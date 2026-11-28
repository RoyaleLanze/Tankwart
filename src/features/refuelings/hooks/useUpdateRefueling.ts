import { updateRefueling } from "../api/refuelingsApi";
import { isRefuelingGone } from "../logic/saveError";
import { failedOutcome, type SaveOutcome } from "../logic/saveOutcome";
import { saveErrorText } from "../messages";
import type { RefuelingInput } from "../types";
import { useInvalidateRefuelings } from "./useRefuelings";

/**
 * Saves the edited values of one refueling and reports the result instead of throwing. The list
 * is loaded again after a save and also when the refueling no longer exists, so the list stops
 * showing it. Unlike creating there is no read-back and no offline queue (#107 covers new
 * refuelings only), so this is a plain function and not a keyed mutation.
 */
export function useUpdateRefueling(vehicleId: string, id: string) {
  const invalidateRefuelings = useInvalidateRefuelings(vehicleId);

  return async function save(input: RefuelingInput): Promise<SaveOutcome> {
    try {
      await updateRefueling(id, input);
      await invalidateRefuelings();
      return { status: "saved" };
    } catch (error) {
      if (isRefuelingGone(error)) await invalidateRefuelings();
      return failedOutcome(error, saveErrorText);
    }
  };
}
