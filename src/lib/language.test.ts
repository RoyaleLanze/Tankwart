import { resolveLanguage } from "./language";

describe("resolveLanguage", () => {
  it("returns a supported device language", () => {
    expect(resolveLanguage([{ languageCode: "de" }])).toBe("de");
  });

  it("skips unsupported languages and takes the first supported one", () => {
    expect(resolveLanguage([{ languageCode: "fr" }, { languageCode: "de" }])).toBe("de");
  });

  it("falls back to German when nothing matches or the list is empty", () => {
    expect(resolveLanguage([{ languageCode: "fr" }, { languageCode: null }])).toBe("de");
    expect(resolveLanguage([])).toBe("de");
  });
});
