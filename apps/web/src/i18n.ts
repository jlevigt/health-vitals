import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import enUSAuth from "@/locales/en-US/auth.json";
import enUSCommon from "@/locales/en-US/common.json";
import enUSDashboard from "@/locales/en-US/dashboard.json";
import enUSFiles from "@/locales/en-US/files.json";
import enUSReports from "@/locales/en-US/reports.json";
import ptBRAuth from "@/locales/pt-BR/auth.json";
import ptBRCommon from "@/locales/pt-BR/common.json";
import ptBRDashboard from "@/locales/pt-BR/dashboard.json";
import ptBRFiles from "@/locales/pt-BR/files.json";
import ptBRReports from "@/locales/pt-BR/reports.json";

export const SUPPORTED_LANGUAGES = ["pt-BR", "en-US"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "pt-BR";
export const LANGUAGE_STORAGE_KEY = "hv_language";
export const I18N_NAMESPACES = ["common", "auth", "dashboard", "files", "reports"] as const;
export type I18nNamespace = (typeof I18N_NAMESPACES)[number];

export const resources = {
  "pt-BR": {
    common: ptBRCommon,
    auth: ptBRAuth,
    dashboard: ptBRDashboard,
    files: ptBRFiles,
    reports: ptBRReports,
  },
  "en-US": {
    common: enUSCommon,
    auth: enUSAuth,
    dashboard: enUSDashboard,
    files: enUSFiles,
    reports: enUSReports,
  },
} as const;

function normalizeLanguage(language: string): SupportedLanguage {
  const lowered = language.toLowerCase();
  if (lowered.startsWith("en")) {
    return "en-US";
  }
  return DEFAULT_LANGUAGE;
}

function syncDocumentLanguage(language: string): void {
  if (typeof document !== "undefined") {
    document.documentElement.lang = normalizeLanguage(language);
  }
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    defaultNS: "common",
    ns: [...I18N_NAMESPACES],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
      convertDetectedLanguage: normalizeLanguage,
    },
    react: {
      useSuspense: false,
    },
  });

syncDocumentLanguage(i18n.resolvedLanguage ?? i18n.language ?? DEFAULT_LANGUAGE);

i18n.on("languageChanged", (lng) => {
  syncDocumentLanguage(lng);
});

export { i18n };
