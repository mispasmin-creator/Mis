import React from "react";
import { Download, Calendar } from "lucide-react";
import { generateDashboardPDF } from "../../../utils/pdfGenerator";
import DailyReportButton from "./DailyReportButton";

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
}) => {
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h1 className="text-lg md:text-2xl font-bold text-gray-800">
                {isAdmin ? "Admin Dashboard" : (user?.role === 'hod' ? "HOD Dashboard" : "Employee Dashboard")}
            </h1>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-start sm:justify-end">
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

                <DailyReportButton dataSheetRows={dataSheetRows} />
                <button
                    onClick={() => {
                        const visibleColsList = ALL_COLUMNS.filter(col =>
                            visibleColumns[col.key] &&
                            !["nextWeekPlannedNotDone", "nextWeekPlannedNotDoneOnTime", "nextWeekCommitment"].includes(col.key)
                        );
                        const exportData = filteredEmployees.map(emp => ({
                            ...emp,
                            nextWeekPlannedWorkNotDone: employeeCommitments[emp.id]?.nextWeekPlannedWorkNotDone || emp.nextWeekPlannedWorkNotDone,
                            nextWeekPlannedWorkNotDoneOnTime: employeeCommitments[emp.id]?.nextWeekPlannedWorkNotDoneOnTime || emp.nextWeekPlannedWorkNotDoneOnTime,
                            nextWeekCommitment: employeeCommitments[emp.id]?.commitment || emp.nextWeekCommitment
                        }));
                        generateDashboardPDF(
                            visibleColsList,
                            exportData,
                            topBestPerformers,
                            pendingTasks,
                            topWorstPerformers,
                            departmentScores
                        );
                    }}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF Report
                </button>
            </div>
        </div>
    );
};

export default DashboardHeader;
