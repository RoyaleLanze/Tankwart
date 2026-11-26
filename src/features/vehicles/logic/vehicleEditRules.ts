// Checks a vehicle edit against the vehicle's existing refuelings (M4, issue #78). The vehicle
// schema only validates the vehicle on its own; these rules need the refuelings, so the caller
// passes them in. Errors are codes (ADR 0014), keyed by the form field they belong to.
import { maxVolumeMl } from "@/features/refuelings/logic/rules";
import type { Refueling } from "@/features/refuelings/types";

import type { VehicleInput } from "../types";
import type { VehicleErrorCode } from "./vehicleSchema";

export type EditedVehicle = Pick<VehicleInput, "initialOdometerKm" | "tankCapacityMl">;
export type EditCheckRefueling = Pick<Refueling, "odometerKm" | "volumeMl">;

/** Form field names, as in `VehicleFormValues`. */
export type VehicleEditErrors = {
  initialOdometerKm?: VehicleErrorCode;
  tankCapacityLiters?: VehicleErrorCode;
};

/**
 * Errors for fields whose new value would make an existing refueling invalid: an initial
 * odometer above the lowest refueling odometer, or a tank in which a refueling would be
 * above 110 %. Values equal to the limit are fine, like in the refueling rules.
 */
export function vehicleEditErrors(
  vehicle: EditedVehicle,
  refuelings: readonly EditCheckRefueling[],
): VehicleEditErrors {
  const errors: VehicleEditErrors = {};
  if (refuelings.some((r) => r.odometerKm < vehicle.initialOdometerKm)) {
    errors.initialOdometerKm = "initialOdometerAboveRefueling";
  }
  const maxMl = maxVolumeMl(vehicle.tankCapacityMl);
  if (refuelings.some((r) => r.volumeMl > maxMl)) {
    errors.tankCapacityLiters = "tankCapacityBelowRefueling";
  }
  return errors;
}
