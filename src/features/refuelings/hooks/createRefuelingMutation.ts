import { type QueryClient, useMutation } from "@tanstack/react-query";

import { createRefueling } from "../api/refuelingsApi";
import type { Refueling, RefuelingInput } from "../types";
import { refuelingsKey } from "./useRefuelings";

/** Identifies the mutation, so the defaults below (and later offline resume, #107) find it. */
export const CREATE_REFUELING_MUTATION_KEY = ["refuelings", "create"] as const;

/**
 * Everything one attempt needs, and nothing from the screen: a mutation that was paused or
 * stored for later can only run again from its variables. `id` is a UUID created by the client
 * once per refueling, so a repeated attempt does not create a second row.
 */
export type CreateRefuelingVariables = {
  id: string;
  vehicleId: string;
  input: RefuelingInput;
};

/**
 * Registers the function that saves a refueling. It lives on the QueryClient instead of in a
 * closure in the screen, so it still exists when the screen is gone. After saving, the list is
 * loaded again (see useInvalidateRefuelings in useRefuelings.ts); returning the promise keeps
 * the mutation pending until then.
 */
export function registerCreateRefuelingDefaults(queryClient: QueryClient): void {
  queryClient.setMutationDefaults(CREATE_REFUELING_MUTATION_KEY, {
    mutationFn: ({ id, vehicleId, input }: CreateRefuelingVariables) =>
      createRefueling(id, vehicleId, input),
    onSuccess: (_refueling, { vehicleId }) =>
      queryClient.invalidateQueries({ queryKey: refuelingsKey(vehicleId) }),
  });
}

/**
 * Saves a new refueling: `mutateAsync({ id, vehicleId, input })`. Callers must not pass their
 * own `onSuccess`: it would replace the one from the defaults, and the list would no longer be
 * loaded again after saving.
 */
export function useCreateRefueling() {
  return useMutation<Refueling, Error, CreateRefuelingVariables>({
    mutationKey: CREATE_REFUELING_MUTATION_KEY,
  });
}
