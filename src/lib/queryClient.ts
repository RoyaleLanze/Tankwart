import { QueryClient } from "@tanstack/react-query";

/**
 * Cache for all server data (ADR 0008), shared by every screen. No retries for queries:
 * supabase-js already retries a failed GET three times (1, 2 and 4 s). With TanStack's own
 * three retries on top, the error state took 35 s to appear when offline.
 *
 * Mutations that must outlive their screen (saving a refueling, #107) are registered on the
 * client by the root layout with `setMutationDefaults`, so they are not tied to a component.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}
