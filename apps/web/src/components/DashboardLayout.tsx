import React from 'react';
import { Activity, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  loading?: boolean;
}

const CATEGORIES = [
  { id: 'lipid_panel', label: 'Lipid Panel' },
  { id: 'glucose_metabolism', label: 'Glucose Metabolism' },
  { id: 'renal_function', label: 'Renal Function' },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  activeCategory, 
  onCategoryChange,
  loading 
}) => {
  const { user, logout } = useAuth();

  return (
    <div className="h-screen flex flex-col bg-surface overflow-hidden">
      {/* Header */}
      <nav className="shrink-0 bg-white border-b border-outline-variant px-6 py-3 flex justify-between items-center z-10">
        <div className="flex items-center gap-2 text-primary">
          <Activity className="w-6 h-6" />
          <span className="text-lg font-bold tracking-tight text-on-surface">Health Trends</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-1 bg-secondary-container p-1 rounded-full">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                  activeCategory === cat.id 
                    ? "bg-primary text-on-primary shadow-sm" 
                    : "text-on-secondary-container hover:bg-black/5"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4 pl-4 border-l border-outline-variant">
            <span className="text-xs text-on-surface-variant font-medium hidden sm:block">
              {user?.email}
            </span>
            <button
              onClick={logout}
              className="text-on-surface-variant hover:text-error transition-colors p-1"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 space-y-4">
        <div className="shrink-0 flex items-center gap-2 text-xs font-medium text-on-surface-variant uppercase tracking-widest">
          <span>Dashboards</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-primary font-bold">
            {CATEGORIES.find(c => c.id === activeCategory)?.label}
          </span>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/50 backdrop-blur-sm z-20">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium text-on-surface-variant">Updating Trends...</span>
              </div>
            </div>
          ) : null}
          
          <div className={cn(
            "h-full overflow-y-auto no-scrollbar pb-4",
            loading && "opacity-50 grayscale-[0.5]"
          )}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
