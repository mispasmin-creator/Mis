import React, { useState, useEffect, useMemo } from "react";
import { Search, Loader2, History, AlertCircle, Printer, Download, Calendar } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import CategoryTabs from "../../components/CategoryTabs";
import { categorizeByBasis, CATEGORY_KEYS, CATEGORY_LABELS } from "../../utils/categorize";
import { extractDateRange, printHistoryReport, downloadHistoryPDF } from "../../utils/historyReportPrint";
import { getDisplayableImageUrl } from "../../utils/imageUtils";
import HistoryTaskModal from "./components/HistoryTaskModal";
import SearchableSelect from "../../components/common/SearchableSelect";

const AdminHistoryCommitment = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(CATEGORY_KEYS.MIS);
    const [searchQuery, setSearchQuery] = useState("");
    const [nameFilter, setNameFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [firmFilter, setFirmFilter] = useState("all");
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    // Task details modal state & data from "Task Wise Record" sheet
    const [selectedUserDetails, setSelectedUserDetails] = useState(null);
    const [taskWiseData, setTaskWiseData] = useState([]);
    const [imageMap, setImageMap] = useState({});
    const [departmentMap, setDepartmentMap] = useState({});

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                setLoading(true);
                const scriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
                if (!scriptUrl) {
                    console.error("VITE_APPS_SCRIPT_URL not set");
                    setLoading(false);
                    return;
                }

                // Fetch Records, Master, Data, and Task Wise Record sheets in parallel
                const [recordsResponse, masterResponse, dataResponse, taskWiseResponse] = await Promise.all([
                    fetch(`${scriptUrl}?sheet=Records`),
                    fetch(`${scriptUrl}?sheet=Master`),
                    fetch(`${scriptUrl}?sheet=Data`),
                    fetch(`${scriptUrl}?sheet=Task Wise Record`)
                ]);
                const result = await recordsResponse.json();
                const masterResult = await masterResponse.json();
                const dataResult = await dataResponse.json();
                const taskWiseResult = await taskWiseResponse.json();

                const reportedByMap = {};
                const firmMap = {};
                const incentiveMap = {};
                const imgMap = {};
                const deptMap = {};

                // 1. Extract Incentive Category & Firm Name from Data Sheet (Column V / index 21, Column W / index 22)
                if (dataResult.success && Array.isArray(dataResult.data)) {
                    const headerRow = dataResult.data[0] || [];
                    let incentiveColIdx = headerRow.findIndex(h => h && String(h).trim().toLowerCase() === "incentive category");
                    if (incentiveColIdx === -1) incentiveColIdx = 21;
                    let firmColIdx = headerRow.findIndex(h => h && String(h).trim().toLowerCase() === "firm name");
                    if (firmColIdx === -1) firmColIdx = 22;

                    dataResult.data.slice(1).forEach(row => {
                        const pName = row[4] ? String(row[4]).trim().toLowerCase() : "";
                        const cat = row[incentiveColIdx] ? String(row[incentiveColIdx]).trim() : "";
                        const firm = row[firmColIdx] ? String(row[firmColIdx]).trim() : "";
                        if (pName && cat && !incentiveMap[pName]) {
                            incentiveMap[pName] = cat;
                        }
                        if (pName && firm && !firmMap[pName]) {
                            firmMap[pName] = firm;
                        }
                    });
                }

                // 2. Extract mappings from Master sheet
                if (masterResult.success && Array.isArray(masterResult.data)) {
                    const masterHeader = masterResult.data[0] || [];
                    let masterIncentiveIdx = masterHeader.findIndex(h => h && String(h).trim().toLowerCase() === "incentive category");
                    if (masterIncentiveIdx === -1) masterIncentiveIdx = 10;
                    let masterFirmIdx = masterHeader.findIndex(h => h && String(h).trim().toLowerCase() === "firm name");
                    if (masterFirmIdx === -1) masterFirmIdx = 8;

                    masterResult.data.slice(1).forEach(row => {
                        const name = row[0] ? String(row[0]).trim().toLowerCase() : "";
                        const department = row[2] ? String(row[2]).trim() : "";
                        const imageUrl = row[4] ? String(row[4]).trim() : "";
                        const reportedBy = row[9] ? String(row[9]).trim().toLowerCase() : "";
                        const firmName = row[masterFirmIdx] ? String(row[masterFirmIdx]).trim() : "";
                        const masterIncentive = row[masterIncentiveIdx] ? String(row[masterIncentiveIdx]).trim() : "";

                        if (name) {
                            if (department) deptMap[name] = department;
                            if (imageUrl) imgMap[name] = imageUrl;
                            if (reportedBy) reportedByMap[name] = reportedBy;
                            if (firmName && !firmMap[name]) firmMap[name] = firmName;
                            if (masterIncentive && !incentiveMap[name]) {
                                incentiveMap[name] = masterIncentive;
                            }
                        }
                    });
                }

                setImageMap(imgMap);
                setDepartmentMap(deptMap);

                // 3. Store Task Wise Record sheet data
                if (taskWiseResult.success && Array.isArray(taskWiseResult.data)) {
                    setTaskWiseData(taskWiseResult.data);
                }

                if (result.success && Array.isArray(result.data)) {
                    const recordsHeader = result.data[0] || [];
                    let recordsIncentiveIdx = recordsHeader.findIndex(h => h && String(h).trim().toLowerCase() === "incentive category");
                    if (recordsIncentiveIdx === -1 && recordsHeader.length > 21) {
                        recordsIncentiveIdx = 21;
                    }

                    // Skip header row (index 0), map each row and determine category
                    const parsed = result.data.slice(1).map((row, idx) => {
                        const empName = row[2] || "";
                        const normalizedName = String(empName).trim().toLowerCase();
                        
                        // Direct column V from Records or cross-referenced from Data/Master
                        const directIncentive = (recordsIncentiveIdx >= 0 && row[recordsIncentiveIdx]) ? String(row[recordsIncentiveIdx]).trim() : "";
                        const resolvedIncentive = directIncentive || incentiveMap[normalizedName] || "";
                        const category = categorizeByBasis(resolvedIncentive);

                        return {
                            id: idx,
                            dateStart: row[0] || "",         // Column A (index 0)
                            dateEnd: row[1] || "",           // Column B (index 1)
                            name: empName,                   // Column C (index 2)
                            firm: firmMap[normalizedName] || "",
                            incentiveCategory: resolvedIncentive,
                            category: category,
                            target: row[3] || "",            // Column D (index 3)
                            actualWorkDone: row[4] || "",    // Column E (index 4)
                            workNotDone: row[5] || "",       // Column F (index 5)
                            workNotDoneOnTime: row[6] || "", // Column G (index 6)
                            totalWorkDone: row[7] || "",     // Column H (index 7)
                            weekPending: row[8] || "",       // Column I (index 8)
                            allPendingTillDate: row[9] || "", // Column J (index 9)
                            lastWeekPlannedNotDone: row[10] || "", // Column K (index 10)
                            lastWeekPlannedNotDoneOnTime: row[11] || "", // Column L (index 11)
                            lastWeekCommitment: row[12] || "", // Column M (index 12)
                            linkWithName: row[13] || "", // Column N (index 13)
                            nextWeekPlannedNotDone: row[14] || "", // Column O (index 14)
                            nextWeekPlannedNotDoneOnTime: row[15] || "", // Column P (index 15)
                            nextWeekCommitment: row[16] || "" // Column Q (index 16)
                        };
                    }).filter(r => r.name.trim() !== "");

                    const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');
                    const isHod = user && user.role === 'hod';
                    const lowerName = (user?.name || "").toLowerCase().trim();
                    const lowerId = (user?.id || "").toLowerCase().trim();

                    // Filter based on role (Admin/Superadmin sees all, HOD sees self + reportees, Ordinary User sees self only)
                    const finalRecords = isAdmin
                        ? parsed
                        : isHod
                        ? parsed.filter(r => {
                            const empLowerName = r.name.toLowerCase().trim();
                            const empManager = reportedByMap[empLowerName] || "";
                            return empLowerName === lowerName || empManager === lowerName || empManager === lowerId;
                          })
                        : parsed.filter(r => {
                            const empLowerName = r.name.toLowerCase().trim();
                            return empLowerName === lowerName;
                          });

                    setRecords(finalRecords);
                }
            } catch (error) {
                console.error("Error fetching Records & Master sheet:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecords();
    }, [user]);

    // Helper to normalize various date formats (e.g. 23-Aug-2026, 2026-08-23, 23/08/2026) to YYYY-MM-DD
    const normalizeDate = (d) => {
        if (!d) return "";
        const str = String(d).trim();
        if (!str) return "";

        const monthMap = {
            jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
            jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
        };

        // Check custom format like 23-Aug-2026 or 6-Jul-2026
        const customMatch = str.match(/^(\d{1,2})[-/ ]([a-zA-Z]{3,})[-/ ](\d{4})$/);
        if (customMatch) {
            const dd = customMatch[1].padStart(2, '0');
            const monStr = customMatch[2].substring(0, 3).toLowerCase();
            const mm = monthMap[monStr] || '01';
            const yyyy = customMatch[3];
            return `${yyyy}-${mm}-${dd}`;
        }

        // Check ISO format YYYY-MM-DD
        const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
        if (isoMatch) {
            const yyyy = isoMatch[1];
            const mm = isoMatch[2].padStart(2, '0');
            const dd = isoMatch[3].padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }

        // Check DD/MM/YYYY or DD-MM-YYYY
        const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
        if (dmyMatch) {
            const dd = dmyMatch[1].padStart(2, '0');
            const mm = dmyMatch[2].padStart(2, '0');
            const yyyy = dmyMatch[3];
            return `${yyyy}-${mm}-${dd}`;
        }

        const parsed = new Date(str);
        if (!isNaN(parsed.getTime())) {
            const yyyy = parsed.getFullYear();
            const mm = String(parsed.getMonth() + 1).padStart(2, '0');
            const dd = String(parsed.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }

        return str.toLowerCase();
    };

    // Handle row click in History table to open popup matching Date Start (Col A) & Date End (Col B) from Task Wise Record
    const handleRowClick = (record) => {
        if (!record || !record.name) return;

        const recordName = String(record.name || "").trim().toLowerCase();
        const normRecordDateStart = normalizeDate(record.dateStart);
        const normRecordDateEnd = normalizeDate(record.dateEnd);

        // Header in Task Wise Record
        const headerRowIdx = taskWiseData.findIndex(row => 
            row.some(c => String(c).toLowerCase().includes("date start") || String(c).toLowerCase().includes("system type") || String(c).toLowerCase().includes("fms name"))
        );
        const headerRow = headerRowIdx >= 0 ? taskWiseData[headerRowIdx] : (taskWiseData[0] || []);
        const rowsToProcess = headerRowIdx >= 0 ? taskWiseData.slice(headerRowIdx + 1) : taskWiseData.slice(1);

        const findColIdx = (keywords, defaultIdx) => {
            if (!headerRow || headerRow.length === 0) return defaultIdx;
            const idx = headerRow.findIndex(cell => {
                const str = String(cell || "").toLowerCase().trim();
                return keywords.some(k => str === k || str.includes(k));
            });
            return idx >= 0 ? idx : defaultIdx;
        };

        const colDateStart = findColIdx(["date start", "start date"], 0);
        const colDateEnd = findColIdx(["date end", "end date"], 1);
        const colName = findColIdx(["person name", "employee name", "name"], 2);
        const colFmsName = findColIdx(["fms name", "fms"], 3);
        const colSystemType = findColIdx(["system type", "type"], 4);
        const colDept = findColIdx(["department", "dept"], 5);
        const colTaskName = findColIdx(["task name", "task", "particulars", "task description"], 6);
        const colTarget = findColIdx(["target", "tgt"], 7);
        const colActualAch = findColIdx(["actual achievement", "actual done", "actual work done", "actual"], 8);
        const colExtraDone = findColIdx(["extra done", "extra work done", "extra"], 9);
        const colTotalAch = findColIdx(["total achievement", "total done", "total work done", "total"], 10);
        const colWorkNotDone = findColIdx(["work not done", "% work not done", "not done"], 11);
        const colWorkNotDoneOnTime = findColIdx(["work not done on time", "% work not done on time", "not done on time"], 12);
        const colAllPending = findColIdx(["all pending", "pending till date", "all pending till date", "pending"], 13);

        // Strict Filter: Match Name (Col C), Date Start (Col A), and Date End (Col B)
        const exactDateMatches = rowsToProcess.filter(row => {
            const rowName = row[colName] ? String(row[colName]).trim().toLowerCase() : "";
            const rowStart = normalizeDate(row[colDateStart]);
            const rowEnd = normalizeDate(row[colDateEnd]);

            const isNameMatch = rowName === recordName;
            const isDateStartMatch = Boolean(normRecordDateStart && rowStart && rowStart === normRecordDateStart);
            const isDateEndMatch = Boolean(normRecordDateEnd && rowEnd && rowEnd === normRecordDateEnd);

            return isNameMatch && isDateStartMatch && isDateEndMatch;
        });

        const tasks = exactDateMatches.map(row => ({
            dateStart: row[colDateStart] || "",
            dateEnd: row[colDateEnd] || "",
            name: row[colName] || "",
            fmsName: row[colFmsName] || "",
            systemType: row[colSystemType] || "",
            department: row[colDept] || "",
            taskName: row[colTaskName] || row[colSystemType] || "",
            target: row[colTarget] || 0,
            actualAchievement: row[colActualAch] || 0,
            extraDone: row[colExtraDone] || 0,
            totalAchievement: row[colTotalAch] || 0,
            workNotDone: row[colWorkNotDone] || 0,
            workNotDoneOnTime: row[colWorkNotDoneOnTime] || 0,
            allPendingTillDate: row[colAllPending] || 0,
        }));

        const rawImg = imageMap[recordName];
        let finalImageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(record.name)}&background=0D8ABC&color=fff&size=128`;
        if (rawImg) {
            const processedUrl = getDisplayableImageUrl(rawImg);
            if (processedUrl) finalImageUrl = processedUrl;
        }

        const userDept = (tasks[0] && tasks[0].department) || departmentMap[recordName] || record.firm || "Operations";

        setSelectedUserDetails({
            name: record.name,
            department: userDept,
            image: finalImageUrl,
            dateStart: record.dateStart,
            dateEnd: record.dateEnd,
            tasks: tasks
        });
    };

    // Category counts across all role-filtered records
    const categoryCounts = useMemo(() => {
        const counts = {
            [CATEGORY_KEYS.MIS]: 0,
            [CATEGORY_KEYS.NON_MIS]: 0,
            [CATEGORY_KEYS.OTHER]: 0,
        };
        records.forEach(r => {
            const cat = r.category || categorizeByBasis(r.incentiveCategory);
            if (counts[cat] !== undefined) {
                counts[cat]++;
            } else {
                counts[CATEGORY_KEYS.OTHER]++;
            }
        });
        return counts;
    }, [records]);

    // Filter records by selected category
    const categoryRecords = useMemo(() => {
        return records.filter(r => {
            const cat = r.category || categorizeByBasis(r.incentiveCategory);
            return cat === selectedCategory;
        });
    }, [records, selectedCategory]);

    // All unique week date ranges in this category (for Date dropdown)
    const uniqueDates = useMemo(() => {
        const weekMap = new Map();
        categoryRecords.forEach((r) => {
            const dateStart = String(r.dateStart || "").trim();
            const dateEnd = String(r.dateEnd || "").trim();
            if (!dateStart) return;

            if (!weekMap.has(dateStart)) {
                weekMap.set(dateStart, {
                    value: dateStart,
                    dateStart,
                    dateEnd,
                    label: dateEnd ? `${dateStart} To ${dateEnd}` : dateStart,
                    sortKey: normalizeDate(dateStart),
                });
            } else {
                const existing = weekMap.get(dateStart);
                if (!existing.dateEnd && dateEnd) {
                    existing.dateEnd = dateEnd;
                    existing.label = `${dateStart} To ${dateEnd}`;
                }
            }
        });

        return Array.from(weekMap.values()).sort((a, b) =>
            b.sortKey.localeCompare(a.sortKey)
        );
    }, [categoryRecords]);

    // Available names for Name dropdown (filtered by date if selected)
    const uniqueNames = useMemo(() => {
        let subset = categoryRecords;
        if (dateFilter !== "all") {
            subset = subset.filter(r => r.dateStart === dateFilter);
        }
        return [...new Set(subset.map(r => r.name))].filter(Boolean).sort();
    }, [categoryRecords, dateFilter]);

    // Available firms for Firm dropdown (filtered by date if selected)
    const uniqueFirms = useMemo(() => {
        let subset = categoryRecords;
        if (dateFilter !== "all") {
            subset = subset.filter(r => r.dateStart === dateFilter);
        }
        return [...new Set(subset.map(r => r.firm))].filter(Boolean).sort();
    }, [categoryRecords, dateFilter]);

    // Filtered records based on active category, search, name, date, and firm filters
    const filteredRecords = useMemo(() => {
        return categoryRecords.filter(r => {
            const matchesSearch =
                r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.dateStart.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.dateEnd.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesName = nameFilter === "all" || r.name === nameFilter;
            const matchesDate = dateFilter === "all" || r.dateStart === dateFilter;
            const matchesFirm = firmFilter === "all" || r.firm === firmFilter;
            return matchesSearch && matchesName && matchesDate && matchesFirm;
        });
    }, [categoryRecords, searchQuery, nameFilter, dateFilter, firmFilter]);

    // Unique persons in the currently filtered view
    const filteredUniquePersons = useMemo(() => {
        return [...new Set(filteredRecords.map(r => r.name.trim()))].filter(Boolean);
    }, [filteredRecords]);

    const averages = useMemo(() => {
        if (filteredRecords.length === 0) return null;
        
        let targetSum = 0, actualSum = 0, wndSum = 0, wndotSum = 0, totalSum = 0, weekPendingSum = 0, allPendingSum = 0;
        let count = 0;

        filteredRecords.forEach(r => {
            targetSum += parseFloat(String(r.target).replace(/,/g, '')) || 0;
            actualSum += parseFloat(String(r.actualWorkDone).replace(/,/g, '')) || 0;
            wndSum += parseFloat(String(r.workNotDone).replace(/%/g, '').replace(/,/g, '')) || 0;
            wndotSum += parseFloat(String(r.workNotDoneOnTime).replace(/%/g, '').replace(/,/g, '')) || 0;
            totalSum += parseFloat(String(r.totalWorkDone).replace(/,/g, '')) || 0;
            weekPendingSum += parseFloat(String(r.weekPending).replace(/,/g, '')) || 0;
            allPendingSum += parseFloat(String(r.allPendingTillDate).replace(/,/g, '')) || 0;
            count++;
        });

        return {
            target: (targetSum / count).toFixed(2).replace(/\.00$/, ''),
            actualWorkDone: (actualSum / count).toFixed(2).replace(/\.00$/, ''),
            workNotDone: (wndSum / count).toFixed(2).replace(/\.00$/, ''),
            workNotDoneOnTime: (wndotSum / count).toFixed(2).replace(/\.00$/, ''),
            totalWorkDone: (totalSum / count).toFixed(2).replace(/\.00$/, ''),
            weekPending: (weekPendingSum / count).toFixed(2).replace(/\.00$/, ''),
            allPendingTillDate: (allPendingSum / count).toFixed(2).replace(/\.00$/, '')
        };
    }, [filteredRecords]);

    // Active Category Label name
    const activeCategoryLabel = useMemo(() => {
        const found = CATEGORY_LABELS.find(c => c.key === selectedCategory);
        return found?.label || "MIS Category Report";
    }, [selectedCategory]);

    // Extracted Start Date & End Date for Header display & print
    const dateRange = useMemo(() => {
        return extractDateRange(filteredRecords, dateFilter);
    }, [filteredRecords, dateFilter]);

    // Handle Print action
    const handlePrint = () => {
        printHistoryReport({
            categoryName: activeCategoryLabel,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            records: filteredRecords,
            averages: averages,
            filters: {
                firm: firmFilter,
                name: nameFilter,
                search: searchQuery,
            },
        });
    };

    // Handle PDF Download action
    const handleDownloadPDF = async () => {
        try {
            setIsDownloadingPdf(true);
            await downloadHistoryPDF({
                categoryName: activeCategoryLabel,
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                records: filteredRecords,
                averages: averages,
                filters: {
                    firm: firmFilter,
                    name: nameFilter,
                    search: searchQuery,
                },
            });
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    const formatValue = (val) => {
        if (val === "" || val === null || val === undefined) return "-";
        return String(val);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
                    <p className="text-gray-600 font-medium">Loading Weekly Report Records...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="max-w-full mx-auto space-y-4 md:space-y-5">
                {/* Page Header */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                        <History className="w-6 h-6 text-indigo-600" />
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 leading-tight">Weekly Report Record</h1>
                            <p className="text-xs text-gray-500">View and print weekly performance records by category (Click any row to view task details)</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        {/* Live Date Range Badge */}
                        {(dateRange.startDate || dateRange.endDate) && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-semibold text-indigo-800 shadow-2xs">
                                <Calendar className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                                <span>{dateRange.startDate || '-'}</span>
                                <span className="text-indigo-400 font-bold">to</span>
                                <span>{dateRange.endDate || '-'}</span>
                            </div>
                        )}

                        <span className="text-xs sm:text-sm text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-2xs font-medium">
                            {filteredRecords.length} of {records.length} total
                        </span>

                        {/* Print Report Button */}
                        <button
                            type="button"
                            id="print-history-report-btn"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer"
                            title={`Print ${activeCategoryLabel} with Date Range`}
                        >
                            <Printer className="w-4 h-4" />
                            <span>Print Report</span>
                        </button>

                        {/* Download PDF Button */}
                        <button
                            type="button"
                            id="download-history-pdf-btn"
                            onClick={handleDownloadPDF}
                            disabled={isDownloadingPdf}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
                            title={`Download ${activeCategoryLabel} PDF`}
                        >
                            {isDownloadingPdf ? (
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                            ) : (
                                <Download className="w-4 h-4 text-gray-600" />
                            )}
                            <span className="hidden sm:inline">PDF</span>
                        </button>
                    </div>
                </div>

                {/* Category Tabs: MIS Category Report | Non MIS Category Report | Other Category Report */}
                <CategoryTabs
                    activeCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    counts={categoryCounts}
                />

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-2xs border border-gray-200 p-3 sm:p-4">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by name or date..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div className="w-full md:w-64">
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                            >
                                <option value="all">All Dates</option>
                                {uniqueDates.map(d => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full md:w-56">
                            <SearchableSelect
                                options={uniqueNames}
                                value={nameFilter}
                                onChange={(val) => setNameFilter(val)}
                                placeholder="All Names"
                                allLabel="All Names"
                            />
                        </div>
                        <div className="w-full md:w-56">
                            <select
                                value={firmFilter}
                                onChange={(e) => setFirmFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                            >
                                <option value="all">All Firms</option>
                                {uniqueFirms.map(f => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-white rounded-xl shadow-2xs p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                            {dateFilter !== "all" || nameFilter !== "all" || firmFilter !== "all" || searchQuery ? "Filtered Records" : "Category Records"}
                        </p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">{filteredRecords.length}</p>
                            {(dateFilter !== "all" || nameFilter !== "all" || firmFilter !== "all" || searchQuery) && (
                                <span className="text-xs text-gray-400 font-medium">of {categoryRecords.length} in category</span>
                            )}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-2xs p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Unique Persons</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">{filteredUniquePersons.length}</p>
                            {(dateFilter !== "all" || nameFilter !== "all" || firmFilter !== "all" || searchQuery) && (
                                <span className="text-xs text-gray-400 font-medium">in filtered view</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-2xs border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3.5 border-b border-gray-200 bg-gray-50/80 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm sm:text-base font-bold text-gray-800">Records</h2>
                            <p className="text-[11px] text-gray-500">Tip: Click on any employee row to view their individual task details from "Task Wise Record"</p>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">Showing {filteredRecords.length} records</span>
                    </div>
                    <div className="overflow-auto max-h-[calc(100vh-320px)] relative border-t border-gray-100">
                        <table className="w-full text-sm border-separate border-spacing-0">
                            <thead className="bg-gray-50 sticky top-0 z-30 shadow-2xs">
                                <tr>
                                    <th className="w-12 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap sticky left-0 top-0 bg-gray-50 z-40 border-b border-gray-200">S.No</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50 border-b border-gray-200">Date Start</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50 border-b border-gray-200">Date End</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap sticky left-12 top-0 bg-gray-50 z-40 border-l border-b border-gray-200">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50 border-b border-gray-200">Firm</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">Target</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">Actual Work Done</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">% Work Not Done</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">% Not Done On Time</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">Total Work Done</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">Week Pending</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">All Pending Till Date</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold bg-red-100 text-red-700 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">LW Planned % Not Done</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold bg-red-100 text-red-700 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">LW % Not Done On Time</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold bg-red-100 text-red-700 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">LW Commitment</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold bg-green-100 text-green-700 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">NW Planned % Not Done</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold bg-green-100 text-green-700 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">NW % Not Done On Time</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold bg-green-100 text-green-700 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">NW Commitment</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredRecords.length > 0 ? (
                                    filteredRecords.map((r, idx) => (
                                        <tr
                                            key={r.id}
                                            onClick={() => handleRowClick(r)}
                                            className="hover:bg-indigo-50/60 cursor-pointer transition-colors group"
                                            title={`Click to view tasks for ${r.name}`}
                                        >
                                            <td className="px-4 py-3 text-gray-500 font-medium text-center sticky left-0 bg-white group-hover:bg-indigo-50/60 z-10">{idx + 1}</td>
                                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap bg-white group-hover:bg-indigo-50/60">{formatValue(r.dateStart)}</td>
                                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap bg-white group-hover:bg-indigo-50/60">{formatValue(r.dateEnd)}</td>
                                            <td className="px-4 py-3 font-semibold text-indigo-700 hover:text-indigo-900 whitespace-nowrap sticky left-12 bg-white group-hover:bg-indigo-50/60 z-10 border-l border-gray-200 flex items-center gap-1.5">
                                                <span>{formatValue(r.name)}</span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap bg-white group-hover:bg-indigo-50/60">{formatValue(r.firm)}</td>
                                            <td className="px-4 py-3 text-right text-gray-700">{formatValue(r.target)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 min-w-[3rem]">
                                                    {formatValue(r.actualWorkDone)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold min-w-[3rem] ${parseFloat(r.workNotDone) > 30
                                                    ? "bg-red-100 text-red-800"
                                                    : parseFloat(r.workNotDone) > 10
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-green-100 text-green-800"
                                                    }`}>
                                                    {formatValue(r.workNotDone)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold min-w-[3rem] ${parseFloat(r.workNotDoneOnTime) > 30
                                                    ? "bg-red-100 text-red-800"
                                                    : parseFloat(r.workNotDoneOnTime) > 10
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-green-100 text-green-800"
                                                    }`}>
                                                    {formatValue(r.workNotDoneOnTime)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800 min-w-[3rem]">
                                                    {formatValue(r.totalWorkDone)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold min-w-[3rem] ${parseFloat(r.weekPending) > 5
                                                    ? "bg-red-100 text-red-800"
                                                    : parseFloat(r.weekPending) > 0
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-green-100 text-green-800"
                                                    }`}>
                                                    {formatValue(r.weekPending)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold min-w-[3rem] ${parseFloat(r.allPendingTillDate) > 10
                                                    ? "bg-red-100 text-red-800"
                                                    : parseFloat(r.allPendingTillDate) > 3
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-green-100 text-green-800"
                                                    }`}>
                                                    {formatValue(r.allPendingTillDate)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right bg-red-50/30">
                                                <span className="text-red-700 font-medium">{formatValue(r.lastWeekPlannedNotDone)}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right bg-red-50/30">
                                                <span className="text-red-700 font-medium">{formatValue(r.lastWeekPlannedNotDoneOnTime)}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right bg-red-50/30">
                                                <span className="text-red-700 font-bold">{formatValue(r.lastWeekCommitment)}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right bg-green-50/30">
                                                <span className="text-green-700 font-medium">{formatValue(r.nextWeekPlannedNotDone)}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right bg-green-50/30">
                                                <span className="text-green-700 font-medium">{formatValue(r.nextWeekPlannedNotDoneOnTime)}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right bg-green-50/30">
                                                <span className="text-green-700 font-bold">{formatValue(r.nextWeekCommitment)}</span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="18" className="px-6 py-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <AlertCircle className="w-8 h-8 text-gray-300" />
                                                <p className="font-medium text-gray-500">No records found under this category / filter.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {filteredRecords.length > 0 && averages && (
                                <tfoot className="bg-gray-50 font-bold sticky bottom-0 z-30 shadow-[0_-1px_3px_rgba(0,0,0,0.1)]">
                                    <tr>
                                        <td colSpan="5" className="px-4 py-3 text-right text-gray-800 border-t border-gray-200">Average:</td>
                                        <td className="px-4 py-3 text-right text-gray-800 border-t border-gray-200">{averages.target}</td>
                                        <td className="px-4 py-3 text-right text-gray-800 border-t border-gray-200">{averages.actualWorkDone}</td>
                                        <td className="px-4 py-3 text-right text-gray-800 border-t border-gray-200">{averages.workNotDone}%</td>
                                        <td className="px-4 py-3 text-right text-gray-800 border-t border-gray-200">{averages.workNotDoneOnTime}%</td>
                                        <td className="px-4 py-3 text-right text-gray-800 border-t border-gray-200">{averages.totalWorkDone}</td>
                                        <td className="px-4 py-3 text-right text-gray-800 border-t border-gray-200">{averages.weekPending}</td>
                                        <td className="px-4 py-3 text-right text-gray-800 border-t border-gray-200">{averages.allPendingTillDate}</td>
                                        <td colSpan="6" className="border-t border-gray-200"></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>

            {/* Task Details Popup Modal */}
            <HistoryTaskModal
                selectedUserDetails={selectedUserDetails}
                onClose={() => setSelectedUserDetails(null)}
            />
        </div>
    );
};

export default AdminHistoryCommitment;
