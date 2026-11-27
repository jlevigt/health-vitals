import { type ClassValue, clsx } from "clsx";
import { Globe } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import type { SupportedLanguage } from "@/i18n";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface LanguageSwitcherProps {
  variant?: "default" | "subtle";
  className?: string;
}

interface LanguageOption {
  code: SupportedLanguage;
  shortKey: "languageSwitcher.ptShort" | "languageSwitcher.enShort";
  fullKey: "languageSwitcher.ptFull" | "languageSwitcher.enFull";
}

const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  {
    code: "pt-BR",
    shortKey: "languageSwitcher.ptShort",
    fullKey: "languageSwitcher.ptFull",
  },
  {
    code: "en-US",
    shortKey: "languageSwitcher.enShort",
    fullKey: "languageSwitcher.enFull",
  },
];

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = "default",
  className,
}) => {
  const { t, i18n } = useTranslation("common");

  const activeLanguage: SupportedLanguage = (i18n.resolvedLanguage ?? i18n.language).startsWith(
    "en",
  )
    ? "en-US"
    : "pt-BR";

  const handleLanguageChange = (language: SupportedLanguage) => {
    if (language !== activeLanguage) {
      void i18n.changeLanguage(language);
    }
  };

  return (
    <fieldset
      aria-label={t("languageSwitcher.ariaLabel")}
      className={cn(
        "m-0 inline-flex items-center gap-1 rounded-full p-0.5 text-xs font-semibold transition-colors",
        variant === "default"
          ? "bg-surface-variant/40 border border-outline/15 text-on-surface-variant"
          : "bg-surface-variant/30 border border-transparent text-on-surface-variant",
        className,
      )}
    >
      <Globe className="ml-1.5 mr-0.5 h-3.5 w-3.5 shrink-0 opacity-75" aria-hidden="true" />
      {LANGUAGE_OPTIONS.map((option) => {
        const isActive = activeLanguage === option.code;
        const fullLabel = t(option.fullKey);

        return (
          <button
            key={option.code}
            type="button"
            onClick={() => handleLanguageChange(option.code)}
            aria-pressed={isActive}
            aria-label={fullLabel}
            title={fullLabel}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide transition-all cursor-pointer",
              isActive
                ? variant === "default"
                  ? "bg-primary text-white shadow-xs"
                  : "bg-white text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface hover:bg-black/5",
            )}
          >
            {t(option.shortKey)}
          </button>
        );
      })}
    </fieldset>
  );
};
