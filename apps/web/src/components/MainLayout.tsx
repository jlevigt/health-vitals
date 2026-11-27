import { type ClassValue, clsx } from "clsx";
import {
  ChevronDown,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/context/AuthContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface MainLayoutProps {
  headerActions?: React.ReactNode;
}

const NAV_ITEMS = [
  { to: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { to: "/files", key: "files", icon: FolderOpen },
  { to: "/reports", key: "reports", icon: FileText },
] as const;

export const MainLayout: React.FC<MainLayoutProps> = ({ headerActions }) => {
  const { t } = useTranslation("common");
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userInitial = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";
  const displayName = user?.name?.trim() || user?.email || t("userMenu.account");

  return (
    <div className="h-screen flex flex-col bg-surface overflow-hidden">
      {/* 64px Top Navigation Bar */}
      <header className="h-16 shrink-0 bg-white/90 backdrop-blur-md border-b border-outline-variant px-4 lg:px-6 flex justify-between items-center z-20 relative">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={isSidebarOpen}
            className="md:hidden p-2 -ml-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg transition-colors cursor-pointer"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <NavLink to="/dashboard" className="focus:outline-none">
            <BrandLogo size="sm" />
          </NavLink>
        </div>

        {/* Right Utility Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center">
            {headerActions ?? <LanguageSwitcher variant="subtle" />}
          </div>

          {/* User Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              aria-label={t("userMenu.openMenu")}
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-xl border border-transparent hover:border-outline-variant hover:bg-surface-variant/60 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container font-display font-bold text-sm flex items-center justify-center shrink-0">
                {userInitial}
              </div>
              <span className="hidden sm:block text-sm font-medium text-on-surface max-w-[140px] truncate">
                {displayName}
              </span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-on-surface-variant transition-transform duration-150",
                  isUserMenuOpen && "rotate-180",
                )}
              />
            </button>

            {isUserMenuOpen && (
              <>
                <button
                  type="button"
                  aria-label={t("actions.close")}
                  onClick={() => setIsUserMenuOpen(false)}
                  className="fixed inset-0 z-10 cursor-default bg-transparent"
                />
                <div
                  role="menu"
                  className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-lg shadow-slate-900/10 border border-outline-variant z-20 py-1.5"
                >
                  <div className="px-4 py-3 border-b border-outline-variant">
                    <p className="text-sm font-semibold text-on-surface truncate">
                      {user?.name || t("userMenu.user")}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">{user?.email}</p>
                  </div>
                  <div className="p-1.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-error hover:bg-error-container transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      {t("userMenu.signOut")}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop 240px Sidebar */}
        <aside className="hidden md:flex w-60 shrink-0 flex-col bg-white border-r border-outline-variant">
          <nav aria-label={t("nav.workspace")} className="p-3 space-y-1 flex-1">
            <p className="px-3 pt-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/75">
              {t("nav.workspace")}
            </p>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-on-surface-variant font-medium hover:bg-surface-variant hover:text-on-surface",
                  )
                }
              >
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                <span>{t(`nav.${item.key}`)}</span>
              </NavLink>
            ))}
          </nav>

          {/* Subtle Workspace Badge */}
          <div className="p-3 border-t border-outline-variant">
            <div className="rounded-xl bg-surface border border-outline-variant px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary-soft border border-primary-container flex items-center justify-center text-primary shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-on-surface truncate">
                  {t("brand.portal")}
                </p>
                <p className="text-[11px] text-on-surface-variant truncate">binderlex.com</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-30 flex md:hidden">
            <button
              type="button"
              aria-label={t("nav.closeMenu")}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/45 backdrop-blur-[2px] cursor-default"
            />
            <aside className="relative z-10 w-64 max-w-[80vw] h-full bg-white shadow-2xl border-r border-outline-variant flex flex-col">
              <div className="h-16 px-4 border-b border-outline-variant flex items-center justify-between">
                <BrandLogo size="sm" />
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  aria-label={t("nav.closeMenu")}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav aria-label={t("nav.workspace")} className="p-3 space-y-1 flex-1">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-on-surface-variant font-medium hover:bg-surface-variant hover:text-on-surface",
                      )
                    }
                  >
                    <item.icon className="w-[18px] h-[18px] shrink-0" />
                    <span>{t(`nav.${item.key}`)}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="p-3 border-t border-outline-variant">
                <div className="rounded-xl bg-surface border border-outline-variant px-3 py-2.5 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary-soft border border-primary-container flex items-center justify-center text-primary shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-on-surface truncate">
                      {t("brand.portal")}
                    </p>
                    <p className="text-[11px] text-on-surface-variant truncate">binderlex.com</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 flex flex-col min-w-0 bg-surface">
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto h-full">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
