import { type ClassValue, clsx } from "clsx";
import type React from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  tone?: "default" | "inverted";
  showWordmark?: boolean;
  className?: string;
}

const SIZE_CONFIG = {
  sm: {
    box: "w-8 h-8 rounded-lg",
    icon: "w-5 h-5",
    text: "text-lg",
    gap: "gap-2.5",
  },
  md: {
    box: "w-9 h-9 rounded-xl",
    icon: "w-5 h-5",
    text: "text-xl",
    gap: "gap-2.5",
  },
  lg: {
    box: "w-11 h-11 rounded-xl",
    icon: "w-6 h-6",
    text: "text-2xl",
    gap: "gap-3",
  },
} as const;

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "md",
  tone = "default",
  showWordmark = true,
  className,
}) => {
  const styles = SIZE_CONFIG[size];
  const isInverted = tone === "inverted";

  return (
    <div className={cn("inline-flex items-center select-none", styles.gap, className)}>
      <div
        className={cn(
          "shrink-0 flex items-center justify-center bg-primary shadow-xs",
          isInverted && "ring-1 ring-white/20 shadow-md shadow-teal-950/40",
          styles.box,
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={cn("text-white", styles.icon)}
        >
          <path
            d="M3 12.5H6.8L9.1 7.2L12.2 16.8L15 10L16.8 12.5H21"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showWordmark && (
        <span
          className={cn(
            "font-display font-bold tracking-tight leading-none",
            styles.text,
            isInverted ? "text-white" : "text-on-surface",
          )}
        >
          Health
          <span className={isInverted ? "text-teal-300" : "text-primary"}>Vitals</span>
        </span>
      )}
    </div>
  );
};
