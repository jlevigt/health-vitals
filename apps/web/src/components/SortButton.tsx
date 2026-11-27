import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import type { SortDirection } from "@/utils/tableSort";

interface SortButtonProps {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
  className?: string;
}

export const SortButton: React.FC<SortButtonProps> = ({
  label,
  active,
  direction,
  onClick,
  className = "",
}) => {
  const { t } = useTranslation("common");
  const directionLabel = active
    ? direction === "asc"
      ? t("sorting.ascending")
      : t("sorting.descending")
    : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        directionLabel
          ? `${t("sorting.sortBy", { column: label })} (${directionLabel})`
          : t("sorting.sortBy", { column: label })
      }
      className={`inline-flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-semibold transition-colors cursor-pointer select-none ${
        active ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
      } ${className}`}
    >
      <span>{label}</span>
      {active ? (
        direction === "asc" ? (
          <ArrowUp className="w-3.5 h-3.5 text-primary shrink-0" />
        ) : (
          <ArrowDown className="w-3.5 h-3.5 text-primary shrink-0" />
        )
      ) : (
        <ArrowUpDown className="w-3.5 h-3.5 opacity-55 shrink-0" />
      )}
    </button>
  );
};
