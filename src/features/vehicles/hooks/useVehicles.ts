import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createVehicle, listVehicles, updateVehicle } from "../api/vehiclesApi";
import type { Vehicle, VehicleInput } from "../types";

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

/** Saves the edited values of one vehicle; the list keeps its order. */
export function useUpdateVehicle(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: VehicleInput) => updateVehicle(id, input),
    // Same as creating: the stored vehicle replaces the old one, only in a list still cached.
    onSuccess: (updated) =>
      queryClient.setQueryData<Vehicle[]>(VEHICLES_KEY, (vehicles) =>
        vehicles?.map((vehicle) => (vehicle.id === updated.id ? updated : vehicle)),
      ),
    // The list may be out of date, e.g. the vehicle was deleted on another device. Reloading it
    // lets the edit screen show that, instead of failing again with the same error.
    onError: () => queryClient.invalidateQueries({ queryKey: VEHICLES_KEY }),
  });
}
