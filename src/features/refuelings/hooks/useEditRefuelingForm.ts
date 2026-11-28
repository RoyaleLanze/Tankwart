import type { Vehicle } from "@/features/vehicles/types";

import { formValuesOf } from "../logic/formValues";
import type { Refueling } from "../types";
import { useRefuelingForm } from "./useRefuelingForm";
import { useUpdateRefueling } from "./useUpdateRefueling";

/**
 * The form for a stored refueling: starts with its values and updates the same row. No draft
 * (the stored row is the starting point) and no read-back (updating the same values twice is
 * harmless).
 */
export function useEditRefuelingForm(
  vehicle: Vehicle,
  refuelings: readonly Refueling[],
  refueling: Refueling,
) {
  const save = useUpdateRefueling(vehicle.id, refueling.id);
  return useRefuelingForm(vehicle, refuelings, {
    id: refueling.id,
    defaultValues: formValuesOf(refueling),
    save,
  });
}
