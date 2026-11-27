// Pure helpers to map the device language to a language of the app UI.
export const SUPPORTED_LANGUAGES = ["de"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const FALLBACK_LANGUAGE: SupportedLanguage = "de";

/** Number and date locale per UI language, used by lib/format. */
export const FORMAT_LOCALE: Record<SupportedLanguage, string> = {
  de: "de-DE",
};

export function isSupportedLanguage(code: string | null | undefined): code is SupportedLanguage {
  return SUPPORTED_LANGUAGES.some((language) => language === code);
}

/** First device language (in the user's order) that the app supports, else the fallback. */
export function resolveLanguage(
  deviceLocales: readonly { languageCode: string | null }[],
): SupportedLanguage {
  for (const { languageCode } of deviceLocales) {
    if (isSupportedLanguage(languageCode)) return languageCode;
  }
  return FALLBACK_LANGUAGE;
}
