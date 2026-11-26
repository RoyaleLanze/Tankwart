import { skipToken, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { searchStations, type StationsError } from "../api/stationsApi";
import { sortStations, type StationSortOrder } from "../logic/sortStations";
import type { FuelType, StationList, StationSearch } from "../types";

/** Prefix of every station list in the cache (ADR 0008). */
export const STATIONS_KEY = ["stations"] as const;

/** One cache entry per position and radius; the fuel type only changes the order. */
export function stationsKey(search: StationSearch | null) {
  if (!search) return STATIONS_KEY;
  return [...STATIONS_KEY, search.position.lat, search.position.lng, search.radiusKm] as const;
}

type ListOrder = { fuelType: FuelType; sortOrder: StationSortOrder };

/**
 * Stations around the searched position, sorted for the chosen fuel. Prices are only requested
 * on a user action (M9, Tankerkönig's terms): with `search` null nothing loads, and a result is
 * never refetched on its own. A new search (position, radius) or `refetch()` asks again.
 * `refetch()` is only valid while `search` is set: with `skipToken` it rejects.
 */
export function useStations(search: StationSearch | null, { fuelType, sortOrder }: ListOrder) {
  // Sorting in `select` runs on the cached list, so switching fuel or order needs no request.
  const sortList = useCallback(
    (list: StationList): StationList => ({
      ...list,
      stations: sortStations(list.stations, fuelType, sortOrder),
    }),
    [fuelType, sortOrder],
  );
  return useQuery<StationList, StationsError>({
    queryKey: stationsKey(search),
    queryFn: search ? () => searchStations(search) : skipToken,
    select: sortList,
    // Never stale and no automatic request of any kind: not on mount (also not a retry of a
    // failed search when the screen is mounted again), focus or reconnect. Every request counts
    // against the rate limit, so only a user action may start one.
    staleTime: Infinity,
    retry: false,
    retryOnMount: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
