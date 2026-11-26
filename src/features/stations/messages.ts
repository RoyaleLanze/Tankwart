// German texts of the stations feature (ADR 0014). The API only knows codes; the wording lives here.
import type { StationsErrorCode } from "./logic/pricesErrors";

/** Source note under every price list (ADR 0005, CC BY 4.0). */
export const PRICE_SOURCE_TEXT = "Preisdaten: Tankerkönig.de / MTS-K (CC BY 4.0)";

// For errors the user cannot fix: setup or programming errors, which a later try may solve.
const GENERIC_ERROR_TEXT = "Die Preise konnten nicht geladen werden. Versuche es später erneut.";

// Record over the full union: a new code without a text is a type error.
const ERROR_TEXTS: Record<StationsErrorCode, string> = {
  methodNotAllowed: GENERIC_ERROR_TEXT,
  unauthorized: "Deine Anmeldung ist abgelaufen. Melde dich erneut an.",
  invalidInput: GENERIC_ERROR_TEXT,
  outsideGermany:
    "Preise gibt es nur für Tankstellen in Deutschland. Wähle einen Ort in Deutschland.",
  stationNotFound: "Diese Tankstelle wurde nicht gefunden.",
  missingApiKey: GENERIC_ERROR_TEXT,
  upstreamUnavailable:
    "Der Preisdienst Tankerkönig ist gerade nicht erreichbar. Versuche es gleich erneut.",
  rateLimited:
    "Du hast gerade viele Preise abgefragt. Warte eine Minute und versuche es dann erneut.",
  internalError: GENERIC_ERROR_TEXT,
  network: "Keine Verbindung zum Server. Prüfe deine Internetverbindung und versuche es erneut.",
  unknown: GENERIC_ERROR_TEXT,
};

export function stationsErrorText(code: StationsErrorCode): string {
  return ERROR_TEXTS[code];
}
