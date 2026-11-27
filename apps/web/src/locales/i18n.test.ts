import { afterEach, describe, expect, it } from "bun:test";
import {
  DEFAULT_LANGUAGE,
  I18N_NAMESPACES,
  i18n,
  LANGUAGE_STORAGE_KEY,
  resources,
  SUPPORTED_LANGUAGES,
} from "@/i18n";

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
interface JsonObject {
  [key: string]: JsonValue;
}

function collectLeafEntries(obj: JsonObject, prefix = ""): Map<string, string> {
  const entries = new Map<string, string>();

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const nested = collectLeafEntries(value, fullKey);
      for (const [nestedKey, nestedValue] of nested.entries()) {
        entries.set(nestedKey, nestedValue);
      }
    } else if (typeof value === "string") {
      entries.set(fullKey, value);
    } else {
      throw new Error(`Unexpected non-string leaf value at key "${fullKey}"`);
    }
  }

  return entries;
}

function extractPlaceholders(template: string): string[] {
  const matches = template.match(/\{\{[^}]+\}\}/g) ?? [];
  return [...matches].sort();
}

describe("Frontend i18n configuration & locale parity", () => {
  afterEach(async () => {
    await i18n.changeLanguage(DEFAULT_LANGUAGE);
  });

  it("exports locked contract constants", () => {
    expect([...SUPPORTED_LANGUAGES]).toEqual(["pt-BR", "en-US"]);
    expect(DEFAULT_LANGUAGE).toBe("pt-BR");
    expect(LANGUAGE_STORAGE_KEY).toBe("hv_language");
    expect([...I18N_NAMESPACES]).toEqual(["common", "auth", "dashboard", "files", "reports"]);
  });

  it("maintains 100% key parity, non-empty values, and matching interpolation variables across all namespaces", () => {
    for (const namespace of I18N_NAMESPACES) {
      const ptEntries = collectLeafEntries(resources["pt-BR"][namespace] as JsonObject);
      const enEntries = collectLeafEntries(resources["en-US"][namespace] as JsonObject);

      const ptKeys = [...ptEntries.keys()].sort();
      const enKeys = [...enEntries.keys()].sort();

      expect(ptKeys.length).toBeGreaterThan(0);
      expect(ptKeys).toEqual(enKeys);

      for (const key of ptKeys) {
        const ptValue = ptEntries.get(key);
        const enValue = enEntries.get(key);

        expect(ptValue?.trim().length).toBeGreaterThan(0);
        expect(enValue?.trim().length).toBeGreaterThan(0);

        expect(extractPlaceholders(ptValue ?? "")).toEqual(extractPlaceholders(enValue ?? ""));
      }
    }
  });

  it("initializes cleanly with pt-BR fallback and resolves translations across all namespaces", () => {
    expect(i18n.isInitialized).toBe(true);
    expect(i18n.resolvedLanguage).toBe("pt-BR");

    expect(i18n.t("nav.dashboard", { ns: "common" })).toBe("Painel");
    expect(i18n.t("login.title", { ns: "auth" })).toBe("Bem-vindo de volta");
    expect(i18n.t("categories.lipid_panel", { ns: "dashboard" })).toBe("Perfil Lipídico");
    expect(i18n.t("biomarkers.fasting_glucose", { ns: "dashboard" })).toBe("Glicemia em Jejum");
    expect(i18n.t("status.completed", { ns: "files" })).toBe("Concluído");
    expect(i18n.t("observationsCount", { ns: "reports", count: 5 })).toBe("5 observações");
    expect(i18n.t("observationsCount", { ns: "reports", count: 1 })).toBe("1 observação");
  });

  it("switches to en-US cleanly and falls back to pt-BR for unsupported locales", async () => {
    await i18n.changeLanguage("en-US");
    expect(i18n.resolvedLanguage).toBe("en-US");
    expect(i18n.t("nav.dashboard", { ns: "common" })).toBe("Dashboard");
    expect(i18n.t("login.title", { ns: "auth" })).toBe("Welcome back");
    expect(i18n.t("categories.lipid_panel", { ns: "dashboard" })).toBe("Lipid Panel");
    expect(i18n.t("biomarkers.fasting_glucose", { ns: "dashboard" })).toBe("Fasting Glucose");
    expect(i18n.t("status.completed", { ns: "files" })).toBe("Completed");
    expect(i18n.t("observationsCount", { ns: "reports", count: 5 })).toBe("5 observations");
    expect(i18n.t("observationsCount", { ns: "reports", count: 1 })).toBe("1 observation");

    await i18n.changeLanguage("fr-FR");
    expect(i18n.t("nav.dashboard", { ns: "common" })).toBe("Painel");
  });

  it("syncs document.documentElement.lang when language changes in a browser environment", async () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, "document");
    const mockDocumentElement = { lang: "" };

    Object.defineProperty(globalThis, "document", {
      value: { documentElement: mockDocumentElement },
      configurable: true,
      writable: true,
    });

    try {
      await i18n.changeLanguage("en-US");
      expect(mockDocumentElement.lang).toBe("en-US");

      await i18n.changeLanguage("pt-BR");
      expect(mockDocumentElement.lang).toBe("pt-BR");
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(globalThis, "document", originalDescriptor);
      } else {
        delete (globalThis as { document?: unknown }).document;
      }
    }
  });
});
