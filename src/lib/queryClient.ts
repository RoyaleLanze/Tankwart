import { QueryClient } from "@tanstack/react-query";

import { registerCreateRefuelingDefaults } from "@/features/refuelings/hooks/createRefuelingMutation";

/**
 * Cache for all server data (ADR 0008), shared by every screen. No retries for queries:
 * supabase-js already retries a failed GET three times (1, 2 and 4 s). With TanStack's own
 * three retries on top, the error state took 35 s to appear when offline.
 *
 * Mutations that must outlive their screen (saving a refueling, ADR 0008, #107) register their
 * function here with `setMutationDefaults`, so it is not tied to a mounted component.
 */
export function createQueryClient(): QueryClient {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  registerCreateRefuelingDefaults(queryClient);
  return queryClient;
}
