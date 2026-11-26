import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import { useForm, type DefaultValues } from "react-hook-form";

import { vehicleSchema, vehicleToFormValues, type VehicleFormValues } from "../logic/vehicleSchema";
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
 * gets the vehicle in database units (ADR 0009). When editing, `stored` is the vehicle whose
 * values the form starts with; react-hook-form reads them only once.
 */
export function useVehicleForm(
  save: (input: VehicleInput) => Promise<unknown>,
  stored?: VehicleInput,
) {
  const { control, handleSubmit, setError, setFocus, formState } = useForm<
    VehicleFormValues,
    unknown,
    VehicleInput
  >({
    resolver: zodResolver(vehicleSchema),
    defaultValues: stored ? vehicleToFormValues(stored) : EMPTY_FORM,
  });

  // react-hook-form does not block a second submit while the first one runs. The keyboard's
  // action key can still submit while the button is disabled, which would save twice.
  const isSaving = useRef(false);

  const submitValidForm = handleSubmit(async (input) => {
    try {
      await save(input);
    } catch {
      // The form keeps every value, so the user can try again without typing anything (M15).
      setError("root", { message: SAVE_ERROR_TEXT });
    }
  });

  async function submit() {
    if (isSaving.current) return;
    isSaving.current = true;
    try {
      // Called without the press event: react-hook-form only needs it for web forms.
      await submitValidForm();
    } finally {
      isSaving.current = false;
    }
  }

  return {
    control,
    setFocus,
    submit,
    isSubmitting: formState.isSubmitting,
    /** Error from the server, shown above the button. */
    submitError: formState.errors.root?.message,
  };
}
