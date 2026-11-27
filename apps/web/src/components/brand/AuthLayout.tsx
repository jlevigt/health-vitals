import { Activity, FileSearch, ShieldCheck } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export interface AuthLayoutProps {
  children: React.ReactNode;
  headerSlot?: React.ReactNode;
}

const HIGHLIGHTS = [
  { id: "extraction", icon: FileSearch },
  { id: "trends", icon: Activity },
  { id: "privacy", icon: ShieldCheck },
] as const;

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, headerSlot }) => {
  const { t } = useTranslation(["auth", "common"]);

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-surface lg:grid lg:grid-cols-12">
      {/* Analytical Brand Showcase Panel (Desktop) */}
      <aside className="hidden lg:flex lg:col-span-5 relative flex-col justify-between bg-[#0F172A] text-white px-8 py-7 xl:px-10 xl:py-8 overflow-hidden">
        {/* Ambient Clinical Teal Radial Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 w-[400px] h-[400px] rounded-full opacity-35 blur-3xl"
          style={{
            background: "radial-gradient(circle, #0F766E 0%, rgba(15, 118, 110, 0) 70%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-24 w-[380px] h-[380px] rounded-full opacity-25 blur-3xl"
          style={{
            background: "radial-gradient(circle, #14B8A6 0%, rgba(15, 23, 42, 0) 70%)",
          }}
        />
        {/* Subtle Architectural Grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #94A3B8 1px, transparent 1px), linear-gradient(to bottom, #94A3B8 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />

        {/* Top Brand */}
        <div className="relative z-10 shrink-0">
          <BrandLogo tone="inverted" size="md" />
        </div>

        {/* Center Narrative & Mini Biomarker Card */}
        <div className="relative z-10 space-y-5 xl:space-y-6 my-4">
          <div className="space-y-2">
            <h2 className="font-display text-2xl xl:text-[28px] font-bold leading-snug tracking-tight text-white">
              {t("auth:showcase.headline")}
            </h2>
            <p className="text-xs xl:text-sm text-slate-300 leading-relaxed max-w-md">
              {t("auth:showcase.subheadline")}
            </p>
          </div>

          <ul className="space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-400/25 flex items-center justify-center text-teal-300">
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs xl:text-sm font-semibold text-white">
                    {t(`auth:showcase.features.${item.id}.title`)}
                  </p>
                  <p className="text-xs text-slate-400 leading-snug mt-0.5">
                    {t(`auth:showcase.features.${item.id}.description`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {/* Decorative Mini Biomarker Card */}
          <div className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-4 shadow-xl shadow-slate-950/30">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  {t("auth:showcase.preview.title")}
                </p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-display text-xs xl:text-sm font-semibold text-white">
                    {t("auth:showcase.preview.biomarkerSample")}
                  </span>
                  <span className="text-xl font-bold text-white tabular-nums">
                    {t("auth:showcase.preview.valueSample")}
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {t("auth:showcase.preview.statusInRange")}
              </span>
            </div>

            {/* Inline SVG Sparkline with Reference Corridor */}
            <div className="mt-3">
              <svg
                viewBox="0 0 280 56"
                fill="none"
                aria-hidden="true"
                className="w-full h-[52px] overflow-visible"
              >
                <rect
                  x="0"
                  y="12"
                  width="280"
                  height="30"
                  rx="4"
                  fill="#10B981"
                  fillOpacity="0.1"
                />
                <line
                  x1="0"
                  y1="12"
                  x2="280"
                  y2="12"
                  stroke="#34D399"
                  strokeOpacity="0.35"
                  strokeDasharray="3 3"
                />
                <line
                  x1="0"
                  y1="42"
                  x2="280"
                  y2="42"
                  stroke="#34D399"
                  strokeOpacity="0.35"
                  strokeDasharray="3 3"
                />
                <path
                  d="M12 18 L76 9 L140 22 L204 27 L268 30"
                  stroke="#2DD4BF"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="18" r="3" fill="#10B981" stroke="#0F172A" strokeWidth="1.5" />
                <circle cx="76" cy="9" r="3" fill="#FB7185" stroke="#0F172A" strokeWidth="1.5" />
                <circle cx="140" cy="22" r="3" fill="#10B981" stroke="#0F172A" strokeWidth="1.5" />
                <circle cx="204" cy="27" r="3" fill="#10B981" stroke="#0F172A" strokeWidth="1.5" />
                <circle cx="268" cy="30" r="4" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
              </svg>
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 tabular-nums">
              <span>{t("auth:showcase.preview.referenceLabel")}</span>
              <span>{t("auth:showcase.preview.updatedLabel")}</span>
            </div>
          </div>
        </div>

        {/* Bottom Footnote */}
        <div className="relative z-10 shrink-0 flex items-center justify-between text-xs text-slate-400">
          <span>binderlex.com</span>
          <span className="text-slate-500">{t("common:brand.portal")}</span>
        </div>
      </aside>

      {/* Form Panel */}
      <div className="lg:col-span-7 flex flex-col min-h-dvh lg:h-dvh lg:overflow-y-auto">
        {/* Top Utility Bar */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-8 pt-4 pb-1 min-h-[48px]">
          <div className="lg:hidden">
            <BrandLogo size="sm" />
          </div>
          <div className="ml-auto">{headerSlot ?? <LanguageSwitcher />}</div>
        </div>

        {/* Centered Form Card */}
        <div className="flex-1 flex items-center justify-center px-4 py-4 sm:px-8">
          <div className="w-full max-w-[430px] bg-white rounded-2xl border border-outline-variant shadow-[0_10px_35px_-12px_rgba(15,23,42,0.08)] p-6 sm:p-8">
            {children}
          </div>
        </div>

        {/* Mobile / Right Footer */}
        <footer className="shrink-0 px-6 py-3 text-center text-xs text-on-surface-variant/80">
          {t("common:brand.name")} &middot; binderlex.com
        </footer>
      </div>
    </div>
  );
};
