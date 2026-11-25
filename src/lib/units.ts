// Facts about the database units (ADR 0012), shared by formatting, parsing and validation.

export const ML_PER_LITER = 1000;
/** Tenths of a cent per cent (prices per liter are stored in tenths of a cent). */
export const TENTH_CENTS_PER_CENT = 10;
/** ml × (1/10 ct per L) = 1/10000 ct, so this factor converts between volume, price and total. */
export const ML_TENTH_CENTS_PER_CENT = 10_000;
/** Largest value of a Postgres `integer` column; larger values would fail on insert. */
export const MAX_DB_INTEGER = 2_147_483_647;
