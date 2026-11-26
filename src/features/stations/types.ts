import type { FuelType, StationPriceInput } from "./logic/cheapestStation";
import type { RadiusKm } from "./logic/sortStations";

export type { FuelType };

export type Coordinates = { lat: number; lng: number };

/** What the user searches for. The fuel type is not part of it: one request returns all three. */
export type StationSearch = { position: Coordinates; radiusKm: RadiusKm };

/**
 * A station of the list (M9). Prices in tenths of a cent per liter, null if not sold.
 * The address parts and the brand can be missing (null), the UI must handle that.
 */
export type Station = StationPriceInput & {
  name: string;
  brand: string | null;
  street: string | null;
  houseNumber: string | null;
  place: string | null;
};

/** The result of one search; `fetchedAt` is shown as "abgerufen um …" (M9, M15). */
export type StationList = { stations: Station[]; fetchedAt: Date };
