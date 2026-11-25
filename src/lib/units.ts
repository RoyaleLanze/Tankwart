// Facts about the database units (ADR 0012), shared by formatting, parsing and validation.

export const ML_PER_LITER = 1000;
/** Largest value of a Postgres `integer` column; larger values would fail on insert. */
export const MAX_DB_INTEGER = 2_147_483_647;
