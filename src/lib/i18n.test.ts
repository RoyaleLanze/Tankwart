import { i18n } from "./i18n";

describe("i18n", () => {
  it("is initialized synchronously with German texts", () => {
    expect(i18n.isInitialized).toBe(true);
    expect(i18n.language).toBe("de");
    expect(i18n.t("common.cancel")).toBe("Abbrechen");
  });

  it("rejects unknown keys at compile time", () => {
    // @ts-expect-error "common.cancl" is not a key of the German texts
    i18n.t("common.cancl");
  });
});
