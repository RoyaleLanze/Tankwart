// Central German formatting for amounts and dates. Inputs use the database units
// (cents, ml, tenths of a cent, km), so callers never convert on their own.
import { CENTS_PER_EURO, ML_PER_LITER, TENTH_CENTS_PER_CENT, TENTH_CENTS_PER_EURO } from "./units";

const LOCALE = "de-DE";
/** Non-breaking space, so a value never wraps away from its unit. */
const NBSP = "\u00A0";

/** Unit after every euro amount, e.g. "182,40 €". */
export const EURO_SUFFIX = `${NBSP}€`;

const twoDecimals = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const oneDecimal = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const wholeNumber = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

/** 18240 → "182,40 €" */
export function formatEuro(cents: number): string {
  return `${twoDecimals.format(cents / CENTS_PER_EURO)}${EURO_SUFFIX}`;
}

/** 52400 → "52,4 L" */
export function formatLiters(ml: number): string {
  return `${oneDecimal.format(ml / ML_PER_LITER)}${NBSP}L`;
}

/** 84230 → "84.230 km" */
export function formatKm(km: number): string {
  return `${wholeNumber.format(km)}${NBSP}km`;
}

/** 6400 ml per 100 km → "6,4 L/100 km" */
export function formatConsumption(mlPer100Km: number): string {
  return `${oneDecimal.format(mlPer100Km / ML_PER_LITER)}${NBSP}L/100${NBSP}km`;
}

/** Price per liter split like a price board: 1749 → "1,74" + superscript "9". */
export type PricePerLiterParts = {
  euroAndCents: string;
  tenthCent: string;
  /** Spoken form for screen readers, e.g. "1 Euro 74,9 Cent pro Liter". */
  accessibilityLabel: string;
};

/** Expects a whole number of tenths of a cent ≥ 0, as validated by the refueling schema. */
export function formatPricePerLiter(tenthCents: number): PricePerLiterParts {
  if (!Number.isInteger(tenthCents) || tenthCents < 0) {
    throw new Error(`Invalid price in tenths of a cent: ${tenthCents}`);
  }
  const euros = Math.floor(tenthCents / TENTH_CENTS_PER_EURO);
  const restTenthCents = tenthCents % TENTH_CENTS_PER_EURO;
  const cents = Math.floor(restTenthCents / TENTH_CENTS_PER_CENT);
  const spokenCents = `${oneDecimal.format(restTenthCents / TENTH_CENTS_PER_CENT)} Cent pro Liter`;
  return {
    euroAndCents: `${euros},${String(cents).padStart(2, "0")}`,
    tenthCent: String(restTenthCents % TENTH_CENTS_PER_CENT),
    // "50,0 Cent pro Liter" instead of "0 Euro 50,0 Cent pro Liter".
    accessibilityLabel: euros > 0 ? `${euros} Euro ${spokenCents}` : spokenCents,
  };
}

// Dates from the database are ISO dates without time ("2026-11-18"). They are read and
// formatted in UTC, so the device time zone can never shift them to the previous day.
const dayShort = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const monthLong = new Intl.DateTimeFormat(LOCALE, {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const timeOfDay = new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit" });

function parseIsoDate(isoDate: string): Date {
  const date = new Date(`${isoDate}T00:00:00Z`);
  // The round trip also rejects days that do not exist: "2026-02-30" would become 2 March.
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== isoDate) {
    throw new Error(`Invalid ISO date: ${isoDate}`);
  }
  return date;
}

/** "2026-11-18" → "18. Nov." */
export function formatDayShort(isoDate: string): string {
  return dayShort.format(parseIsoDate(isoDate));
}

/** "2026-11-18" (any day of the month) → "November 2026" */
export function formatMonth(isoDate: string): string {
  return monthLong.format(parseIsoDate(isoDate));
}

/** Local time of a price fetch → "abgerufen um 09:52" */
export function formatFetchedAt(fetchedAt: Date): string {
  return `abgerufen um ${timeOfDay.format(fetchedAt)}`;
}
