import { useMutation, useQueryClient } from "@tanstack/react-query";

import { refuelingsKey } from "@/features/refuelings/hooks/useRefuelings";

import { deleteVehicle } from "../api/vehiclesApi";
import type { Vehicle } from "../types";
import { ACTIVE_VEHICLE_ID_KEY } from "./useActiveVehicle";
import { VEHICLES_KEY } from "./useVehicles";

/**
 * Deletes a vehicle with its refuelings. Removing the last one empties the list, and the root
 * guard then leads to the onboarding (M1). The cache mirrors what the database does, so no
 * reload is needed.
 */
export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVehicle,
    onSuccess: async (_, id) => {
      // A running reload would otherwise overwrite the patches below and bring the vehicle back.
      await Promise.all([
        queryClient.cancelQueries({ queryKey: VEHICLES_KEY }),
        queryClient.cancelQueries({ queryKey: ACTIVE_VEHICLE_ID_KEY }),
      ]);
      queryClient.setQueryData<Vehicle[]>(VEHICLES_KEY, (vehicles) =>
        vehicles?.filter((vehicle) => vehicle.id !== id),
      );
      // The database clears profiles.active_vehicle_id (ON DELETE SET NULL);
      // pickActiveVehicle then falls back to another vehicle.
      queryClient.setQueryData<string | null>(ACTIVE_VEHICLE_ID_KEY, (activeId) =>
        activeId === id ? null : activeId,
      );
      // The database deleted the refuelings (ON DELETE CASCADE); drop the cached ones.
      queryClient.removeQueries({ queryKey: refuelingsKey(id) });
    },
  });
}
