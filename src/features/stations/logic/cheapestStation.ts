// Cheapest open station and its savings against the nearest one (M10).
// Units as in the database: tenths of a cent per liter, ml, cents; distances in meters.

import type { Database } from "@/lib/database.types";
import { ML_TENTH_CENTS_PER_CENT } from "@/features/refuelings/logic/computeMissing";

export type FuelType = Database["public"]["Enums"]["fuel_type"];

/** The fields of a station the comparison needs. A price is null if the station does not sell the fuel. */
export type StationPriceInput = {
  id: string;
  isOpen: boolean;
  distanceMeters: number;
  pricesTenthCents: Record<FuelType, number | null>;
};

/** The savings refer to filling this share of the tank (M10). */
export const SAVINGS_TANK_SHARE_PERCENT = 80;

export type CheapestStationResult = {
  cheapestId: string;
  /** Reference for the savings; can be the same station as the cheapest. */
  nearestId: string;
  /** 80 % of the tank capacity, the volume the savings are calculated for. */
  volumeMl: number;
  /** Never negative; 0 if the nearest station is as cheap as the cheapest. */
  savingsCents: number;
};

type Candidate = { id: string; distanceMeters: number; priceTenthCents: number };

/**
 * Cheapest open station for the fuel and what it saves against the nearest open station when
 * filling 80 % of the tank. Closed stations and stations without a price for the fuel are
 * ignored, also as reference, since one cannot refuel there. Null if no station is left.
 */
export function cheapestStation(
  stations: readonly StationPriceInput[],
  fuelType: FuelType,
  tankCapacityMl: number,
): CheapestStationResult | null {
  const candidates = openWithPrice(stations, fuelType);
  if (candidates.length === 0) return null;

  const cheapest = [...candidates].sort(byPriceThenDistance)[0];
  const nearest = [...candidates].sort(byDistanceThenPrice)[0];
  const volumeMl = savingsVolumeMl(tankCapacityMl);
  const priceDifference = nearest.priceTenthCents - cheapest.priceTenthCents;
  return {
    cheapestId: cheapest.id,
    nearestId: nearest.id,
    volumeMl,
    savingsCents: Math.round((priceDifference * volumeMl) / ML_TENTH_CENTS_PER_CENT),
  };
}

/** 80 % of the tank; integer math avoids float errors like 50000 * 0.8. */
export function savingsVolumeMl(tankCapacityMl: number): number {
  return Math.round((tankCapacityMl * SAVINGS_TANK_SHARE_PERCENT) / 100);
}

function openWithPrice(stations: readonly StationPriceInput[], fuelType: FuelType): Candidate[] {
  const candidates: Candidate[] = [];
  for (const station of stations) {
    const priceTenthCents = station.pricesTenthCents[fuelType];
    if (!station.isOpen || priceTenthCents === null) continue;
    candidates.push({ id: station.id, distanceMeters: station.distanceMeters, priceTenthCents });
  }
  return candidates;
}

// Ties are broken by the other criterion and finally by id, so the result never depends on
// the order the API returned the stations in.
function byPriceThenDistance(a: Candidate, b: Candidate): number {
  return (
    a.priceTenthCents - b.priceTenthCents ||
    a.distanceMeters - b.distanceMeters ||
    compareIds(a.id, b.id)
  );
}

function byDistanceThenPrice(a: Candidate, b: Candidate): number {
  return (
    a.distanceMeters - b.distanceMeters ||
    a.priceTenthCents - b.priceTenthCents ||
    compareIds(a.id, b.id)
  );
}

function compareIds(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
