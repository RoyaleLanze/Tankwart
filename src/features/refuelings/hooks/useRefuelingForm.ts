import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useForm,
  useWatch,
  type Control,
  type UseFormClearErrors,
  type UseFormHandleSubmit,
  type UseFormSetError,
} from "react-hook-form";

import { todayIsoDate } from "@/lib/today";
import type { Vehicle } from "@/features/vehicles/types";

import {
  computedAmount,
  createRefuelingFormSchema,
  formFieldOf,
  odometerWarning,
} from "../logic/formSchema";
import type { RefuelingFormValues } from "../logic/formValues";
import { withoutRefueling, type RefuelingContext } from "../logic/rules";
import { formStateOf, type SaveOutcome } from "../logic/saveOutcome";
import type { Refueling, RefuelingInput } from "../types";

/** What the validation rules need: the vehicle and its other refuelings. */
function useRefuelingContext(vehicle: Vehicle, refuelings: readonly Refueling[], id: string) {
  return useMemo<RefuelingContext>(
    () => ({
      today: todayIsoDate,
      tankCapacityMl: vehicle.tankCapacityMl,
      initialOdometerKm: vehicle.initialOdometerKm,
      otherRefuelings: withoutRefueling(refuelings, id),
    }),
    [vehicle, refuelings, id],
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
        const state = formStateOf(await save(input));
        saved = state.saved;
        if (state.error) {
          const { name, message, shouldFocus } = state.error;
          setError(name, { message }, { shouldFocus });
        }
      })();
    } finally {
      isSaving.current = false;
    }
    return saved;
  };
}

/**
 * Watches the amount fields and the odometer; re-renders on every change, so the computed amount
 * and the odometer warning follow the typing.
 */
function useComputedAmount(
  control: Control<RefuelingFormValues, unknown, RefuelingInput>,
  clearErrors: UseFormClearErrors<RefuelingFormValues>,
) {
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
  return { computed, odometerKm };
}

/** What distinguishes adding from editing: which row, what the fields start with, how to save. */
export type RefuelingFormSource = {
  /** Fixed for the life of the form; the rules leave this refueling out of the comparison. */
  id: string;
  /** Read once, when the form opens. */
  defaultValues: RefuelingFormValues;
  save: (input: RefuelingInput) => Promise<SaveOutcome>;
};

/**
 * Form state for adding or editing a refueling (M3, M4); `source` says which. The fields hold
 * text; after validation `source.save` gets a `RefuelingInput` in database units. The rules need
 * the vehicle and its other refuelings, so the caller loads them first.
 */
export function useRefuelingForm(
  vehicle: Vehicle,
  refuelings: readonly Refueling[],
  { id, defaultValues: startValues, save }: RefuelingFormSource,
) {
  const [defaultValues] = useState(startValues);
  const context = useRefuelingContext(vehicle, refuelings, id);
  const resolver = useMemo(() => zodResolver(createRefuelingFormSchema(context)), [context]);

  const { control, handleSubmit, setError, setFocus, clearErrors, formState } = useForm<
    RefuelingFormValues,
    unknown,
    RefuelingInput
  >({ resolver, defaultValues });
  const { computed, odometerKm } = useComputedAmount(control, clearErrors);

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
