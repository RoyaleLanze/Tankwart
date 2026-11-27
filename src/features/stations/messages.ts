// Texts of the stations feature (ADR 0014, 0016). The API only knows codes; they map to i18n
// keys here and the wording lives in src/locales.
import { i18n, translate, type TextKey } from "@/lib/i18n";

import type { StationsErrorCode } from "./logic/pricesErrors";

/** Source note under every price list (ADR 0005, CC BY 4.0). */
export const PRICE_SOURCE_TEXT = i18n.t("stations.priceSource");

// For errors the user cannot fix: setup or programming errors, which a later try may solve.
const GENERIC_ERROR_KEY: TextKey = "stations.errors.generic";

// Record over the full union: a new code without a key is a type error.
const ERROR_KEYS: Record<StationsErrorCode, TextKey> = {
  methodNotAllowed: GENERIC_ERROR_KEY,
  unauthorized: "stations.errors.unauthorized",
  invalidInput: GENERIC_ERROR_KEY,
  outsideGermany: "stations.errors.outsideGermany",
  stationNotFound: "stations.errors.stationNotFound",
  missingApiKey: GENERIC_ERROR_KEY,
  upstreamUnavailable: "stations.errors.upstreamUnavailable",
  rateLimited: "stations.errors.rateLimited",
  internalError: GENERIC_ERROR_KEY,
  network: "common.networkError",
  unknown: GENERIC_ERROR_KEY,
};

export function stationsErrorText(code: StationsErrorCode): string {
  return translate(ERROR_KEYS[code]);
}
