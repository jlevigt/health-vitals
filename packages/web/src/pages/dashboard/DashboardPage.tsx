import React, { useEffect, useState, useCallback } from "react";
import { api } from "@/api/client";
import { TrendChart } from "@/components/TrendChart";
import type { DashboardResponse, TrendSeries } from "@/api/types";
import { Activity } from "lucide-react";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type DashboardCategory = "lipid_panel" | "glucose_metabolism" | "renal_function";

const CATEGORIES = [
  { id: 'lipid_panel', label: 'Lipid Panel' },
  { id: 'glucose_metabolism', label: 'Glucose Metabolism' },
  { id: 'renal_function', label: 'Renal Function' },
];

export const DashboardPage: React.FC = () => {
  const [category, setCategory] = useState<DashboardCategory>("lipid_panel");
  const [data, setData] = useState<TrendSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (cat: DashboardCategory) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<DashboardResponse>(`/dashboard/${cat}`);
      setData(response.data.series);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
      setError("Unable to load health trends. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(category);
  }, [category, fetchData]);

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Internal Page Header */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Health Dashboards</h1>
          <p className="text-sm text-on-surface-variant">Track your biomarkers over time.</p>
        </div>
        
        {/* Category Tabs */}
        <div className="flex p-1 bg-surface-variant/30 rounded-xl self-start sm:self-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id as DashboardCategory)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                category === cat.id 
                  ? "bg-white text-primary shadow-sm font-bold" 
                  : "text-on-surface-variant hover:bg-black/5"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full relative min-h-[300px]">
        {loading ? (
             <div className="absolute inset-0 flex items-center justify-center bg-surface/50 backdrop-blur-sm z-10 rounded-2xl">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
        ) : null}

        {error ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 bg-white rounded-2xl border border-outline-variant/50">
            <div className="bg-error-container text-on-error-container p-4 rounded-full">
              <Activity className="w-8 h-8 opacity-50" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-on-surface">Data Unavailable</h3>
              <p className="text-sm text-on-surface-variant max-w-md">{error}</p>
            </div>
            <button 
              onClick={() => fetchData(category)}
              className="px-6 py-2 bg-primary text-on-primary rounded-full text-sm font-bold shadow-sm hover:shadow-md transition-shadow"
            >
              Retry Connection
            </button>
          </div>
        ) : data.length > 0 ? (
          <div className={cn(
             "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4 transition-opacity duration-300",
             loading ? "opacity-40" : "opacity-100"
          )}>
            {data.map((series) => (
              <div key={series.canonical_name} className="h-[240px]">
                <TrendChart series={series} />
              </div>
            ))}
          </div>
        ) : !loading && (
          <div className="h-full flex flex-col items-center justify-center text-on-surface-variant text-center space-y-4 opacity-40">
            <Activity className="w-16 h-16" />
            <div className="space-y-1">
              <p className="text-lg font-bold">No trends found</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
