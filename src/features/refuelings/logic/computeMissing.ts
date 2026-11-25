// "Two of three" (M3): from any two of volume, price per liter and total, compute the third.
// Units as in the database: ml, tenths of a cent per liter, cents.

export type Amounts = {
  volumeMl: number;
  pricePerLiterTenthCents: number;
  totalCents: number;
};

/** ml × (1/10 ct per L) = 1/10000 ct, so this factor converts between the three units. */
const ML_TENTH_CENTS_PER_CENT = 10_000;

/**
 * Returns all three amounts if at least two are given and positive, otherwise null.
 * If all three are given they are returned unchanged; consistency is not enforced,
 * because receipts round differently.
 */
export function computeMissing(amounts: Partial<Amounts>): Amounts | null {
  const volume = positive(amounts.volumeMl);
  const price = positive(amounts.pricePerLiterTenthCents);
  const total = positive(amounts.totalCents);

  if (volume !== null && price !== null && total !== null) {
    return { volumeMl: volume, pricePerLiterTenthCents: price, totalCents: total };
  }
  if (volume !== null && price !== null) {
    const totalCents = Math.round((volume * price) / ML_TENTH_CENTS_PER_CENT);
    return { volumeMl: volume, pricePerLiterTenthCents: price, totalCents };
  }
  if (total !== null && price !== null) {
    const volumeMl = Math.round((total * ML_TENTH_CENTS_PER_CENT) / price);
    return { volumeMl, pricePerLiterTenthCents: price, totalCents: total };
  }
  if (total !== null && volume !== null) {
    const pricePerLiterTenthCents = Math.round((total * ML_TENTH_CENTS_PER_CENT) / volume);
    return { volumeMl: volume, pricePerLiterTenthCents, totalCents: total };
  }
  return null;
}

function positive(value: number | undefined): number | null {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : null;
}
