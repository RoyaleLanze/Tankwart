import { useMutation } from "@tanstack/react-query";

import { deleteRefueling } from "../api/refuelingsApi";
import { DELETE_ERROR_TEXT } from "../messages";
import { useInvalidateRefuelings } from "./useRefuelings";

/**
 * Deletes a refueling of the vehicle and loads the list again, so the list drops it. Deleting a
 * refueling that is already gone counts as deleted (deleteRefueling). `remove(id, { onSuccess })`
 * lets the screen leave once the list is fresh; `errorText` is null unless the last try failed.
 */
export function useDeleteRefueling(vehicleId: string) {
  const onSuccess = useInvalidateRefuelings(vehicleId);
  const mutation = useMutation({ mutationFn: deleteRefueling, onSuccess });

  return {
    remove: mutation.mutate,
    isDeleting: mutation.isPending,
    errorText: mutation.isError ? DELETE_ERROR_TEXT : null,
    reset: mutation.reset,
  };
}
