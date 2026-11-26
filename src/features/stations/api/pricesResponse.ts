// Parses the list answer of the prices function into the app's types. Pure, so it is tested
// without a server. Field names are Tankerkönig's (list.php), the function passes them through.
import { z } from "zod";

import { METERS_PER_KM, TENTH_CENTS_PER_EURO } from "@/lib/units";

import type { Station, StationList } from "../types";

/** Euros per liter → tenths of a cent. Tankerkönig reports a missing price as false or null. */
function toTenthCents(value: unknown): number | null {
  // 0 is no real price either; it must never count as the cheapest (#66).
  if (typeof value !== "number" || value <= 0) return null;
  return Math.round(value * TENTH_CENTS_PER_EURO);
}

const price = z.unknown().transform(toTenthCents);
// Tankerkönig sends missing texts as "" or null; the app only knows null.
const optionalText = z
  .string()
  .nullish()
  .transform((text) => text?.trim() || null);

const stationSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    brand: optionalText,
    street: z.string(),
    houseNumber: optionalText,
    place: z.string(),
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
  stations: z.array(stationSchema),
  fetchedAt: z.iso.datetime().transform((iso) => new Date(iso)),
});

/** Throws a ZodError if the answer does not have the expected shape. */
export function parseStationList(body: unknown): StationList {
  return stationListSchema.parse(body);
}
