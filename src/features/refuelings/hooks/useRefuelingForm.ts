import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { newId } from "@/lib/id";
import { todayIsoDate } from "@/lib/today";
import type { Vehicle } from "@/features/vehicles/types";

import {
  computedAmount,
  createRefuelingFormSchema,
  defaultFormValues,
  formFieldOf,
  odometerWarning,
} from "../logic/formSchema";
import type { RefuelingFormValues } from "../logic/formValues";
import type { RefuelingContext } from "../logic/rules";
import { saveErrorKind, saveFieldError } from "../logic/saveError";
import { saveErrorText } from "../messages";
import type { Refueling, RefuelingInput } from "../types";
import { useCreateRefueling } from "./createRefuelingMutation";

/**
 * Form state for adding a refueling (M3, M4). The fields hold text; after validation the
 * mutation gets a `RefuelingInput` in database units. The rules need the vehicle and its other
 * refuelings, so the caller loads them first. `onSaved` runs once the save went through.
 */
export function useRefuelingForm(
  vehicle: Vehicle,
  refuelings: readonly Refueling[],
  onSaved: () => void,
) {
  const { mutateAsync: createRefueling } = useCreateRefueling();
  // One id per form: a retry after a failed attempt sends the same one (ADR 0017).
  const [id] = useState(newId);
  const [defaultValues] = useState(() => defaultFormValues(todayIsoDate()));

  const context = useMemo<RefuelingContext>(
    () => ({
      today: todayIsoDate,
      tankCapacityMl: vehicle.tankCapacityMl,
      initialOdometerKm: vehicle.initialOdometerKm,
      otherRefuelings: refuelings,
    }),
    [vehicle, refuelings],
  );
  const resolver = useMemo(() => zodResolver(createRefuelingFormSchema(context)), [context]);

  const { control, handleSubmit, setError, setFocus, formState } = useForm<
    RefuelingFormValues,
    unknown,
    RefuelingInput
  >({ resolver, defaultValues });
  // Re-renders on every change: the computed amount and the warning follow the typing.
  const [volumeLiters, pricePerLiter, totalEuros, odometerKm] = useWatch({
    control,
    name: ["volumeLiters", "pricePerLiter", "totalEuros", "odometerKm"],
  });

  // react-hook-form does not block a second submit while the first one runs; the keyboard's
  // action key can still submit while the button is disabled.
  const isSaving = useRef(false);

  const submitValidForm = handleSubmit(async (input) => {
    try {
      await createRefueling({ id, vehicleId: vehicle.id, input });
    } catch (error) {
      // The form keeps every value, so the user can try again without typing anything (M15).
      const fieldError = saveFieldError(error);
      if (fieldError) {
        setError(formFieldOf(fieldError.field), { message: fieldError.code });
      } else {
        setError("root", { message: saveErrorText(saveErrorKind(error)) });
      }
      return;
    }
    onSaved();
  });

  async function submit() {
    if (isSaving.current) return;
    isSaving.current = true;
    try {
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
    /** Error that belongs to no field (rejected or not reached), shown above the button. */
    submitError: formState.errors.root?.message,
    /** The empty one of volume, price and total once the other two allow computing it. */
    computed: computedAmount({ volumeLiters, pricePerLiter, totalEuros }),
    /** Warning for the odometer; does not block saving. */
    odometerWarning: odometerWarning({ odometerKm }, context),
  };
}
