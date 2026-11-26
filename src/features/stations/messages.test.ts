import { PRICES_ERROR_CODES, type StationsErrorCode } from "./logic/pricesErrors";
import { stationsErrorText } from "./messages";

const ALL_CODES: StationsErrorCode[] = [...PRICES_ERROR_CODES, "network", "unknown"];

describe("stationsErrorText", () => {
  it.each(ALL_CODES)("has a German sentence for %s", (code) => {
    const text = stationsErrorText(code);
    expect(text).toMatch(/^[A-ZÄÖÜ].*\.$/);
    expect(text).not.toContain(code);
  });

  it("tells the user what to do when offline or over the limit", () => {
    expect(stationsErrorText("network")).toContain("Internetverbindung");
    expect(stationsErrorText("rateLimited")).toContain("Warte eine Minute");
    expect(stationsErrorText("outsideGermany")).toContain("Deutschland");
  });

  it("does not reveal setup details like the API key", () => {
    expect(stationsErrorText("missingApiKey")).toBe(stationsErrorText("unknown"));
  });
});
