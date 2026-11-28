// The refueling form (M3, M4): the fields hold text in the units the user types (L, €/L, €, km).
// This schema parses the text, fills in the third of volume, price and total (computeMissing) and
// hands the numbers to the rules in schema.ts, so there is one source for the M4 limits.
// Errors stay codes (ADR 0014), reported at the form field and not at the database unit.
import { z } from "zod";

import { parseDecimal, parseWholeNumber } from "@/lib/parse";
import { CENTS_PER_EURO, MAX_DB_INTEGER, ML_PER_LITER, TENTH_CENTS_PER_EURO } from "@/lib/units";

import type { RefuelingInput } from "../types";
import { computeMissing, type Amounts, type ComputedAmount } from "./computeMissing";
import { refuelingFormValuesSchema, type RefuelingFormValues } from "./formValues";
import type { RefuelingContext, RefuelingErrorCode, RefuelingWarningCode } from "./rules";
import { createRefuelingSchema, getRefuelingWarnings, type RefuelingFields } from "./schema";

/** Which form field shows the error of a validated field (the names differ by unit). */
const FORM_FIELD_OF = {
  refueledOn: "refueledOn",
  volumeMl: "volumeLiters",
  pricePerLiterTenthCents: "pricePerLiter",
  totalCents: "totalEuros",
  odometerKm: "odometerKm",
  stationName: "stationName",
} as const satisfies Record<keyof RefuelingFields, keyof RefuelingFormValues>;

/** The form field for an error that belongs to a validated field, e.g. from the database. */
export function formFieldOf(field: keyof RefuelingFields): keyof RefuelingFormValues {
  return FORM_FIELD_OF[field];
}

function isValidatedField(key: PropertyKey | undefined): key is keyof RefuelingFields {
  return typeof key === "string" && Object.hasOwn(FORM_FIELD_OF, key);
}

/**
 * The parsers return Infinity for more digits than a number holds. The rules do not accept
 * Infinity as a number at all and would call it "missing", so it becomes a value they reject as
 * too large.
 */
function finite(value: number): number {
  return value === Infinity ? MAX_DB_INTEGER + 1 : value;
}

/**
 * Empty text stays `undefined` (missing); text that is no number becomes NaN (see lib/parse).
 * Digits beyond the unit are rounded, not rejected: "1,7495" €/L becomes 1750 tenths of a cent.
 */
function amountFromText(text: string, unitsPerInput: number): number | undefined {
  return text.trim() === "" ? undefined : finite(Math.round(parseDecimal(text) * unitsPerInput));
}

/** The three amount fields of the form. */
export type AmountTexts = Pick<
  RefuelingFormValues,
  "volumeLiters" | "pricePerLiter" | "totalEuros"
>;

/** The three amounts in database units; the empty ones are `undefined`. */
function amountsFromValues(values: AmountTexts): Partial<Amounts> {
  return {
    volumeMl: amountFromText(values.volumeLiters, ML_PER_LITER),
    pricePerLiterTenthCents: amountFromText(values.pricePerLiter, TENTH_CENTS_PER_EURO),
    totalCents: amountFromText(values.totalEuros, CENTS_PER_EURO),
  };
}

/**
 * The amount the app computes on saving: the one empty field, once the other two are valid
 * numbers. The form shows it before the user saves.
 */
export function computedAmount(values: AmountTexts): ComputedAmount | null {
  return computeMissing(amountsFromValues(values));
}

/** Parsed values for the rules in schema.ts, with the empty amount filled in when possible. */
function fieldsFromValues(values: RefuelingFormValues) {
  const amounts = amountsFromValues(values);
  const computed = computeMissing(amounts);
  return {
    refueledOn: values.refueledOn,
    ...amounts,
    ...(computed && { [computed.field]: computed.value }),
    odometerKm: finite(parseWholeNumber(values.odometerKm)),
    stationName: values.stationName,
  };
}

const emptyToNull = (text: string | null) => text?.trim() || null;

/** Typed shorthand, so a misspelled code is a type error. */
const COMPUTED_AMOUNT_INVALID: RefuelingErrorCode = "computedAmountInvalid";

/**
 * Reports the rule violations at the form fields, one per field (the first: "too large" comes
 * before "above the tank"). A computed value was not typed by the user, so a rule code like
 * "out of range" would confuse; it gets its own code.
 */
function addFieldIssues(
  issues: readonly { path: PropertyKey[]; message: string }[],
  values: RefuelingFormValues,
  ctx: z.RefinementCtx,
) {
  const computed = computedAmount(values);
  const computedFormField = computed && FORM_FIELD_OF[computed.field];
  const reported = new Set<string>();
  for (const issue of issues) {
    const key = issue.path[0];
    const field = isValidatedField(key) ? FORM_FIELD_OF[key] : undefined;
    if (field && reported.has(field)) continue;
    if (field) reported.add(field);
    const message = field && field === computedFormField ? COMPUTED_AMOUNT_INVALID : issue.message;
    ctx.addIssue({ code: "custom", message, path: field ? [field] : [] });
  }
}

/** Builds the form's schema for one vehicle: text in, `RefuelingInput` in database units out. */
export function createRefuelingFormSchema(context: RefuelingContext) {
  const rules = createRefuelingSchema(context);
  return refuelingFormValuesSchema.transform((values, ctx): RefuelingInput => {
    const result = rules.safeParse(fieldsFromValues(values));
    if (!result.success) {
      addFieldIssues(result.error.issues, values, ctx);
      return z.NEVER;
    }
    return {
      ...result.data,
      stationId: emptyToNull(values.stationId),
      stationAddress: emptyToNull(values.stationAddress),
      isFullTank: values.isFullTank,
      previousMissed: values.previousMissed,
      note: emptyToNull(values.note),
    };
  });
}

/** A new refueling: today's date and a full tank, everything else empty. */
export function defaultFormValues(today: string): RefuelingFormValues {
  return {
    refueledOn: today,
    volumeLiters: "",
    pricePerLiter: "",
    totalEuros: "",
    odometerKm: "",
    stationId: null,
    stationName: "",
    stationAddress: "",
    isFullTank: true,
    previousMissed: false,
    note: "",
  };
}

/** Warning for the odometer text typed so far; none while it is empty or not a number. */
export function odometerWarning(
  values: Pick<RefuelingFormValues, "odometerKm">,
  context: RefuelingContext,
): RefuelingWarningCode | undefined {
  const odometerKm = parseWholeNumber(values.odometerKm);
  // Above MAX_DB_INTEGER the form shows valueTooLarge; a warning next to it would be noise.
  return Number.isFinite(odometerKm) && odometerKm <= MAX_DB_INTEGER
    ? getRefuelingWarnings({ odometerKm }, context).odometerKm
    : undefined;
}
