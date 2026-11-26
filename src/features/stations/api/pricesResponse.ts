// Parses the list answer of the prices function into the app's types. Pure, so it is tested
// without a server. Field names are Tankerkönig's (list.php), the function passes them through.
import { z } from "zod";

import { METERS_PER_KM, TENTH_CENTS_PER_EURO } from "@/lib/units";

import type { Station, StationList } from "../types";

/** Euros per liter → tenths of a cent. Tankerkönig reports a missing price as false or null. */
function toTenthCents(value: unknown): number | null {
  if (typeof value !== "number") return null;
  const tenthCents = Math.round(value * TENTH_CENTS_PER_EURO);
  // 0 (or less, or a price below half a tenth cent) is no real price; it must never count
  // as the cheapest (#66).
  return tenthCents > 0 ? tenthCents : null;
}

const price = z.unknown().transform(toTenthCents);
// Tankerkönig sends missing texts as "" or null; the app only knows null. Only id, name,
// distance and open state are required for a station, the address parts are optional.
const optionalText = z
  .string()
  .nullish()
  .transform((text) => text?.trim() || null);

const stationSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    brand: optionalText,
    street: optionalText,
    houseNumber: optionalText,
    place: optionalText,
    dist: z.number().nonnegative(),
    isOpen: z.boolean(),
    e5: price,
    e10: price,
    diesel: price,
  })
  .transform(({ dist, e5, e10, diesel, ...station }): Station => ({
    ...station,
    distanceMeters: Math.round(dist * METERS_PER_KM),
    pricesTenthCents: { e5, e10, diesel },
  }));

const stationListSchema = z.object({
  stations: z.array(z.unknown()),
  fetchedAt: z.iso.datetime().transform((iso) => new Date(iso)),
});

/**
 * Throws a ZodError if the answer as a whole is malformed. A single malformed station is
 * skipped instead, so one bad entry does not hide the other stations.
 */
export function parseStationList(body: unknown): StationList {
  const { stations, fetchedAt } = stationListSchema.parse(body);
  const parsed = stations.map((station) => stationSchema.safeParse(station));
  return {
    stations: parsed.flatMap((result) => (result.success ? [result.data] : [])),
    fetchedAt,
  };
}
