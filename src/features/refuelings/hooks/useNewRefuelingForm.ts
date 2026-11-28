import { useState } from "react";

import { newId } from "@/lib/id";
import { todayIsoDate } from "@/lib/today";
import type { Vehicle } from "@/features/vehicles/types";

import { defaultFormValues } from "../logic/formSchema";
import type { Refueling } from "../types";
import { useRefuelingForm } from "./useRefuelingForm";
import { useSaveRefueling } from "./useSaveRefueling";

/** The form for a new refueling: today's date, empty amounts, saved under a fresh id. */
export function useNewRefuelingForm(vehicle: Vehicle, refuelings: readonly Refueling[]) {
  // One id per form: a retry after a failed attempt sends the same one (ADR 0017).
  const [id] = useState(newId);
  const save = useSaveRefueling(vehicle.id, id);
  return useRefuelingForm(vehicle, refuelings, {
    id,
    defaultValues: defaultFormValues(todayIsoDate()),
    save,
  });
}
