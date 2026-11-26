import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getActiveVehicleId, setActiveVehicleId } from "../api/profileApi";
import { pickActiveVehicle } from "../logic/activeVehicle";
import type { Vehicle } from "../types";
import { useVehicles } from "./useVehicles";

/** Cache key of the stored choice (ADR 0008). The vehicle itself comes from the vehicle list. */
export const ACTIVE_VEHICLE_ID_KEY = ["activeVehicleId"] as const;

/** The stored choice. `enabled: false` waits for sign-in, like useVehicles. */
export function useActiveVehicleId({ enabled = true } = {}) {
  return useQuery({ queryKey: ACTIVE_VEHICLE_ID_KEY, queryFn: getActiveVehicleId, enabled });
}

/**
 * The vehicle all screens refer to (M2). The root layout loads vehicles and choice before it
 * shows the main screens, so there it is only undefined while signed out.
 */
export function useActiveVehicle(): Vehicle | undefined {
  const vehicles = useVehicles();
  const activeVehicleId = useActiveVehicleId();
  if (vehicles.data === undefined || activeVehicleId.data === undefined) return undefined;
  return pickActiveVehicle(vehicles.data, activeVehicleId.data);
}

/**
 * Switches the active vehicle. The cache changes at once, so the screens switch without
 * waiting for the server; if saving fails, the previous choice comes back.
 */
export function useSetActiveVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setActiveVehicleId,
    onMutate: async (vehicleId) => {
      // A running load could otherwise overwrite the new choice with the old one.
      await queryClient.cancelQueries({ queryKey: ACTIVE_VEHICLE_ID_KEY });
      const previous = queryClient.getQueryData<string | null>(ACTIVE_VEHICLE_ID_KEY);
      queryClient.setQueryData(ACTIVE_VEHICLE_ID_KEY, vehicleId);
      return { previous };
    },
    // Only while the cache still holds this choice: after a sign-out the cache is cleared, and
    // the previous user's vehicle must not reach the next user.
    onError: (_error, vehicleId, context) =>
      queryClient.setQueryData<string | null>(ACTIVE_VEHICLE_ID_KEY, (current) =>
        current === vehicleId ? context?.previous : current,
      ),
  });
}
