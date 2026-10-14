import React from "react";
import { Calendar, RotateCw } from "lucide-react";

const DashboardHeader = ({
    user,
    ALL_COLUMNS,
    visibleColumns,
    filteredEmployees,
    employeeCommitments,
    topWorstPerformers,
    topBestPerformers,
    pendingTasks,
    departmentScores = [],
    dataSheetRows = [],
    reportDateRange = { startDate: "", endDate: "" },
    onRefresh,
    loading = false,
}) => {
    const roleLower = String(user?.role || '').toLowerCase();
    const isAdmin = roleLower === 'admin' || roleLower === 'superadmin' || String(user?.id || '').toLowerCase() === 'admin';

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
            {/* Left Title */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-800 whitespace-nowrap">
                    {isAdmin ? "Admin Dashboard" : (user?.role === 'hod' ? "HOD Dashboard" : "Employee Dashboard")}
                </h1>
            </div>

            {/* Right Actions: Date Range & Buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-start sm:justify-end flex-shrink-0">
                {/* Live Date Range Info */}
                {(reportDateRange?.startDate || reportDateRange?.endDate) && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-xs hover:border-indigo-200 transition-colors">
                        <Calendar className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-gray-500 font-medium">Target:</span>
                            <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 shadow-xs" title="Target data calculate date (Start date)">
                                {reportDateRange.startDate || "-"}
                            </span>
                            <span className="text-gray-400 font-bold px-0.5">to</span>
                            <span className="text-gray-500 font-medium">Actual Achievement:</span>
                            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 shadow-xs" title="Actual achievement data date (End date)">
                                {reportDateRange.endDate || "-"}
                            </span>
                        </div>
                    </div>
                )}

                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        title="Refresh data from Google Sheets"
                        className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <RotateCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin text-indigo-600' : 'text-gray-500'}`} />
                        <span>{loading ? "Refreshing..." : "Refresh"}</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default DashboardHeader;

