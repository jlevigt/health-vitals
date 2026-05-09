import { type ClassValue, clsx } from "clsx";
import {
  Activity,
  ChevronRight,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { useAuth } from "@/context/AuthContext";

// import { DnaWave } from './DnaWave';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false); // Header user menu state

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  const navItems = [
    { to: "/dashboard", label: "Dashboards", icon: LayoutDashboard },
    { to: "/files", label: "Files", icon: FolderOpen },
    { to: "/reports", label: "Reports", icon: FileText },
  ];

  return (
    <div className="h-screen flex flex-col bg-surface overflow-hidden">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-outline-variant px-4 py-3 flex justify-between items-center z-20 shadow-sm relative">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 text-on-surface hover:bg-surface-variant/20 rounded-full"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex items-center gap-2 text-primary">
            <Activity className="w-6 h-6" />
            <span className="text-lg font-bold tracking-tight text-on-surface">HealthVitals</span>
          </div>
        </div>

        {/*
        // Center Animation
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
          <DnaWave />
        </div>
        */}

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={toggleUserMenu}
            className="flex items-center gap-2 p-2 rounded-full hover:bg-surface-variant/20 transition-colors"
          >
            <div className="w-8 h-8 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container font-bold">
              {user?.name?.[0] || "U"}
            </div>
            <Menu className="w-5 h-5 text-on-surface-variant" />
          </button>

          {isUserMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
              <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-lg border border-outline-variant z-20 py-2 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-3 border-b border-outline-variant/50 mb-2">
                  <p className="text-sm font-bold text-on-surface">{user?.name || "User"}</p>
                  <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error-container/10 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar for Desktop */}
        <aside className="hidden md:flex w-64 flex-col bg-white border-r border-outline-variant">
          <div className="p-4 space-y-2 flex-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                    isActive
                      ? "bg-primary-container text-on-primary-container font-bold"
                      : "text-on-surface-variant hover:bg-surface-variant/30",
                  )
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
                <ChevronRight
                  className={cn(
                    "ml-auto w-4 h-4 opacity-0 transition-all -translate-x-2",
                    "group-hover:opacity-50 group-hover:translate-x-0",
                  )}
                />
              </NavLink>
            ))}
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="absolute inset-0 z-30 flex md:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
            <aside className="relative w-64 h-full bg-white shadow-xl p-4 space-y-2 animate-in slide-in-from-left duration-200">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary-container text-on-primary-container font-bold"
                        : "text-on-surface-variant hover:bg-surface-variant/30",
                    )
                  }
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-surface">
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 no-scrollbar relative">
            <Outlet />
          </div>

          {/* Footer */}
          <footer className="shrink-0 py-4 text-center text-xs text-on-surface-variant opacity-60">
            <p>
              Created by{" "}
              <a
                href="mailto:jlevi.gt@gmail.com"
                className="font-semibold hover:text-primary transition-colors"
              >
                jlevi.gt@gmail.com
              </a>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};
