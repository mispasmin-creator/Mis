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
        const dateRangeStr = (selectedUserDetails.dateStart && selectedUserDetails.dateEnd)
            ? `${selectedUserDetails.dateStart} to ${selectedUserDetails.dateEnd}`
            : (selectedUserDetails.dateStart || selectedUserDetails.dateEnd || new Date().toLocaleDateString("en-GB"));

        const totalTarget = tasks.reduce((sum, t) => sum + (parseFloat(t.target) || 0), 0);
        const totalActual = tasks.reduce((sum, t) => sum + (parseFloat(t.actualAchievement) || 0), 0);
        const totalActualOnTime = tasks.reduce((sum, t) => sum + (parseFloat(t.actualOnTime) || 0), 0);
        const totalAchievement = tasks.reduce((sum, t) => sum + (parseFloat(t.totalAchievement) || 0), 0);
        const totalPending = tasks.reduce((sum, t) => sum + (parseFloat(t.allPendingTillDate) || 0), 0);
        const isTotalAchZero = totalAchievement === 0 && totalTarget > 0;
        const isTotalTargetMet = (totalTarget > 0 && totalAchievement >= totalTarget) || (totalTarget === 0 && totalAchievement > 0);
        const totalBadgeClass = isTotalAchZero ? 'badge-red' : (isTotalTargetMet ? 'badge-green' : 'badge-blue');

        const html = `
            <html>
                <head>
                    <title>Performance Report - ${selectedUserDetails.name}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                        
                        @page {
                            size: landscape;
                            margin: 8mm;
                        }

                        body { 
                            font-family: 'Inter', sans-serif; 
                            padding: 20px; 
                            color: #1e293b;
                            line-height: 1.4;
                            background: #fff;
                        }
                        
                        .report-container {
                            max-width: 100%;
                            width: 100%;
                            margin: 0 auto;
                        }

                        .report-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            border-bottom: 3px solid #24888f;
                            padding-bottom: 15px;
                            margin-bottom: 25px;
                        }

                        .brand {
                            display: flex;
                            flex-direction: column;
                        }

                        .brand-name {
                            font-size: 32px;
                            font-weight: 800;
                            color: #24888f;
                            letter-spacing: -0.04em;
                            margin: 0;
                            line-height: 1;
                        }

                        .brand-sub {
                            font-size: 11px;
                            font-weight: 700;
                            color: #64748b;
                            text-transform: uppercase;
                            letter-spacing: 0.15em;
                            margin-top: 4px;
                        }

                        .report-title-box {
                            text-align: right;
                        }

                        .report-title {
                            font-size: 13px;
                            font-weight: 800;
                            color: #0f172a;
                            margin: 0;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                        }

                        .report-date {
                            font-size: 11px;
                            color: #64748b;
                            margin-top: 4px;
                            font-weight: 500;
                        }

                        .emp-card {
                            background: #f8fafc;
                            border-radius: 10px;
                            padding: 20px;
                            display: flex;
                            align-items: center;
                            gap: 20px;
                            margin-bottom: 25px;
                            border: 1px solid #e2e8f0;
                        }

                        .emp-photo {
                            width: 70px;
                            height: 70px;
                            border-radius: 50%;
                            object-fit: cover;
                            border: 2px solid #fff;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                        }

                        .emp-details h2 {
                            margin: 0;
                            font-size: 22px;
                            font-weight: 700;
                            color: #0f172a;
                            letter-spacing: -0.02em;
                        }

                        .emp-details p {
                            margin: 2px 0 0;
                            font-size: 14px;
                            color: #64748b;
                            font-weight: 500;
                        }

                        .stats-grid {
                            display: grid;
                            grid-template-columns: repeat(3, 1fr);
                            gap: 12px;
                            margin-bottom: 25px;
                        }

                        .stat-item {
                            background: #fff;
                            border: 1px solid #e2e8f0;
                            padding: 12px;
                            border-radius: 8px;
                            text-align: center;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                        }

                        .stat-label {
                            font-size: 9px;
                            font-weight: 800;
                            color: #64748b;
                            text-transform: uppercase;
                            margin-bottom: 4px;
                            letter-spacing: 0.05em;
                        }

                        .stat-value {
                            font-size: 18px;
                            font-weight: 800;
                            color: #1e293b;
                        }

                        .stat-value.highlight {
                            color: #24888f;
                        }

                        .section-title {
                            font-size: 12px;
                            font-weight: 800;
                            color: #475569;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                            margin-bottom: 12px;
                            border-left: 4px solid #24888f;
                            padding-left: 10px;
                        }

                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 5px;
                            font-size: 10px;
                        }

                        th {
                            background-color: #f1f5f9;
                            color: #475569;
                            font-weight: 700;
                            text-transform: uppercase;
                            font-size: 9px;
                            letter-spacing: 0.025em;
                            padding: 8px 4px;
                            text-align: center;
                            border: 1px solid #cbd5e1;
                            vertical-align: middle;
                        }

                        td {
                            padding: 7px 4px;
                            border: 1px solid #e2e8f0;
                            color: #334155;
                            text-align: center;
                            vertical-align: middle;
                            font-size: 10px;
                            word-wrap: break-word;
                        }

                        .badge {
                            display: inline-block;
                            padding: 2px 7px;
                            border-radius: 9999px;
                            font-weight: 700;
                            font-size: 9.5px;
                        }

                        .badge-blue { background: #e0e7ff; color: #4338ca; }
                        .badge-red { background: #fee2e2; color: #991b1b; }
                        .badge-green { background: #dcfce7; color: #166534; }

                        .sign-section {
                            display: flex;
                            justify-content: space-between;
                            margin-top: 50px;
                            padding: 0 40px;
                        }

                        .signature-line {
                            width: 180px;
                            border-top: 1.5px solid #334155;
                            padding-top: 8px;
                            text-align: center;
                            font-weight: 700;
                            font-size: 11px;
                            color: #1e293b;
                        }

                        @media print {
                            body { padding: 0; }
                            .report-container { width: 100%; max-width: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="report-container">
                        <div class="report-header">
                            <div class="brand">
                                <h1 class="brand-name">Passary Refractories</h1>
                            </div>
                            <div class="report-title-box">
                                <h2 class="report-title">Employee Performance Audit</h2>
                                <p class="report-date">Period: ${dateRangeStr}</p>
                            </div>
                        </div>

                        <div class="emp-card">
                            <img src="${selectedUserDetails.image}" alt="${selectedUserDetails.name}" class="emp-photo">
                            <div class="emp-details">
                                <h2>${selectedUserDetails.name}</h2>
                                <p style="font-size: 14px; font-weight: 600; color: #334155; margin-top: 2px;">
                                    <span>${selectedUserDetails.department || 'Operations Management'}</span>
                                    ${selectedUserDetails.firm ? `<span style="color: #cbd5e1; margin: 0 6px;">&bull;</span><span style="color: #24888f; font-weight: 700;">${selectedUserDetails.firm}</span>` : ''}
                                </p>
                                ${selectedUserDetails.id ? `<p style="font-size: 11px; color: #64748b; margin-top: 4px;">User ID: ${selectedUserDetails.id}</p>` : ''}
                            </div>
                        </div>

                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-label">Weekly Not Done %</span>
                                <span class="stat-value">${formatPercent(selectedUserDetails.workNotDone || selectedUserDetails.weeklyWorkDone)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Weekly Not Done On-Time %</span>
                                <span class="stat-value">${formatPercent(selectedUserDetails.workNotDoneOnTime || selectedUserDetails.weeklyWorkDoneOnTime)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Pending Backlog</span>
                                <span class="stat-value" style="color: #ef4444;">${selectedUserDetails.allPendingTillDate || totalPending}</span>
                            </div>
                        </div>

                        <h3 class="section-title">Task Details</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 16%;">FMS NAME</th>
                                    <th style="width: 18%;">TASK NAME</th>
                                    <th style="width: 8%;">DEPARTMENT</th>
                                    <th style="width: 6%;">TARGET</th>
                                    <th style="width: 9%;">ACTUAL ACHIEVEMENT</th>
                                    <th style="width: 8%;">ACTUAL ON TIME</th>
                                    <th style="width: 9%;">TOTAL ACHIEVEMENT</th>
                                    <th style="width: 9%;">% WORK NOT DONE</th>
                                    <th style="width: 10%;">% WORK NOT DONE ON TIME</th>
                                    <th style="width: 8%;">ALL PENDING TILL DATE</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tasks.length > 0 ? tasks.map(task => {
                                    const targetVal = parseFloat(task.target) || 0;
                                    const totalAchVal = parseFloat(task.totalAchievement) || 0;
                                    const isZero = totalAchVal === 0 && targetVal > 0;
                                    const isTargetMet = (targetVal > 0 && totalAchVal >= targetVal) || (targetVal === 0 && totalAchVal > 0);
                                    const badgeClass = isZero ? 'badge-red' : (isTargetMet ? 'badge-green' : 'badge-blue');

                                    return `
                                    <tr>
                                        <td style="font-weight: 500;">${task.fmsName || '-'}</td>
                                        <td style="font-weight: 600; color: #0f172a;">${task.taskName || task.systemType || '-'}</td>
                                        <td style="color: #64748b;">${task.department || '-'}</td>
                                        <td style="font-weight: 700;">${task.target ?? 0}</td>
                                        <td style="font-weight: 600;">${task.actualAchievement ?? 0}</td>
                                        <td>${task.actualOnTime ?? 0}</td>
                                        <td><span class="badge ${badgeClass}">${task.totalAchievement ?? 0}</span></td>
                                        <td>${formatDecimal(task.workNotDone)}</td>
                                        <td>${formatDecimal(task.workNotDoneOnTime)}</td>
                                        <td>${task.allPendingTillDate ?? 0}</td>
                                    </tr>
                                    `;
                                }).join('') : `
                                    <tr>
                                        <td colspan="10" style="text-align: center; padding: 40px 20px; color: #64748b; background: #f8fafc;">
                                            <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">Not Available This Week Record</div>
                                            <div style="font-size: 12px; color: #94a3b8;">Task details are not recorded for the period ${dateRangeStr} in the "Task Wise Record" sheet.</div>
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                            ${tasks.length > 0 ? `
                            <tfoot>
                                <tr style="background-color: #f8fafc; font-weight: 700; border-top: 2px solid #cbd5e1;">
                                    <td colspan="3" style="font-weight: 800; font-size: 10px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">TOTAL (${tasks.length} TASKS)</td>
                                    <td style="font-weight: 800; font-size: 10px; text-align: center; color: #0f172a;">${totalTarget}</td>
                                    <td style="font-weight: 800; font-size: 10px; text-align: center; color: #0f172a;">${totalActual}</td>
                                    <td style="font-weight: 800; font-size: 10px; text-align: center; color: #0f172a;">${totalActualOnTime}</td>
                                    <td style="text-align: center;">
                                        <span class="badge ${totalBadgeClass}" style="font-size: 9.5px; font-weight: 800; padding: 2px 7px;">${totalAchievement}</span>
                                    </td>
                                    <td style="font-weight: 800; font-size: 10px; text-align: center; color: #dc2626;">${formatPercent(selectedUserDetails.workNotDone || selectedUserDetails.weeklyWorkDone)}</td>
                                    <td style="font-weight: 800; font-size: 10px; text-align: center; color: #dc2626;">${formatPercent(selectedUserDetails.workNotDoneOnTime || selectedUserDetails.weeklyWorkDoneOnTime)}</td>
                                    <td style="font-weight: 800; font-size: 10px; text-align: center; color: #0f172a;">${totalPending}</td>
                                </tr>
                            </tfoot>` : ''}
                        </table>

                        <div class="sign-section">
                            <div class="signature-line">
                                Supervisor Signature
                                <div style="font-size: 8px; margin-top: 15px; border-top: 0.5px solid #e2e8f0; width: 60%; margin-left: 20%; padding-top: 2px;">Date</div>
                            </div>
                            <div class="signature-line">
                                Employee Signature
                                <div style="font-size: 8px; margin-top: 15px; border-top: 0.5px solid #e2e8f0; width: 60%; margin-left: 20%; padding-top: 2px;">Date</div>
                            </div>
                        </div>
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
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-[96vw] 2xl:max-w-[1700px] max-h-[94vh] flex flex-col border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 border-b border-gray-200 bg-gray-50 flex-shrink-0">
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
                                {selectedUserDetails.firm && (
                                    <>
                                        <span className="text-gray-300">•</span>
                                        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 uppercase tracking-wide">
                                            {selectedUserDetails.firm}
                                        </span>
                                    </>
                                )}
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
                <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
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
                        <div className="hidden md:block overflow-auto max-h-[calc(94vh-185px)] border border-gray-200 rounded-lg relative shadow-xs">
                            <table className="w-full min-w-full divide-y divide-gray-200 border-separate border-spacing-0 text-left">
                                <thead className="bg-gray-100 sticky top-0 z-20 shadow-xs">
                                    <tr>
                                        <th className="sticky top-0 bg-gray-100 z-20 px-2 sm:px-3 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 text-center">FMS NAME</th>
                                        <th className="sticky top-0 bg-gray-100 z-20 px-2 sm:px-3 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 text-center">TASK NAME</th>
                                        <th className="sticky top-0 bg-gray-100 z-20 px-2 sm:px-3 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 text-center">DEPARTMENT</th>
                                        <th className="sticky top-0 bg-gray-100 z-20 px-2 sm:px-3 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 text-center">TARGET</th>
                                        <th className="sticky top-0 bg-gray-100 z-20 px-2 sm:px-3 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 text-center">ACTUAL ACHIEVEMENT</th>
                                        <th className="sticky top-0 bg-gray-100 z-20 px-2 sm:px-3 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 text-center">ACTUAL ON TIME</th>
                                        <th className="sticky top-0 bg-gray-100 z-20 px-2 sm:px-3 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 text-center">TOTAL ACHIEVEMENT</th>
                                        <th className="sticky top-0 bg-gray-100 z-20 px-2 sm:px-3 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 text-center">% WORK NOT DONE</th>
                                        <th className="sticky top-0 bg-gray-100 z-20 px-2 sm:px-3 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 text-center">% WORK NOT DONE ON TIME</th>
                                        <th className="sticky top-0 bg-gray-100 z-20 px-2 sm:px-3 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 text-center">ALL PENDING</th>
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
                                                    <td className="px-2 sm:px-3 py-2 text-xs text-gray-800 font-medium border-b border-gray-100 text-center">{task.fmsName || "-"}</td>
                                                    <td className="px-2 sm:px-3 py-2 text-xs text-gray-900 font-semibold border-b border-gray-100 text-center">{task.taskName || task.systemType || "-"}</td>
                                                    <td className="px-2 sm:px-3 py-2 text-xs text-gray-600 border-b border-gray-100 text-center">{task.department || "-"}</td>
                                                    <td className="px-2 sm:px-3 py-2 text-xs text-gray-900 font-bold border-b border-gray-100 text-center">{task.target}</td>
                                                    <td className="px-2 sm:px-3 py-2 text-xs text-gray-900 font-medium border-b border-gray-100 text-center">{task.actualAchievement}</td>
                                                    <td className="px-2 sm:px-3 py-2 text-xs text-gray-900 font-medium border-b border-gray-100 text-center">{task.actualOnTime ?? 0}</td>
                                                    <td className="px-2 sm:px-3 py-2 text-xs font-bold border-b border-gray-100 text-center">
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
                                                    <td className="px-2 sm:px-3 py-2 text-xs text-gray-900 border-b border-gray-100 text-center font-medium">
                                                        {formatDecimal(task.workNotDone)}
                                                    </td>
                                                    <td className="px-2 sm:px-3 py-2 text-xs text-gray-900 border-b border-gray-100 text-center font-medium">
                                                        {formatDecimal(task.workNotDoneOnTime)}
                                                    </td>
                                                    <td className="px-2 sm:px-3 py-2 text-xs text-gray-700 border-b border-gray-100 text-center font-medium">
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
                                {selectedUserDetails.tasks && selectedUserDetails.tasks.length > 0 && (
                                    <tfoot className="bg-gray-100 font-bold sticky bottom-0 border-t-2 border-gray-300">
                                        <tr>
                                            <td colSpan="3" className="px-2 sm:px-3 py-2 text-xs font-bold text-gray-900 border-b border-gray-200 text-center uppercase tracking-wider">
                                                Total ({selectedUserDetails.tasks.length} Tasks)
                                            </td>
                                            <td className="px-2 sm:px-3 py-2 text-xs font-bold text-gray-900 border-b border-gray-200 text-center">
                                                {selectedUserDetails.tasks.reduce((sum, t) => sum + (parseFloat(t.target) || 0), 0)}
                                            </td>
                                            <td className="px-2 sm:px-3 py-2 text-xs font-bold text-gray-900 border-b border-gray-200 text-center">
                                                {selectedUserDetails.tasks.reduce((sum, t) => sum + (parseFloat(t.actualAchievement) || 0), 0)}
                                            </td>
                                            <td className="px-2 sm:px-3 py-2 text-xs font-bold text-gray-900 border-b border-gray-200 text-center">
                                                {selectedUserDetails.tasks.reduce((sum, t) => sum + (parseFloat(t.actualOnTime) || 0), 0)}
                                            </td>
                                            <td className="px-2 sm:px-3 py-2 text-xs font-bold border-b border-gray-200 text-center">
                                                {(() => {
                                                    const totalAch = selectedUserDetails.tasks.reduce((sum, t) => sum + (parseFloat(t.totalAchievement) || 0), 0);
                                                    const totalTgt = selectedUserDetails.tasks.reduce((sum, t) => sum + (parseFloat(t.target) || 0), 0);
                                                    return (
                                                        <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-bold ${
                                                            totalAch < totalTgt ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                                        }`}>
                                                            {totalAch}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-2 sm:px-3 py-2 text-xs font-bold text-red-600 border-b border-gray-200 text-center">
                                                {formatPercent(selectedUserDetails.workNotDone || selectedUserDetails.weeklyWorkDone)}
                                            </td>
                                            <td className="px-2 sm:px-3 py-2 text-xs font-bold text-red-600 border-b border-gray-200 text-center">
                                                {formatPercent(selectedUserDetails.workNotDoneOnTime || selectedUserDetails.weeklyWorkDoneOnTime)}
                                            </td>
                                            <td className="px-2 sm:px-3 py-2 text-xs font-bold text-gray-900 border-b border-gray-200 text-center">
                                                {selectedUserDetails.tasks.reduce((sum, t) => sum + (parseFloat(t.allPendingTillDate) || 0), 0)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
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
                                                    <p className="text-[10px] text-gray-400 font-medium uppercase">Actual On Time</p>
                                                    <p className="font-semibold text-gray-700">{task.actualOnTime ?? 0}</p>
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
