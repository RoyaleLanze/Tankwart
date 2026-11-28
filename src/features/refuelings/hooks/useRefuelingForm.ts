import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch, type UseFormHandleSubmit, type UseFormSetError } from "react-hook-form";

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
import type { Refueling, RefuelingInput } from "../types";
import { useSaveRefueling, type SaveOutcome } from "./useSaveRefueling";

/** What the validation rules need: the vehicle and its other refuelings. */
function useRefuelingContext(vehicle: Vehicle, refuelings: readonly Refueling[]) {
  return useMemo<RefuelingContext>(
    () => ({
      today: todayIsoDate,
      tankCapacityMl: vehicle.tankCapacityMl,
      initialOdometerKm: vehicle.initialOdometerKm,
      otherRefuelings: refuelings,
    }),
    [vehicle, refuelings],
  );
}

type Form = {
  handleSubmit: UseFormHandleSubmit<RefuelingFormValues, RefuelingInput>;
  setError: UseFormSetError<RefuelingFormValues>;
};

/**
 * Returns `submit`: validates and saves, and resolves to true if the refueling is saved, so the
 * caller can leave. A rejected save becomes a field error or an error above the button.
 */
function useSubmit(
  { handleSubmit, setError }: Form,
  save: (i: RefuelingInput) => Promise<SaveOutcome>,
) {
  // react-hook-form does not block a second submit while the first one runs: two taps in the
  // same frame both see isSubmitting as false, so this ref lets only the first one through.
  const isSaving = useRef(false);

  return async function submit(): Promise<boolean> {
    if (isSaving.current) return false;
    isSaving.current = true;
    let saved = false;
    try {
      await handleSubmit(async (input) => {
        const outcome = await save(input);
        saved = outcome.status === "saved";
        // The form keeps every value, so the user can try again without typing anything (M15).
        if (outcome.status === "fieldError") {
          const { field, code } = outcome.error;
          setError(formFieldOf(field), { message: code }, { shouldFocus: true });
        } else if (outcome.status === "failed") {
          setError("root", { message: outcome.message });
        }
      })();
    } finally {
      isSaving.current = false;
    }
    return saved;
  };
}

/**
 * Form state for adding a refueling (M3, M4). The fields hold text; after validation the
 * mutation gets a `RefuelingInput` in database units. The rules need the vehicle and its other
 * refuelings, so the caller loads them first.
 */
export function useRefuelingForm(vehicle: Vehicle, refuelings: readonly Refueling[]) {
  // One id per form: a retry after a failed attempt sends the same one (ADR 0017).
  const [id] = useState(newId);
  const [defaultValues] = useState(() => defaultFormValues(todayIsoDate()));
  const context = useRefuelingContext(vehicle, refuelings);
  const resolver = useMemo(() => zodResolver(createRefuelingFormSchema(context)), [context]);

  const { control, handleSubmit, setError, setFocus, clearErrors, formState } = useForm<
    RefuelingFormValues,
    unknown,
    RefuelingInput
  >({ resolver, defaultValues });
  // Re-renders on every change: the computed amount and the warning follow the typing.
  const [volumeLiters, pricePerLiter, totalEuros, odometerKm] = useWatch({
    control,
    name: ["volumeLiters", "pricePerLiter", "totalEuros", "odometerKm"],
  });

  const computed = computedAmount({ volumeLiters, pricePerLiter, totalEuros });
  // The field shows its computed value instead of a "missing" error from an earlier save attempt.
  const computedField = computed?.field;
  useEffect(() => {
    if (computedField) clearErrors(formFieldOf(computedField));
  }, [computedField, clearErrors]);

  const save = useSaveRefueling(vehicle.id, id);
  const submit = useSubmit({ handleSubmit, setError }, save);

  return {
    control,
    setFocus,
    submit,
    isSubmitting: formState.isSubmitting,
    /** Error that belongs to no field (rejected or not reached), shown above the button. */
    submitError: formState.errors.root?.message,
    /** The empty one of volume, price and total once the other two allow computing it. */
    computed,
    /** Warning for the odometer; does not block saving. */
    odometerWarning: odometerWarning({ odometerKm }, context),
  };
}
