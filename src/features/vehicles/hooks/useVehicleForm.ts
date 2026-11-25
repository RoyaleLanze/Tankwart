import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type DefaultValues } from "react-hook-form";

import { vehicleSchema, type VehicleFormValues } from "../logic/vehicleSchema";
import { SAVE_ERROR_TEXT } from "../messages";
import type { VehicleInput } from "../types";

/** A new vehicle: every text field empty, no fuel type chosen. */
const EMPTY_FORM: DefaultValues<VehicleFormValues> = {
  name: "",
  initialOdometerKm: "",
  tankCapacityLiters: "",
  makeModel: "",
  licensePlate: "",
  consumptionLitersPer100Km: "",
};

/**
 * Form state for adding or editing a vehicle. The fields hold text; after validation, `save`
 * gets the vehicle in database units (ADR 0009).
 */
export function useVehicleForm(
  save: (input: VehicleInput) => Promise<unknown>,
  defaultValues = EMPTY_FORM,
) {
  const { control, handleSubmit, setError, setFocus, formState } = useForm<
    VehicleFormValues,
    unknown,
    VehicleInput
  >({ resolver: zodResolver(vehicleSchema), defaultValues });

  const submitValidForm = handleSubmit(async (input) => {
    try {
      await save(input);
    } catch {
      // The form keeps every value, so the user can try again without typing anything (M15).
      setError("root", { message: SAVE_ERROR_TEXT });
    }
  });

  return {
    control,
    setFocus,
    // Called without the press event: react-hook-form only needs it for web forms.
    submit: () => submitValidForm(),
    isSubmitting: formState.isSubmitting,
    /** Error from the server, shown above the button. */
    submitError: formState.errors.root?.message,
  };
}
