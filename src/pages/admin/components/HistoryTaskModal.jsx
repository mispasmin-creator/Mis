import React from "react";
import ReactDOM from "react-dom";
import { X, Printer, Calendar, User } from "lucide-react";

const HistoryTaskModal = ({
    selectedUserDetails,
    onClose,
}) => {
    if (!selectedUserDetails) return null;

    const formatDecimal = (val) => {
        if (val === undefined || val === null || val === "") return "0";
        let str = String(val).trim().replace(/%/g, "");
        const num = parseFloat(str);
        if (isNaN(num)) return str;
        return num % 1 === 0 ? String(num) : num.toFixed(2);
    };

    const formatPercent = (val) => {
        if (val === undefined || val === null || val === "") return "0%";
        let str = String(val).trim();
        const num = parseFloat(str.replace(/%/g, ""));
        if (!isNaN(num)) {
            const rounded = num % 1 === 0 ? num : num.toFixed(2);
            return `${rounded}%`;
        }
        if (str.endsWith("%")) return str;
        return `${str}%`;
    };

    const handlePrint = () => {
        if (!selectedUserDetails) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            alert("Popup blocker is preventing the print window. Please allow popups for this site.");
            return;
        }

        const tasks = selectedUserDetails.tasks || [];
        const dateRangeStr = selectedUserDetails.dateStart && selectedUserDetails.dateEnd
            ? `${selectedUserDetails.dateStart} to ${selectedUserDetails.dateEnd}`
            : new Date().toLocaleDateString("en-GB");

        const rowsHtml = tasks.map((task) => {
            const targetVal = parseFloat(task.target) || 0;
            const totalAchVal = parseFloat(task.totalAchievement) || 0;
            const isAchieved = totalAchVal >= targetVal && targetVal > 0;
            const badgeBg = isAchieved ? "#dcfce7" : "#fee2e2";
            const badgeColor = isAchieved ? "#15803d" : "#b91c1c";

            return `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #1e293b; text-align: center;">${task.fmsName || "-"}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 600; color: #0f172a; text-align: center;">${task.taskName || task.systemType || "-"}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">${task.department || "-"}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: center; font-weight: 600;">${task.target || 0}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: center;">${task.actualAchievement || 0}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: center;">${task.extraDone || 0}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: center;">
                        <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; background-color: ${badgeBg}; color: ${badgeColor};">
                            ${task.totalAchievement || 0}
                        </span>
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: center; color: #dc2626; font-weight: 600;">${formatPercent(task.workNotDone)}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: center; color: #dc2626; font-weight: 600;">${formatPercent(task.workNotDoneOnTime)}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: center;">${task.allPendingTillDate || 0}</td>
                </tr>
            `;
        }).join("");

        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Task Details - ${selectedUserDetails.name}</title>
                    <meta charset="utf-8" />
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                        * { box-sizing: border-box; }
                        body { 
                            font-family: 'Inter', sans-serif; 
                            padding: 30px; 
                            color: #1e293b;
                            line-height: 1.4;
                            background: #fff;
                        }
                        .report-container { max-width: 1100px; margin: 0 auto; }
                        .header { 
                            display: flex; 
                            justify-content: space-between; 
                            align-items: center; 
                            border-bottom: 2px solid #24888f; 
                            padding-bottom: 15px; 
                            margin-bottom: 20px; 
                        }
                        .brand-title { font-size: 24px; font-weight: 800; color: #24888f; margin: 0; }
                        .brand-sub { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 4px; }
                        .user-info-card {
                            background: #f8fafc;
                            border: 1px solid #e2e8f0;
                            border-radius: 8px;
                            padding: 15px 20px;
                            margin-bottom: 25px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        }
                        .user-name { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; }
                        .user-dept { font-size: 13px; color: #64748b; font-weight: 600; margin-top: 2px; }
                        .date-badge { font-size: 12px; font-weight: 700; color: #24888f; background: #e6f6f7; padding: 6px 12px; border-radius: 6px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th { 
                            background: #f1f5f9; 
                            padding: 10px; 
                            font-size: 11px; 
                            font-weight: 700; 
                            color: #475569; 
                            text-transform: uppercase; 
                            border-bottom: 2px solid #cbd5e1;
                            text-align: left;
                        }
                        th.num-col { text-align: right; }
                        @media print {
                            body { padding: 10px; }
                            @page { margin: 15mm; size: landscape; }
                        }
                    </style>
                </head>
                <body>
                    <div class="report-container">
                        <div class="header">
                            <div>
                                <h1 class="brand-title">PASMIN GROUP</h1>
                                <div class="brand-sub">Performance Management System</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 14px; font-weight: 800; color: #0f172a;">TASK DETAILS REPORT</div>
                                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Generated on: ${new Date().toLocaleDateString('en-GB')}</div>
                            </div>
                        </div>

                        <div class="user-info-card">
                            <div>
                                <h2 class="user-name">${selectedUserDetails.name}</h2>
                                <div class="user-dept">${selectedUserDetails.department || "Operations"}</div>
                            </div>
                            ${dateRangeStr ? `<div class="date-badge">Period: ${dateRangeStr}</div>` : ""}
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>FMS Name</th>
                                    <th>Task Name</th>
                                    <th>Department</th>
                                    <th class="num-col">Target</th>
                                    <th class="num-col">Actual Achievement</th>
                                    <th class="num-col">Extra Done</th>
                                    <th class="num-col">Total Achievement</th>
                                    <th class="num-col">% Work Not Done</th>
                                    <th class="num-col">% Work Not Done On Time</th>
                                    <th class="num-col">All Pending</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rowsHtml || `
                                    <tr>
                                        <td colspan="10" style="text-align: center; padding: 40px 20px; color: #64748b; background: #f8fafc;">
                                            <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">Not Available This Week Record</div>
                                            <div style="font-size: 12px; color: #94a3b8;">Task details are not recorded for the period ${dateRangeStr} in the "Task Wise Record" sheet.</div>
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();

        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
            }, 300);
        };
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        {selectedUserDetails.image ? (
                            <img
                                src={selectedUserDetails.image}
                                alt={selectedUserDetails.name}
                                className="w-11 h-11 rounded-full object-cover border-2 border-indigo-200 shadow-2xs"
                                onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    if (e.currentTarget.nextElementSibling) {
                                        e.currentTarget.nextElementSibling.style.display = "flex";
                                    }
                                }}
                            />
                        ) : null}
                        <div
                            className={`w-11 h-11 rounded-full bg-indigo-100 border-2 border-indigo-200 items-center justify-center text-indigo-700 font-bold text-base shadow-2xs ${selectedUserDetails.image ? "hidden" : "flex"}`}
                        >
                            {selectedUserDetails.name ? selectedUserDetails.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 leading-tight">
                                {selectedUserDetails.name}
                            </h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    {selectedUserDetails.department || "Operations"}
                                </span>
                                {(selectedUserDetails.dateStart || selectedUserDetails.dateEnd) && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                        <Calendar className="w-3 h-3 text-indigo-600" />
                                        {selectedUserDetails.dateStart} {selectedUserDetails.dateEnd ? `to ${selectedUserDetails.dateEnd}` : ""}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#24888f] hover:bg-[#1e7278] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                            title="Print Task Details"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Print Tasks</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 hover:bg-gray-200 text-gray-500 hover:text-gray-700 rounded-full transition-colors cursor-pointer"
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                                Task Details
                            </h3>
                            <span className="text-xs text-gray-500 font-medium">
                                {selectedUserDetails.tasks ? selectedUserDetails.tasks.length : 0} tasks found
                            </span>
                        </div>

                        {/* Desktop View Table */}
                        <div className="hidden md:block overflow-auto max-h-[calc(90vh-230px)] border border-gray-200 rounded-lg relative shadow-2xs">
                            <table className="min-w-full divide-y divide-gray-200 border-separate border-spacing-0 text-left">
                                <thead className="bg-gray-100 sticky top-0 z-20 shadow-xs">
                                    <tr>
                                        <th className="sticky top-0 bg-gray-100 z-20 px-3 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap border-b border-gray-200 text-center">FMS NAME</th>
                                        <th className="sticky top-0 bg-gray-100 z-20 px-3 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap border-b border-gray-200 text-center">TASK NAME</th>
                                        <th className="sticky top-0 bg-gray-100 z-20 px-3 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap border-b border-gray-200 text-center">DEPARTMENT</th>
                                        <th className="sticky top-0 bg-gray-100 z-20 px-3 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap border-b border-gray-200 text-center">TARGET</th>
                                        <th className="sticky top-0 bg-gray-100 z-20 px-3 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap border-b border-gray-200 text-center">ACTUAL ACHIEVEMENT</th>
                                        <th className="sticky top-0 bg-gray-100 z-20 px-3 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap border-b border-gray-200 text-center">EXTRA DONE</th>
                                        <th className="sticky top-0 bg-gray-100 z-20 px-3 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap border-b border-gray-200 text-center">TOTAL ACHIEVEMENT</th>
                                        <th className="sticky top-0 bg-gray-100 z-20 px-3 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap border-b border-gray-200 text-center">% WORK NOT DONE</th>
                                        <th className="sticky top-0 bg-gray-100 z-20 px-3 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap border-b border-gray-200 text-center">% WORK NOT DONE ON TIME</th>
                                        <th className="sticky top-0 bg-gray-100 z-20 px-3 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap border-b border-gray-200 text-center">ALL PENDING</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {selectedUserDetails.tasks && selectedUserDetails.tasks.length > 0 ? (
                                        selectedUserDetails.tasks.map((task, idx) => {
                                            const targetNum = parseFloat(task.target) || 0;
                                            const totalAchNum = parseFloat(task.totalAchievement) || 0;
                                            const isAchieved = (targetNum > 0 && totalAchNum >= targetNum) || (targetNum === 0 && totalAchNum > 0);
                                            const isZero = totalAchNum === 0 && targetNum > 0;

                                            return (
                                                <tr key={idx} className="hover:bg-indigo-50/50 transition-colors">
                                                    <td className="px-3 py-2.5 text-xs text-gray-800 font-medium border-b border-gray-100 text-center">{task.fmsName || "-"}</td>
                                                    <td className="px-3 py-2.5 text-xs text-gray-900 font-semibold border-b border-gray-100 text-center">{task.taskName || task.systemType || "-"}</td>
                                                    <td className="px-3 py-2.5 text-xs text-gray-600 border-b border-gray-100 text-center">{task.department || "-"}</td>
                                                    <td className="px-3 py-2.5 text-xs text-gray-900 font-bold border-b border-gray-100 text-center">{task.target}</td>
                                                    <td className="px-3 py-2.5 text-xs text-gray-900 font-medium border-b border-gray-100 text-center">{task.actualAchievement}</td>
                                                    <td className="px-3 py-2.5 text-xs text-gray-900 font-medium border-b border-gray-100 text-center">{task.extraDone}</td>
                                                    <td className="px-3 py-2.5 text-xs font-bold border-b border-gray-100 text-center">
                                                        <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-bold ${
                                                            isZero
                                                                ? "bg-red-100 text-red-700"
                                                                : isAchieved
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-emerald-100 text-emerald-800"
                                                        }`}>
                                                            {task.totalAchievement}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-xs text-gray-900 border-b border-gray-100 text-center font-medium">
                                                        {formatDecimal(task.workNotDone)}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-xs text-gray-900 border-b border-gray-100 text-center font-medium">
                                                        {formatDecimal(task.workNotDoneOnTime)}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-xs text-gray-700 border-b border-gray-100 text-center font-medium">
                                                        {task.allPendingTillDate}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="10" className="px-6 py-14 text-center bg-gray-50/40">
                                                <div className="flex flex-col items-center justify-center gap-2.5 max-w-md mx-auto">
                                                    <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
                                                        <Calendar className="w-6 h-6" />
                                                    </div>
                                                    <h4 className="text-sm font-bold text-gray-900">
                                                        Not Available This Week Record
                                                    </h4>
                                                    <p className="text-xs text-gray-500 leading-relaxed">
                                                        Task details for <span className="font-semibold text-gray-800">{selectedUserDetails.name}</span> are not recorded in the "Task Wise Record" sheet for the selected period {selectedUserDetails.dateStart ? `(${selectedUserDetails.dateStart} to ${selectedUserDetails.dateEnd})` : ""}.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile View Cards */}
                        <div className="md:hidden space-y-3">
                            {selectedUserDetails.tasks && selectedUserDetails.tasks.length > 0 ? (
                                selectedUserDetails.tasks.map((task, idx) => {
                                    const targetNum = parseFloat(task.target) || 0;
                                    const totalAchNum = parseFloat(task.totalAchievement) || 0;
                                    const isZero = totalAchNum === 0 && targetNum > 0;
                                    const isAchieved = (targetNum > 0 && totalAchNum >= targetNum) || (targetNum === 0 && totalAchNum > 0);

                                    return (
                                        <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 shadow-2xs">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider truncate mb-0.5">
                                                        {task.fmsName || "-"}
                                                    </p>
                                                    <h4 className="text-sm font-bold text-gray-900 truncate">
                                                        {task.taskName || task.systemType || "-"}
                                                    </h4>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0 ml-2 ${
                                                    isZero
                                                        ? "bg-red-100 text-red-700"
                                                        : isAchieved
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-emerald-100 text-emerald-800"
                                                }`}>
                                                    {task.totalAchievement} / {task.target}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-t border-gray-100 pt-2 text-xs">
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-medium uppercase">Dept</p>
                                                    <p className="font-semibold text-gray-700 truncate">{task.department || "-"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-medium uppercase">Actual Ach.</p>
                                                    <p className="font-semibold text-gray-700">{task.actualAchievement}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-medium uppercase">Extra Done</p>
                                                    <p className="font-semibold text-gray-700">{task.extraDone}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-medium uppercase">All Pending</p>
                                                    <p className="font-semibold text-gray-700">{task.allPendingTillDate}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-medium uppercase">% Work Not Done</p>
                                                    <p className="font-semibold text-gray-700">{formatDecimal(task.workNotDone)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-medium uppercase">% Not Done On Time</p>
                                                    <p className="font-semibold text-gray-700">{formatDecimal(task.workNotDoneOnTime)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-10 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto mb-2">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-900">Not Available This Week Record</h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                        No task breakdown found for {selectedUserDetails.dateStart} to {selectedUserDetails.dateEnd}.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-3 flex justify-end flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 border border-gray-300 bg-white rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors shadow-2xs cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default HistoryTaskModal;
