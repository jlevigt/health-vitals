import React, { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { Report, Observation } from "../../api/types";
import { 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Activity, 
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ITEMS_PER_PAGE = 10;
const OBS_PER_PAGE = 5;

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get<Report[]>("/reports");
      setReports(response.data);
    } catch (err) {
      console.error("Failed to fetch reports", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleReport = (reportId: string) => {
    if (expandedReportId === reportId) {
      setExpandedReportId(null);
    } else {
      setExpandedReportId(reportId);
    }
  };

  // Pagination Logic for Reports
  const totalPages = Math.ceil(reports.length / ITEMS_PER_PAGE);
  const currentReports = reports.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="shrink-0 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Lab Reports</h1>
          <p className="text-sm text-on-surface-variant">View and manage your processed clinical documents.</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-white rounded-2xl border border-outline-variant shadow-sm flex flex-col">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-outline-variant bg-surface-variant/20 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          <div>Report Name</div>
          <div>Date</div>
          <div className="text-center">Status</div>
          <div className="text-center w-8"></div>
        </div>

        {/* Table Body */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant opacity-60 flex flex-col items-center gap-2">
              <FileText className="w-12 h-12" />
              <p>No reports found.</p>
            </div>
          ) : (
            currentReports.map((report) => (
              <ReportRow 
                key={report.id} 
                report={report} 
                isExpanded={expandedReportId === report.id}
                onToggle={() => toggleReport(report.id)}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-outline-variant flex justify-between items-center bg-white">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm text-primary font-medium hover:bg-primary-container/30 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs text-on-surface-variant">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm text-primary font-medium hover:bg-primary-container/30 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>



    </div>
  );
};

// Sub-component for individual report row and observations
const ReportRow: React.FC<{ 
  report: Report; 
  isExpanded: boolean; 
  onToggle: () => void; 
}> = ({ report, isExpanded, onToggle }) => {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [obsLoading, setObsLoading] = useState(false);
  const [obsPage, setObsPage] = useState(1);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (isExpanded && !fetched) {
      setObsLoading(true);
      api.get<Observation[]>(`/reports/${report.id}/observations`)
        .then(res => {
          setObservations(res.data);
          setFetched(true);
        })
        .catch(err => console.error(err))
        .finally(() => setObsLoading(false));
    }
  }, [isExpanded, report.id, fetched]);

  const totalObsPages = Math.ceil(observations.length / OBS_PER_PAGE);
  const currentObs = observations.slice(
    (obsPage - 1) * OBS_PER_PAGE,
    obsPage * OBS_PER_PAGE
  );

  return (
    <div className="border-b border-outline-variant last:border-0">
      <div 
        onClick={onToggle}
        className={cn(
          "grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-4 items-center cursor-pointer transition-colors hover:bg-black/5",
          isExpanded ? "bg-primary-container/10" : "bg-white"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary-container rounded-lg text-on-secondary-container">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface truncate max-w-[200px] sm:max-w-md">{report.fileName}</p>
            <p className="text-xs text-on-surface-variant">{report.observationsCount} observations found</p>
          </div>
        </div>
        
        <div className="text-xs text-on-surface-variant font-medium">
          {report.date}
        </div>

        <div className="flex justify-center">
            {report.status === 'processed' ? (
                <div className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase border border-green-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Processed
                </div>
            ) : (
                 <div className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase border border-yellow-200 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Processing
                </div>
            )}
        </div>

        <div className="text-on-surface-variant">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {isExpanded && (
        <div className="bg-surface-variant/5">
           <div className="px-6 py-4">
              <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
                 <div className="px-4 py-2 border-b border-outline-variant bg-surface flex justify-between items-center">
                    <span className="text-xs font-bold text-primary uppercase flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Extracted Observations
                    </span>
                 </div>
                 
                 {obsLoading ? (
                     <div className="p-4 flex justify-center text-primary"><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /></div>
                 ) : observations.length > 0 ? (
                     <>
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-on-surface-variant uppercase bg-surface-variant/30">
                                <tr>
                                    <th className="px-4 py-2 font-medium">Test Name</th>
                                    <th className="px-4 py-2 font-medium">Value</th>
                                    <th className="px-4 py-2 font-medium">Unit</th>
                                    <th className="px-4 py-2 font-medium">Interpretation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/30">
                                {currentObs.map(obs => (
                                    <tr key={obs.id} className="hover:bg-surface-variant/10">
                                        <td className="px-4 py-2 font-medium text-on-surface">{obs.name}</td>
                                        <td className="px-4 py-2 text-on-surface">{obs.value}</td>
                                        <td className="px-4 py-2 text-on-surface-variant text-xs">{obs.unit}</td>
                                        <td className="px-4 py-2">
                                            {obs.interpretation === 'High' || obs.interpretation === 'Low' ? (
                                                <span className="text-error font-bold text-xs flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> {obs.interpretation}
                                                </span>
                                            ) : (
                                                 <span className="text-green-700 font-bold text-xs">{obs.interpretation}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {/* Observations Pagination */}
                        {totalObsPages > 1 && (
                            <div className="px-4 py-2 border-t border-outline-variant flex justify-end gap-2 items-center bg-surface">
                                <button 
                                    onClick={() => setObsPage(p => Math.max(1, p - 1))}
                                    disabled={obsPage === 1}
                                    className="p-1 hover:bg-black/5 rounded disabled:opacity-30"
                                >
                                    <ChevronDown className="w-4 h-4 rotate-90" />
                                </button>
                                <span className="text-[10px] font-medium text-on-surface-variant">
                                    {obsPage} / {totalObsPages}
                                </span>
                                <button 
                                     onClick={() => setObsPage(p => Math.min(totalObsPages, p + 1))}
                                     disabled={obsPage === totalObsPages}
                                     className="p-1 hover:bg-black/5 rounded disabled:opacity-30"
                                >
                                    <ChevronDown className="w-4 h-4 -rotate-90" />
                                </button>
                            </div>
                        )}
                     </>
                 ) : (
                     <div className="p-4 text-center text-xs text-on-surface-variant">No observations found for this report.</div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
