import { i18n } from "./i18n";

describe("i18n", () => {
  it("is initialized synchronously with German texts", () => {
    expect(i18n.isInitialized).toBe(true);
    expect(i18n.language).toBe("de");
    expect(i18n.t("common.cancel")).toBe("Abbrechen");
  });
});
