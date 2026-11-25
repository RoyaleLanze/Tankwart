// "Two of three" (M3): from any two of volume, price per liter and total, compute the third.
// Units as in the database: ml, tenths of a cent per liter, cents.

import { ML_TENTH_CENTS_PER_CENT } from "@/lib/units";

export type Amounts = {
  volumeMl: number;
  pricePerLiterTenthCents: number;
  totalCents: number;
};

/** The one field that was empty and the value computed for it. */
export type ComputedAmount = { field: keyof Amounts; value: number };

/**
 * Computes the empty field if exactly one of the three is undefined and the other two are
 * positive integers. Otherwise returns null and changes nothing: typed values, even wrong ones
 * like 0, are never overwritten, so the schema can report them at their field.
 */
export function computeMissing(amounts: Partial<Amounts>): ComputedAmount | null {
  const { volumeMl: volume, pricePerLiterTenthCents: price, totalCents: total } = amounts;
  const given = [volume, price, total].filter((value) => value !== undefined);
  if (given.length !== 2 || !given.every(isPositiveInteger)) return null;

  if (total === undefined && volume !== undefined && price !== undefined) {
    return { field: "totalCents", value: Math.round((volume * price) / ML_TENTH_CENTS_PER_CENT) };
  }
  if (volume === undefined && total !== undefined && price !== undefined) {
    return { field: "volumeMl", value: Math.round((total * ML_TENTH_CENTS_PER_CENT) / price) };
  }
  if (price === undefined && total !== undefined && volume !== undefined) {
    return {
      field: "pricePerLiterTenthCents",
      value: Math.round((total * ML_TENTH_CENTS_PER_CENT) / volume),
    };
  }
  return null;
}

function isPositiveInteger(value: number | undefined): boolean {
  return value !== undefined && Number.isInteger(value) && value > 0;
}
