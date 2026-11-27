import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteRefueling, listRefuelings, updateRefueling } from "../api/refuelingsApi";
import type { RefuelingInput } from "../types";

/**
 * Cache key of one vehicle's refuelings (ADR 0008). Home, history and statistics all derive
 * from this one entry, so a change only has to update it.
 */
export function refuelingsKey(vehicleId: string | undefined) {
  return ["refuelings", vehicleId] as const;
}

/**
 * Refuelings of a vehicle, newest first. Without a vehicleId the query stays `pending` with
 * `fetchStatus: "idle"` (skipToken), so screens must use `isLoading`/`fetchStatus` instead of
 * `isPending`, and `refetch()` is not allowed then.
 */
export function useRefuelings(vehicleId: string | undefined) {
  return useQuery({
    queryKey: refuelingsKey(vehicleId),
    queryFn: vehicleId ? () => listRefuelings(vehicleId) : skipToken,
  });
}

/**
 * After a change the list is loaded again instead of edited in the cache: the server sorts it,
 * and after a sign-out during saving the cache is cleared, so there is nothing to refetch and
 * the next user never sees this vehicle's data. Returning the promise keeps the mutation
 * pending until the list is fresh, so a screen that goes back shows the new state.
 */
function useInvalidateRefuelings(vehicleId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: refuelingsKey(vehicleId) });
}

export function useUpdateRefueling(vehicleId: string) {
  const onSuccess = useInvalidateRefuelings(vehicleId);
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RefuelingInput }) =>
      updateRefueling(id, input),
    onSuccess,
  });
}

export function useDeleteRefueling(vehicleId: string) {
  const onSuccess = useInvalidateRefuelings(vehicleId);
  return useMutation({ mutationFn: deleteRefueling, onSuccess });
}
