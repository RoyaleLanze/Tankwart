// Central formatting for amounts and dates in the locale of the UI language. Inputs use the
// database units (cents, ml, tenths of a cent, km), so callers never convert on their own.
import { i18n } from "./i18n";
import { FALLBACK_LANGUAGE, FORMAT_LOCALE, isSupportedLanguage } from "./language";
import { CENTS_PER_EURO, ML_PER_LITER, TENTH_CENTS_PER_CENT, TENTH_CENTS_PER_EURO } from "./units";

/** Locale of the active UI language, so a language switch changes every format. */
function currentLocale(): string {
  const language = isSupportedLanguage(i18n.language) ? i18n.language : FALLBACK_LANGUAGE;
  return FORMAT_LOCALE[language];
}

/** Creates the Intl formatter once per locale; Intl constructors are expensive. */
function perLocale<T>(create: (locale: string) => T): () => T {
  const cache = new Map<string, T>();
  return () => {
    const locale = currentLocale();
    const cached = cache.get(locale) ?? create(locale);
    cache.set(locale, cached);
    return cached;
  };
}

/** Non-breaking space, so a value never wraps away from its unit. */
const NBSP = "\u00A0";

/** Units as shown in input fields (affixes) and after values. */
export const UNIT_LITER = "L";
export const UNIT_EURO = "€";
export const UNIT_PRICE_PER_LITER = "€/L";
export const UNIT_KM = "km";

/** Unit after every euro amount, e.g. "182,40 €". */
export const EURO_SUFFIX = `${NBSP}${UNIT_EURO}`;

const twoDecimals = perLocale(
  (locale) => new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
);
const oneDecimal = perLocale(
  (locale) => new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
);
const wholeNumber = perLocale(
  (locale) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
);

/** 18240 → "182,40 €" */
export function formatEuro(cents: number): string {
  return `${twoDecimals().format(cents / CENTS_PER_EURO)}${EURO_SUFFIX}`;
}

/** 52400 → "52,4 L" */
export function formatLiters(ml: number): string {
  return `${oneDecimal().format(ml / ML_PER_LITER)}${NBSP}${UNIT_LITER}`;
}

/** 84230 → "84.230 km" */
export function formatKm(km: number): string {
  return `${wholeNumber().format(km)}${NBSP}${UNIT_KM}`;
}

/** 6400 ml per 100 km → "6,4 L/100 km" */
export function formatConsumption(mlPer100Km: number): string {
  return `${oneDecimal().format(mlPer100Km / ML_PER_LITER)}${NBSP}L/100${NBSP}km`;
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
  const spokenCents = `${oneDecimal().format(restTenthCents / TENTH_CENTS_PER_CENT)} Cent pro Liter`;
  return {
    euroAndCents: `${euros},${String(cents).padStart(2, "0")}`,
    tenthCent: String(restTenthCents % TENTH_CENTS_PER_CENT),
    // "50,0 Cent pro Liter" instead of "0 Euro 50,0 Cent pro Liter".
    accessibilityLabel: euros > 0 ? `${euros} Euro ${spokenCents}` : spokenCents,
  };
}

/** 1749 → "1,749 €/L": the whole price as plain text, e.g. in a hint (no superscript). */
export function formatPricePerLiterText(tenthCents: number): string {
  const { euroAndCents, tenthCent } = formatPricePerLiter(tenthCents);
  return `${euroAndCents}${tenthCent}${NBSP}${UNIT_PRICE_PER_LITER}`;
}

// Dates from the database are ISO dates without time ("2026-11-18"). They are read and
// formatted in UTC, so the device time zone can never shift them to the previous day.
const dayShort = perLocale(
  (locale) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }),
);
const monthLong = perLocale(
  (locale) => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }),
);
const timeOfDay = perLocale(
  (locale) => new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }),
);

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
  return dayShort().format(parseIsoDate(isoDate));
}

/** "2026-11-18" (any day of the month) → "November 2026" */
export function formatMonth(isoDate: string): string {
  return monthLong().format(parseIsoDate(isoDate));
}

/** Local time of a price fetch → "abgerufen um 09:52" */
export function formatFetchedAt(fetchedAt: Date): string {
  return `abgerufen um ${timeOfDay().format(fetchedAt)}`;
}
