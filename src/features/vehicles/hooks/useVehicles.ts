import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createVehicle, listVehicles } from "../api/vehiclesApi";
import type { Vehicle } from "../types";

/** Cache key of the vehicle list (ADR 0008). Every change to a vehicle updates this entry. */
export const VEHICLES_KEY = ["vehicles"] as const;

/**
 * The signed-in user's vehicles. Loaded once and then served from the cache, so every screen
 * that calls this hook shares one request and one result. `enabled: false` waits for sign-in.
 */
export function useVehicles({ enabled = true } = {}) {
  return useQuery({ queryKey: VEHICLES_KEY, queryFn: listVehicles, enabled });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVehicle,
    // The API returns the stored vehicle, so it is added to the cache without a new request.
    // Only if the list is still cached: after a sign-out during saving the cache is cleared,
    // and the vehicle must not be shown to the next user.
    onSuccess: (vehicle) =>
      queryClient.setQueryData<Vehicle[]>(
        VEHICLES_KEY,
        (vehicles) => vehicles && [...vehicles, vehicle],
      ),
  });
}
