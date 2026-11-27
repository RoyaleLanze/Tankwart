// Translation setup. Imported once in the root layout. Resources are bundled and the
// init is synchronous, so the first render already has its texts (no flicker).
import { getLocales } from "expo-localization";
import { createInstance, type ParseKeys } from "i18next";
import { initReactI18next } from "react-i18next";

import { de } from "@/locales/de";

import { FALLBACK_LANGUAGE, resolveLanguage } from "./language";

const resources = { de: { translation: de } } as const;

// Types the keys from the German file: t("common.cancl") is a compile error.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: (typeof resources)["de"];
  }
}

export const i18n = createInstance();
i18n.use(initReactI18next).init({
  resources,
  lng: resolveLanguage(getLocales()),
  fallbackLng: FALLBACK_LANGUAGE,
  initAsync: false,
  interpolation: { escapeValue: false }, // React Native does not render HTML
});

/** Any key of the German file, for `Record<Code, TextKey>` maps in the features. */
export type TextKey = ParseKeys;

type Params = Record<string, string | number>;

/**
 * Translates a key that is only known as a union (e.g. from a `Record<Code, TextKey>`).
 * i18next's own `t` cannot check the parameters of a whole union at once, so this one
 * takes the typed key and loose parameters. Literal keys can still use `i18n.t` directly.
 */
export function translate(key: TextKey, params?: Params): string {
  const loose = i18n as unknown as { t: (key: string, params?: Params) => string };
  return loose.t(key, params);
}
