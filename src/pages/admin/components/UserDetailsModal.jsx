import React from "react";
import ReactDOM from "react-dom";
import { X, Loader2, Filter, Calendar, ChevronDown, Printer } from "lucide-react";

const UserDetailsModal = ({
    selectedUserDetails,
    setSelectedUserDetails,
    activeDrillDown,
    setActiveDrillDown,
    handleDrillDown,
}) => {
    const [timeFilter, setTimeFilter] = React.useState("all");
    const [statusFilter, setStatusFilter] = React.useState("all");

    const formatDecimal = (val) => {
        if (val === undefined || val === null || val === "") return "0";
        let str = String(val).trim().replace(/%/g, "");
        const num = parseFloat(str);
        if (isNaN(num)) return str;
        return num % 1 === 0 ? String(num) : num.toFixed(2);
    };

    const handlePrint = () => {
        if (!selectedUserDetails) return;

        const printWindow = window.open('', '_blank');
        const tasks = selectedUserDetails.tasks || [];
        const today = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        const formatPercent = (val) => {
            if (val === undefined || val === null || val === '') return '0%';
            let str = String(val).trim();
            const num = parseFloat(str);
            if (!isNaN(num)) {
                // Round to 2 decimal places if it's a float
                const rounded = num % 1 === 0 ? num : num.toFixed(2);
                return `${rounded}%`;
            }
            if (str.endsWith('%')) return str;
            return `${str}%`;
        };

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

                        .footer {
                            margin-top: 40px;
                            padding-top: 15px;
                            border-top: 1px solid #e2e8f0;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            font-size: 9px;
                            color: #94a3b8;
                            font-weight: 500;
                        }

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
                                <p class="report-date">Audit Date: ${today}</p>
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
                                <span class="stat-value">${formatPercent(selectedUserDetails.weeklyWorkDone)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Weekly Not Done On-Time %</span>
                                <span class="stat-value">${formatPercent(selectedUserDetails.weeklyWorkDoneOnTime)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Pending Backlog</span>
                                <span class="stat-value" style="color: #ef4444;">${selectedUserDetails.allPendingTillDate || 0}</span>
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
                                ${tasks.map(task => {
                                    const targetVal = parseFloat(task.target) || 0;
                                    const totalAchVal = parseFloat(task.totalAchievement) || 0;
                                    const isZero = totalAchVal === 0 && targetVal > 0;
                                    const isTargetMet = (targetVal > 0 && totalAchVal >= targetVal) || (targetVal === 0 && totalAchVal > 0);
                                    const badgeClass = isZero ? 'badge-red' : (isTargetMet ? 'badge-green' : 'badge-blue');

                                    return `
                                    <tr>
                                        <td style="font-weight: 500;">${task.fmsName || '-'}</td>
                                        <td style="font-weight: 600; color: #0f172a;">${task.taskName || '-'}</td>
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
                                }).join('')}
                            </tbody>
                            <tfoot>
                                <tr style="background-color: #f8fafc; font-weight: 700; border-top: 2px solid #cbd5e1;">
                                    <td colspan="3" style="font-weight: 800; font-size: 10px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">TOTAL (${tasks.length} TASKS)</td>
                                    <td style="font-weight: 800; font-size: 10px; text-align: center; color: #0f172a;">${totalTarget}</td>
                                    <td style="font-weight: 800; font-size: 10px; text-align: center; color: #0f172a;">${totalActual}</td>
                                    <td style="font-weight: 800; font-size: 10px; text-align: center; color: #0f172a;">${totalActualOnTime}</td>
                                    <td style="text-align: center;">
                                        <span class="badge ${totalBadgeClass}" style="font-size: 9.5px; font-weight: 800; padding: 2px 7px;">${totalAchievement}</span>
                                    </td>
                                    <td style="font-weight: 800; font-size: 10px; text-align: center; color: #dc2626;">${formatPercent(selectedUserDetails.weeklyWorkDone)}</td>
                                    <td style="font-weight: 800; font-size: 10px; text-align: center; color: #dc2626;">${formatPercent(selectedUserDetails.weeklyWorkDoneOnTime)}</td>
                                    <td style="font-weight: 800; font-size: 10px; text-align: center; color: #0f172a;">${totalPending}</td>
                                </tr>
                            </tfoot>
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

                        <div class="footer">
                            <span>System Auth: MIS-RPT-${new Date().getTime().toString().slice(-8)}</span>
                            <span>Report Generated by MIS Intelligence Portal</span>
                            <span>Page 1 of 1</span>
                        </div>
                    </div>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 800);
    };

    const parseDate = (dateStr) => {
        if (!dateStr) return null;
        // Expected format: dd/mm/yyyy hh:mm:ss
        const parts = dateStr.split(" ");
        const dateParts = parts[0].split("/");
        if (dateParts.length !== 3) return null;
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const year = parseInt(dateParts[2], 10);

        if (parts.length > 1) {
            const timeParts = parts[1].split(":");
            const hours = parseInt(timeParts[0], 10) || 0;
            const minutes = parseInt(timeParts[1], 10) || 0;
            const seconds = parseInt(timeParts[2], 10) || 0;
            return new Date(year, month, day, hours, minutes, seconds);
        }
        return new Date(year, month, day);
    };

    const isOnTimeRow = (row) => {
        const delay = String(row.delay || "").trim();
        const actual = String(row.actual || "").trim();
        // On Time: actual is filled AND delay is zero, empty, or 00:00:00
        return actual !== "" && (delay === "00:00:00" || delay === "0" || delay === "00:00" || delay === "");
    };

    const isPendingRow = (row) => {
        const actual = String(row.actual || "").trim();
        return actual === "";
    };

    const isDelayRow = (row) => {
        const delay = String(row.delay || "").trim();
        const actual = String(row.actual || "").trim();
        // Delay: has a real delay value (not empty, not zero) AND is NOT pending (actual is NOT blank)
        return actual !== "" && delay !== "" && delay !== "00:00:00" && delay !== "0";
    };

    const getRowBg = (row) => {
        // Pending (actual blank) takes highest priority — even if delay exists
        if (isPendingRow(row)) return "bg-rose-100 hover:bg-rose-200";
        if (isDelayRow(row)) return "bg-orange-100 hover:bg-orange-200";
        if (isOnTimeRow(row)) return "bg-green-100 hover:bg-green-200";
        return "hover:bg-gray-50";
    };

    const filteredRows = React.useMemo(() => {
        if (!activeDrillDown || !activeDrillDown.rows) return [];

        let rows = activeDrillDown.rows;

        // Status filter
        if (statusFilter === "ontime") rows = rows.filter(isOnTimeRow);
        else if (statusFilter === "pending") rows = rows.filter(isPendingRow);
        else if (statusFilter === "delay") rows = rows.filter(isDelayRow);

        // Time filter
        if (timeFilter === "all") return rows;

        const now = new Date();
        const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return rows.filter(row => {
            const rowDate = parseDate(row.actual) || parseDate(row.planned);
            if (!rowDate) return false;

            if (timeFilter === "today") {
                return rowDate >= todayAtMidnight;
            } else if (timeFilter === "week") {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return rowDate >= weekAgo;
            } else if (timeFilter === "month") {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return rowDate >= monthAgo;
            }
            return true;
        });
    }, [activeDrillDown, timeFilter, statusFilter]);

    return (
        <>
            {/* User Details Modal - Rendered via Portal to cover header/sidebar */}
            {selectedUserDetails && ReactDOM.createPortal(
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[100] flex items-center justify-center p-2 sm:p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[96vw] 2xl:max-w-[1700px] max-h-[94vh] overflow-hidden flex flex-col border border-gray-200">
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <img
                                    className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                                    src={selectedUserDetails.image}
                                    alt={selectedUserDetails.name}
                                />
                                <div className="min-w-0">
                                    <h2 className="text-base font-bold text-gray-900 truncate">
                                        {selectedUserDetails.name}
                                    </h2>
                                    <p className="text-xs text-gray-500 truncate flex items-center gap-1.5 mt-0.5">
                                        <span>{selectedUserDetails.department}</span>
                                        {selectedUserDetails.firm && (
                                            <>
                                                <span className="text-gray-300">•</span>
                                                <span className="font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">{selectedUserDetails.firm}</span>
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
                                >
                                    <Printer className="w-4 h-4" />
                                    <span>Print Tasks</span>
                                </button>
                                <button
                                    onClick={() => setSelectedUserDetails(null)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 cursor-pointer"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        </div>
                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-3 sm:p-5 space-y-4">
                                {/* Tasks Details Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                                            Task Details
                                        </h3>
                                        {selectedUserDetails.tasks && (
                                            <span className="text-xs text-gray-500 font-medium">
                                                {selectedUserDetails.tasks.length} tasks
                                            </span>
                                        )}
                                    </div>

                                    {/* Desktop View - Table */}
                                    <div className="hidden md:block overflow-auto max-h-[calc(94vh-185px)] border border-gray-200 rounded-lg relative shadow-xs">
                                        <table className="w-full min-w-full divide-y divide-gray-200 border-separate border-spacing-0">
                                            <thead className="bg-gray-100 sticky top-0 z-20 shadow-xs">
                                                <tr>
                                                    <th className="sticky top-0 bg-gray-100 z-20 px-2 sm:px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">FMS Name</th>
                                                    <th className="sticky top-0 bg-gray-100 z-20 px-2 sm:px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Task Name</th>
                                                    <th className="sticky top-0 bg-gray-100 z-20 px-2 sm:px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Department</th>
                                                    <th className="sticky top-0 bg-gray-100 z-20 px-2 sm:px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Target</th>
                                                    <th className="sticky top-0 bg-gray-100 z-20 px-2 sm:px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Actual Achievement</th>
                                                    <th className="sticky top-0 bg-gray-100 z-20 px-2 sm:px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Actual On Time</th>
                                                    <th className="sticky top-0 bg-gray-100 z-20 px-2 sm:px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Total Achievement</th>
                                                    <th className="sticky top-0 bg-gray-100 z-20 px-2 sm:px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">% Work Not Done</th>
                                                    <th className="sticky top-0 bg-gray-100 z-20 px-2 sm:px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">% Work Not Done on Time</th>
                                                    <th className="sticky top-0 bg-gray-100 z-20 px-2 sm:px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">All Pending Till Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {selectedUserDetails.tasks && selectedUserDetails.tasks.length > 0 ? (
                                                    selectedUserDetails.tasks.map((task, idx) => (
                                                        <tr
                                                            key={idx}
                                                            onClick={(e) => handleDrillDown(task, "Total Achievement", task.totalAchievement, e)}
                                                            className="hover:bg-indigo-50 cursor-pointer transition-colors"
                                                        >
                                                            <td className="px-2 sm:px-3 py-2 text-xs text-gray-900 border-b border-gray-100 text-center">{task.fmsName}</td>
                                                            <td className="px-2 sm:px-3 py-2 text-xs text-gray-900 border-b border-gray-100 text-center">{task.taskName}</td>
                                                            <td className="px-2 sm:px-3 py-2 text-xs text-gray-900 border-b border-gray-100 text-center">{task.department}</td>
                                                            <td className="px-2 sm:px-3 py-2 text-xs text-gray-900 font-medium border-b border-gray-100 text-center">{task.target}</td>
                                                            <td className="px-2 sm:px-3 py-2 text-xs text-gray-900 font-medium border-b border-gray-100 text-center">{task.actualAchievement}</td>
                                                            <td className="px-2 sm:px-3 py-2 text-xs text-gray-900 font-medium border-b border-gray-100 text-center">{task.actualOnTime ?? 0}</td>
                                                            <td className="px-2 sm:px-3 py-2 text-xs font-medium border-b border-gray-100 text-center">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${parseFloat(task.totalAchievement) < parseFloat(task.target) ? "bg-red-100 text-red-800" : parseFloat(task.totalAchievement) === parseFloat(task.target) ? "bg-green-100 text-green-800" : "bg-indigo-100 text-indigo-800"}`}>
                                                                    {task.totalAchievement}
                                                                </span>
                                                            </td>
                                                            <td className="px-2 sm:px-3 py-2 text-xs text-gray-900 border-b border-gray-100 text-center">{formatDecimal(task.workNotDone)}</td>
                                                            <td className="px-2 sm:px-3 py-2 text-xs text-gray-900 border-b border-gray-100 text-center">{formatDecimal(task.workNotDoneOnTime)}</td>
                                                            <td className="px-2 sm:px-3 py-2 text-xs text-gray-900 border-b border-gray-100 text-center">{task.allPendingTillDate}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr><td colSpan="10" className="px-3 py-2 text-center text-xs text-gray-500">No tasks available</td></tr>
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
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${totalAch < totalTgt ? "bg-red-100 text-red-800" : totalAch === totalTgt ? "bg-green-100 text-green-800" : "bg-indigo-100 text-indigo-800"}`}>
                                                                        {totalAch}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </td>
                                                        <td className="px-2 sm:px-3 py-2 text-xs font-bold text-red-600 border-b border-gray-200 text-center">
                                                            {formatDecimal(selectedUserDetails.weeklyWorkDone)}%
                                                        </td>
                                                        <td className="px-2 sm:px-3 py-2 text-xs font-bold text-red-600 border-b border-gray-200 text-center">
                                                            {formatDecimal(selectedUserDetails.weeklyWorkDoneOnTime)}%
                                                        </td>
                                                        <td className="px-2 sm:px-3 py-2 text-xs font-bold text-gray-900 border-b border-gray-200 text-center">
                                                            {selectedUserDetails.tasks.reduce((sum, t) => sum + (parseFloat(t.allPendingTillDate) || 0), 0)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>
                                    </div>

                                    {/* Mobile View - Cards */}
                                    <div className="md:hidden space-y-3">
                                        {selectedUserDetails.tasks && selectedUserDetails.tasks.length > 0 ? (
                                            selectedUserDetails.tasks.map((task, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={(e) => handleDrillDown(task, "Total Achievement", task.totalAchievement, e)}
                                                    className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm active:bg-indigo-50 transition-colors"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider truncate mb-0.5">{task.fmsName}</p>
                                                            <h4 className="text-sm font-bold text-gray-900 truncate">{task.taskName}</h4>
                                                        </div>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${parseFloat(task.totalAchievement) < parseFloat(task.target) ? "bg-red-100 text-red-800" : parseFloat(task.totalAchievement) === parseFloat(task.target) ? "bg-green-100 text-green-800" : "bg-indigo-100 text-indigo-800"}`}>
                                                            {task.totalAchievement} / {task.target}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-t border-gray-50 pt-2">
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-medium uppercase">Dept</p>
                                                            <p className="text-xs text-gray-700 font-semibold truncate">{task.department}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-medium uppercase">Actual Achievement</p>
                                                            <p className="text-xs text-gray-700 font-semibold">{task.actualAchievement}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-medium uppercase">Actual On Time</p>
                                                            <p className="text-xs text-gray-700 font-semibold">{task.actualOnTime ?? 0}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-medium uppercase">All Pending</p>
                                                            <p className="text-xs text-gray-700 font-semibold">{task.allPendingTillDate}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-medium uppercase">% Not Done</p>
                                                            <p className="text-xs text-gray-700 font-semibold">{formatDecimal(task.workNotDone)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-medium uppercase">% Late</p>
                                                            <p className="text-xs text-gray-700 font-semibold">{formatDecimal(task.workNotDoneOnTime)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                                <p className="text-xs text-gray-500">No tasks available</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-3 flex justify-end gap-2 flex-shrink-0">
                            <button
                                onClick={() => setSelectedUserDetails(null)}
                                className="px-3 py-2 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
                , document.body)}

            {/* Drill Down Modal - Rendered via Portal above User Details Modal */}
            {activeDrillDown && ReactDOM.createPortal(
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[110] flex items-center justify-center p-2 sm:p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-fadeIn border border-gray-200">
                        <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg flex-wrap">
                            {/* Title */}
                            <div className="min-w-0">
                                <h3 className="text-base font-bold text-gray-900 leading-tight">
                                    {activeDrillDown.title}
                                </h3>
                                <p className="text-xs text-gray-500 truncate">
                                    {activeDrillDown.taskId} • <span className="font-bold text-indigo-600">Total Tasks: {filteredRows.length}</span>
                                </p>
                            </div>
                            {/* Filters + Close */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {!activeDrillDown.loading && !activeDrillDown.error && (
                                    <>
                                        {/* Status Buttons */}
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => setStatusFilter("all")} className={`px-2 py-1 text-xs font-medium rounded transition-all ${statusFilter === "all" ? "bg-gray-800 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"}`}>All</button>
                                            <button onClick={() => setStatusFilter("ontime")} className={`px-2 py-1 text-xs font-medium rounded transition-all ${statusFilter === "ontime" ? "bg-green-600 text-white" : "bg-green-50 text-green-700 hover:bg-green-100"}`}>On Time</button>
                                            <button onClick={() => setStatusFilter("pending")} className={`px-2 py-1 text-xs font-medium rounded transition-all ${statusFilter === "pending" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 hover:bg-rose-100"}`}>Pending</button>
                                            <button onClick={() => setStatusFilter("delay")} className={`px-2 py-1 text-xs font-medium rounded transition-all ${statusFilter === "delay" ? "bg-orange-600 text-white" : "bg-orange-50 text-orange-700 hover:bg-orange-100"}`}>Delay</button>
                                        </div>
                                    </>
                                )}
                                {/* Close Button */}
                                <button onClick={() => setActiveDrillDown(null)} className="p-1 hover:bg-gray-200 rounded-full transition-colors ml-1">
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            {activeDrillDown.loading ? (
                                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                    <p className="text-sm text-gray-500">Loading data...</p>
                                </div>
                            ) : activeDrillDown.error ? (
                                <div className="flex flex-col items-center justify-center py-10">
                                    <p className="text-sm text-red-500">Error: {activeDrillDown.error}</p>
                                </div>
                            ) : (
                                <div className="p-4">
                                    {/* Desktop View - Table */}
                                    <div className="hidden md:block overflow-auto max-h-[55vh] border border-gray-200 rounded-lg relative">
                                        <table className="min-w-full divide-y divide-gray-200 border-separate border-spacing-0">
                                            <thead className="bg-gray-50 sticky top-0 z-20 shadow-xs">
                                                <tr>
                                                    <th className="sticky top-0 bg-gray-50 z-20 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Task Name</th>
                                                    <th className="sticky top-0 bg-gray-50 z-20 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Planned</th>
                                                    <th className="sticky top-0 bg-gray-50 z-20 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">Actual</th>
                                                    <th className="sticky top-0 bg-gray-50 z-20 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Delay</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredRows && filteredRows.length > 0 ? (
                                                    filteredRows.map((row, idx) => (
                                                        <tr key={idx} className={`${getRowBg(row)} transition-colors`}>
                                                            <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100">{row.taskName}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100">{row.planned}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-500 border-b border-gray-100">{row.actual || '-'}</td>
                                                            <td className={`px-4 py-3 text-sm font-medium border-b border-gray-100 ${isDelayRow(row) ? 'text-orange-600' : 'text-gray-700'}`}>{row.delay || '00:00:00'}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr><td colSpan="4" className="px-4 py-10 text-center text-sm text-gray-500">No data available</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile View - Cards */}
                                    <div className="md:hidden space-y-3">
                                        {filteredRows && filteredRows.length > 0 ? (
                                            filteredRows.map((row, idx) => (
                                                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                                                    <h4 className="text-sm font-bold text-gray-900 mb-2">{row.taskName}</h4>
                                                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-t border-gray-50 pt-2">
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-medium uppercase">Planned</p>
                                                            <p className="text-xs text-gray-700 font-semibold">{row.planned}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-medium uppercase">Actual</p>
                                                            <p className="text-xs text-gray-700 font-semibold">{row.actual}</p>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <p className="text-[10px] text-gray-400 font-medium uppercase">Delay</p>
                                                            <p className={`text-xs font-semibold ${row.delay && String(row.delay).toLowerCase().includes('late') ? 'text-red-600' : 'text-emerald-600'}`}>
                                                                {row.delay || 'On Time'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                                <p className="text-xs text-gray-500">No data available</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end">
                            <button
                                onClick={() => setActiveDrillDown(null)}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
                , document.body)}
        </>
    );
};

export default UserDetailsModal;
