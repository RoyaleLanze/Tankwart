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
 * waiting for the server. Whatever the outcome, the server's value is reloaded afterwards:
 * it is the truth, so a failed save also brings the previous choice back.
 */
export function useSetActiveVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setActiveVehicleId,
    // Saves run one after another, so quick taps cannot reach the server in a different order.
    scope: { id: "activeVehicle" },
    onMutate: async (vehicleId) => {
      // A running load could otherwise overwrite the new choice with the old one.
      await queryClient.cancelQueries({ queryKey: ACTIVE_VEHICLE_ID_KEY });
      queryClient.setQueryData(ACTIVE_VEHICLE_ID_KEY, vehicleId);
    },
    // After a sign-out the cache is cleared and nothing observes the key, so there is nothing
    // to reload and the previous user's choice cannot reach the next user.
    onSettled: () => queryClient.invalidateQueries({ queryKey: ACTIVE_VEHICLE_ID_KEY }),
  });
}
