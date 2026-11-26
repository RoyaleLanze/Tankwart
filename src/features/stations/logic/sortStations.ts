// Search options and sort order of the station list (M9). Pure, so the screen only renders.

import { compareStrings } from "@/lib/compare";

import type { FuelType, StationPriceInput } from "./cheapestStation";

/** The radii the user can choose (M9); the prices function accepts exactly these. */
export const RADIUS_OPTIONS_KM = [2, 5, 10, 25] as const;
export type RadiusKm = (typeof RADIUS_OPTIONS_KM)[number];
export const DEFAULT_RADIUS_KM: RadiusKm = 5;

export type StationSortOrder = "price" | "distance";
export const DEFAULT_SORT_ORDER: StationSortOrder = "price";

/**
 * A new array sorted by price or distance for the fuel. Stations without a price for the fuel
 * always come last, nearest first. Closed stations keep their place: the list shows them with
 * their open state (M9), the highlight of the cheapest open one is cheapestStation's job (M10).
 */
export function sortStations<T extends StationPriceInput>(
  stations: readonly T[],
  fuelType: FuelType,
  order: StationSortOrder,
): T[] {
  const byPrice = (a: T, b: T) =>
    comparePrices(a.pricesTenthCents[fuelType], b.pricesTenthCents[fuelType]);
  const byDistance = (a: T, b: T) => a.distanceMeters - b.distanceMeters;
  const [first, second] = order === "price" ? [byPrice, byDistance] : [byDistance, byPrice];
  return [...stations].sort(
    (a, b) =>
      compareHasPrice(a, b, fuelType) || first(a, b) || second(a, b) || compareStrings(a.id, b.id),
  );
}

function compareHasPrice(a: StationPriceInput, b: StationPriceInput, fuelType: FuelType): number {
  return (
    Number(a.pricesTenthCents[fuelType] === null) - Number(b.pricesTenthCents[fuelType] === null)
  );
}

// Only called with both or neither price set, since compareHasPrice decides the other cases.
function comparePrices(a: number | null, b: number | null): number {
  return a === null || b === null ? 0 : a - b;
}
