import { Activity, FileSearch, ShieldCheck } from "lucide-react";
import type React from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export interface AuthLayoutProps {
  children: React.ReactNode;
  headerSlot?: React.ReactNode;
}

const HIGHLIGHTS = [
  {
    id: "extraction",
    icon: FileSearch,
    title: "AI PDF Lab Extraction",
    description: "Parse clinical panels, units, and reference intervals automatically.",
  },
  {
    id: "trends",
    icon: Activity,
    title: "Longitudinal Biomarker Trends",
    description: "Track lipid, glucose, and renal trajectories across every checkup.",
  },
  {
    id: "ranges",
    icon: ShieldCheck,
    title: "Reference-Range Monitoring",
    description: "Spot in-range progress and out-of-range anomalies at a glance.",
  },
] as const;

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, headerSlot }) => {
  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-12">
      {/* Analytical Brand Panel (Desktop) */}
      <aside className="hidden lg:flex lg:col-span-5 relative flex-col justify-between bg-[#0F172A] text-white p-10 xl:p-12 overflow-hidden">
        {/* Ambient Clinical Teal Radial Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 w-[440px] h-[440px] rounded-full opacity-35 blur-3xl"
          style={{
            background: "radial-gradient(circle, #0F766E 0%, rgba(15, 118, 110, 0) 70%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-24 w-[420px] h-[420px] rounded-full opacity-25 blur-3xl"
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
        <div className="relative z-10">
          <BrandLogo tone="inverted" size="md" />
        </div>

        {/* Center Narrative & Mini Biomarker Card */}
        <div className="relative z-10 space-y-8 my-8">
          <div className="space-y-3">
            <h2 className="font-display text-3xl xl:text-[34px] font-bold leading-tight tracking-tight text-white">
              Clinical biomarker intelligence, structured from every report.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-md">
              Turn scattered PDF lab results into clear longitudinal analytics with built-in
              reference-range context.
            </p>
          </div>

          <ul className="space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item.id} className="flex items-start gap-3.5">
                <div className="mt-0.5 shrink-0 w-9 h-9 rounded-lg bg-teal-500/15 border border-teal-400/25 flex items-center justify-center text-teal-300">
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {/* Decorative Mini Biomarker Card */}
          <div className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-5 shadow-xl shadow-slate-950/30">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Glycemic Control
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display text-sm font-semibold text-white">HbA1c</span>
                  <span className="text-2xl font-bold text-white tabular-nums">5.2%</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                In Range
              </span>
            </div>

            {/* Inline SVG Sparkline with Reference Corridor */}
            <div className="mt-4">
              <svg
                viewBox="0 0 280 72"
                fill="none"
                aria-hidden="true"
                className="w-full h-[72px] overflow-visible"
              >
                {/* Reference Corridor (4.0% - 5.6%) */}
                <rect
                  x="0"
                  y="16"
                  width="280"
                  height="38"
                  rx="4"
                  fill="#10B981"
                  fillOpacity="0.1"
                />
                <line
                  x1="0"
                  y1="16"
                  x2="280"
                  y2="16"
                  stroke="#34D399"
                  strokeOpacity="0.35"
                  strokeDasharray="3 3"
                />
                <line
                  x1="0"
                  y1="54"
                  x2="280"
                  y2="54"
                  stroke="#34D399"
                  strokeOpacity="0.35"
                  strokeDasharray="3 3"
                />
                {/* Trend Line */}
                <path
                  d="M12 22 L76 12 L140 28 L204 34 L268 38"
                  stroke="#2DD4BF"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Data Points */}
                <circle cx="12" cy="22" r="3.5" fill="#10B981" stroke="#0F172A" strokeWidth="1.5" />
                <circle cx="76" cy="12" r="3.5" fill="#FB7185" stroke="#0F172A" strokeWidth="1.5" />
                <circle
                  cx="140"
                  cy="28"
                  r="3.5"
                  fill="#10B981"
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
                <circle
                  cx="204"
                  cy="34"
                  r="3.5"
                  fill="#10B981"
                  stroke="#0F172A"
                  strokeWidth="1.5"
                />
                <circle
                  cx="268"
                  cy="38"
                  r="4.5"
                  fill="#10B981"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
              </svg>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 tabular-nums">
              <span>Ref: 4.0 – 5.6 %</span>
              <span>5 lab panels tracked</span>
            </div>
          </div>
        </div>

        {/* Bottom Footnote */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400">
          <span>binderlex.com</span>
          <span className="text-slate-500">Clinical Data Workspace</span>
        </div>
      </aside>

      {/* Form Panel */}
      <div className="lg:col-span-7 flex flex-col min-h-screen">
        {/* Top Utility Bar */}
        <div className="flex items-center justify-between px-5 sm:px-8 pt-5 pb-2 min-h-[56px]">
          <div className="lg:hidden">
            <BrandLogo size="sm" />
          </div>
          {headerSlot && <div className="ml-auto">{headerSlot}</div>}
        </div>

        {/* Centered Form Card */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-[440px] bg-white rounded-2xl border border-outline-variant shadow-[0_10px_35px_-12px_rgba(15,23,42,0.08)] p-7 sm:p-9">
            {children}
          </div>
        </div>

        {/* Mobile / Right Footer */}
        <footer className="px-6 py-4 text-center text-xs text-on-surface-variant/80">
          HealthVitals &middot; binderlex.com
        </footer>
      </div>
    </div>
  );
};
