import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ar from "./locales/ar.json";
import type { Language } from "../types";

/**
 * I18nService — central translation + direction handling.
 *
 * To add a new language:
 *   1. Create `src/i18n/locales/<lang>.json` (copy `en.json` and translate).
 *   2. Import it here and add it to `resources`.
 *   3. Add the language code to `RTL_LANGUAGES` if it is right-to-left.
 *   4. Add an option in the Settings language selector + the `Language` type.
 */
export const resources = {
  en: { translation: en },
  ar: { translation: ar },
} as const;

const RTL_LANGUAGES: Language[] = ["ar"];

export function isRtl(lang: Language): boolean {
  return RTL_LANGUAGES.includes(lang);
}

export function getDir(lang: Language): "rtl" | "ltr" {
  return isRtl(lang) ? "rtl" : "ltr";
}

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnNull: false,
});

/** Apply language to i18next and to the <html> element (dir + lang). */
export function applyLanguage(lang: Language): void {
  void i18n.changeLanguage(lang);
  const html = document.documentElement;
  html.setAttribute("lang", lang);
  html.setAttribute("dir", getDir(lang));
}

export default i18n;
