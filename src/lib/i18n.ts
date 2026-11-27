// Translation setup. Imported once in the root layout. Resources are bundled and the
// init is synchronous, so the first render already has its texts (no flicker).
import { getLocales } from "expo-localization";
import { createInstance } from "i18next";
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

