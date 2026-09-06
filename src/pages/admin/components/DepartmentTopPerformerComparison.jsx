import React, { useState, useMemo } from "react";
import {
  Trophy,
  Award,
  Crown,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Calendar,
  CheckCircle2,
  Users,
  Search,
  Filter,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Avatar from "../../../components/common/Avatar";
import { getDisplayableImageUrl } from "../../../utils/imageUtils";

// Department Color Theme for badges
const getDeptBadgeStyle = (deptName = "") => {
  const d = String(deptName).toUpperCase();
  if (d.includes("IT")) return { bg: "bg-cyan-50 border-cyan-200 text-cyan-800", dot: "bg-cyan-500", text: "text-cyan-700" };
  if (d.includes("ACCOUNT")) return { bg: "bg-emerald-50 border-emerald-200 text-emerald-800", dot: "bg-emerald-500", text: "text-emerald-700" };
  if (d.includes("PROD")) return { bg: "bg-amber-50 border-amber-200 text-amber-800", dot: "bg-amber-500", text: "text-amber-700" };
  if (d.includes("STORE")) return { bg: "bg-purple-50 border-purple-200 text-purple-800", dot: "bg-purple-500", text: "text-purple-700" };
  if (d.includes("SALE")) return { bg: "bg-rose-50 border-rose-200 text-rose-800", dot: "bg-rose-500", text: "text-rose-700" };
  if (d.includes("PURCHASE")) return { bg: "bg-indigo-50 border-indigo-200 text-indigo-800", dot: "bg-indigo-500", text: "text-indigo-700" };
  if (d.includes("HR") || d.includes("ADMIN")) return { bg: "bg-pink-50 border-pink-200 text-pink-800", dot: "bg-pink-500", text: "text-pink-700" };
  return { bg: "bg-slate-50 border-slate-200 text-slate-800", dot: "bg-slate-500", text: "text-slate-700" };
};

// Helper to normalize various date formats to YYYY-MM-DD
const normalizeDate = (d) => {
  if (!d) return "";
  const str = String(d).trim();
  if (!str) return "";

  const monthMap = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };

  const customMatch = str.match(/^(\d{1,2})[-/ ]([a-zA-Z]{3,})[-/ ](\d{4})$/);
  if (customMatch) {
    const dd = customMatch[1].padStart(2, "0");
    const monStr = customMatch[2].substring(0, 3).toLowerCase();
    const mm = monthMap[monStr] || "01";
    const yyyy = customMatch[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const yyyy = isoMatch[1];
    const mm = isoMatch[2].padStart(2, "0");
    const dd = isoMatch[3].padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const dd = dmyMatch[1].padStart(2, "0");
    const mm = dmyMatch[2].padStart(2, "0");
    const yyyy = dmyMatch[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const dd = String(parsed.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  return str.toLowerCase();
};

const DepartmentTopPerformerComparison = ({
  currentEmployees = [],
  historyRecords = [],
  departmentMap = {},
  imageMap = {},
  designationMap = {},
  firmMap = {},
  onSelectStaff,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentWeekKey, setCurrentWeekKey] = useState("");
  const [prevWeekKey, setPrevWeekKey] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'retained' | 'new'

  // 1. Extract unique historical weeks from historyRecords (sheet=Records)
  const availableWeeks = useMemo(() => {
    const weekMap = new Map();

    if (historyRecords && historyRecords.length > 0) {
      historyRecords.forEach((r) => {
        const dateStart = r.dateStart || "";
        const dateEnd = r.dateEnd || "";
        if (!dateStart) return;

        const key = `${dateStart}_${dateEnd}`;
        if (!weekMap.has(key)) {
          weekMap.set(key, {
            key,
            dateStart,
            dateEnd,
            label: dateEnd ? `${dateStart} to ${dateEnd}` : dateStart,
            sortKey: normalizeDate(dateStart),
            type: "history",
          });
        }
      });
    }

    const sortedHistory = Array.from(weekMap.values()).sort((a, b) =>
      b.sortKey.localeCompare(a.sortKey)
    );

    // Include Live Active Week as the first option
    const liveOption = {
      key: "live",
      dateStart: "Live",
      dateEnd: "Active",
      label: "Current Live Week (Active)",
      sortKey: "9999-99-99",
      type: "live",
    };

    return [liveOption, ...sortedHistory];
  }, [historyRecords]);

  // History-only weeks list (sorted newest first)
  const historyOnlyWeeks = useMemo(() => {
    return availableWeeks.filter((w) => w.key !== "live");
  }, [availableWeeks]);

  // Resolve active Current Week key:
  // Default to newest submitted week in Records (e.g. 30-Aug to 05-Sep)
  const activeCurrentWeek = useMemo(() => {
    if (currentWeekKey) {
      const found = availableWeeks.find((w) => w.key === currentWeekKey);
      if (found) return found;
    }
    // Default to the latest review week from Records (e.g. 30-Aug to 05-Sep)
    if (historyOnlyWeeks.length > 0) {
      return historyOnlyWeeks[0];
    }
    return availableWeeks[0] || null;
  }, [availableWeeks, historyOnlyWeeks, currentWeekKey]);

  // Resolve active Previous Week key:
  // Default to 2nd newest week from Records (e.g. 23-Aug to 29-Aug)
  const activePrevWeek = useMemo(() => {
    if (prevWeekKey) {
      const found = availableWeeks.find((w) => w.key === prevWeekKey);
      if (found) return found;
    }
    // Default to the week prior to activeCurrentWeek
    if (historyOnlyWeeks.length > 1) {
      const currentIdx = historyOnlyWeeks.findIndex(
        (w) => w.key === activeCurrentWeek?.key
      );
      if (currentIdx === 0 && historyOnlyWeeks[1]) {
        return historyOnlyWeeks[1];
      }
      if (currentIdx > 0 && historyOnlyWeeks[currentIdx + 1]) {
        return historyOnlyWeeks[currentIdx + 1];
      }
      return historyOnlyWeeks[1];
    }
    return historyOnlyWeeks[0] || availableWeeks[0] || null;
  }, [availableWeeks, historyOnlyWeeks, prevWeekKey, activeCurrentWeek]);

  // Helper function to extract department top performers for a given week key
  const getDeptWinnersForWeek = (weekObj) => {
    if (!weekObj) return {};

    const byDept = {};

    // A. If 'live', use currentEmployees
    if (weekObj.key === "live") {
      currentEmployees.forEach((emp) => {
        const dept = emp.department || departmentMap[emp.name.toLowerCase()] || "General";
        if (!byDept[dept]) byDept[dept] = [];
        byDept[dept].push(emp);
      });
    }
    // B. If historical week, filter historyRecords by date
    else {
      const targetStart = normalizeDate(weekObj.dateStart);
      const targetEnd = normalizeDate(weekObj.dateEnd);

      historyRecords.forEach((r) => {
        const rStart = normalizeDate(r.dateStart);
        const rEnd = normalizeDate(r.dateEnd);

        const match =
          rStart === targetStart &&
          (!targetEnd || !rEnd || rEnd === targetEnd);

        if (match && r.name) {
          const normName = r.name.toLowerCase().trim();
          const dept =
            r.department ||
            departmentMap[normName] ||
            "General";

          if (!byDept[dept]) byDept[dept] = [];

          const target = parseFloat(r.target) || 0;
          const actualDone = parseFloat(r.actualWorkDone) || 0;
          const totalDone = parseFloat(r.totalWorkDone) || 0;
          const completionPct =
            target > 0
              ? Math.round((actualDone / target) * 100)
              : actualDone > 0
              ? 100
              : 0;

          const rawImg = imageMap[normName];
          const imgUrl = rawImg ? getDisplayableImageUrl(rawImg) : null;

          byDept[dept].push({
            name: r.name,
            designation: designationMap[normName] || "",
            department: dept,
            firm: firmMap[normName] || r.firm || "",
            image: imgUrl,
            target,
            actualWorkDone: actualDone,
            totalWorkDone: totalDone,
            completionPct,
          });
        }
      });
    }

    // Sort each department to pick top performer (max actualWorkDone, secondary: totalWorkDone/completionPct)
    const winners = {};
    Object.entries(byDept).forEach(([dept, list]) => {
      const sorted = [...list].sort((a, b) => {
        if (b.actualWorkDone !== a.actualWorkDone) {
          return b.actualWorkDone - a.actualWorkDone;
        }
        if ((b.totalWorkDone || 0) !== (a.totalWorkDone || 0)) {
          return (b.totalWorkDone || 0) - (a.totalWorkDone || 0);
        }
        return (b.completionPct || 0) - (a.completionPct || 0);
      });
      if (sorted.length > 0) {
        winners[dept] = {
          winner: sorted[0],
          totalStaff: list.length,
          allStaff: sorted,
        };
      }
    });

    return winners;
  };

  // 2. Build comparison per Department
  const comparisonData = useMemo(() => {
    const currentWinnersMap = getDeptWinnersForWeek(activeCurrentWeek);
    const prevWinnersMap = getDeptWinnersForWeek(activePrevWeek);

    // Only include departments that have winners/records in at least one of the weeks
    const allActiveDepts = new Set([
      ...Object.keys(currentWinnersMap),
      ...Object.keys(prevWinnersMap),
    ]);

    const departments = Array.from(allActiveDepts).filter(Boolean).sort();

    return departments
      .map((dept) => {
        const currentEntry = currentWinnersMap[dept];
        const prevEntry = prevWinnersMap[dept];

        const currentWinner = currentEntry?.winner || null;
        const prevWinner = prevEntry?.winner || null;
        const totalStaff = currentEntry?.totalStaff || prevEntry?.totalStaff || 0;

        // Skip if neither week has a winner/record
        if (!currentWinner && !prevWinner) return null;

        // Comparison stats
        const isSameWinner = Boolean(
          currentWinner &&
            prevWinner &&
            currentWinner.name.toLowerCase().trim() ===
              prevWinner.name.toLowerCase().trim()
        );

        const hasBoth = Boolean(currentWinner && prevWinner);
        const taskDiff = hasBoth
          ? currentWinner.actualWorkDone - prevWinner.actualWorkDone
          : null;
        const pctDiff = hasBoth
          ? currentWinner.completionPct - prevWinner.completionPct
          : null;

        return {
          department: dept,
          totalStaff,
          currentWinner,
          prevWinner,
          isSameWinner,
          hasBoth,
          taskDiff,
          pctDiff,
        };
      })
      .filter(Boolean);
  }, [
    currentEmployees,
    historyRecords,
    activeCurrentWeek,
    activePrevWeek,
    departmentMap,
    imageMap,
    designationMap,
    firmMap,
  ]);

  // 3. Filtered comparison list
  const filteredComparison = useMemo(() => {
    return comparisonData.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.currentWinner &&
          item.currentWinner.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.prevWinner &&
          item.prevWinner.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "retained"
          ? item.isSameWinner
          : statusFilter === "new"
          ? item.hasBoth && !item.isSameWinner
          : true;

      return matchesSearch && matchesStatus;
    });
  }, [comparisonData, searchTerm, statusFilter]);

  // Overall comparison counters
  const summaryStats = useMemo(() => {
    let retainedCount = 0;
    let newChampionCount = 0;
    let activeDepts = 0;

    comparisonData.forEach((item) => {
      if (item.currentWinner) activeDepts++;
      if (item.isSameWinner) retainedCount++;
      else if (item.hasBoth && !item.isSameWinner) newChampionCount++;
    });

    return {
      totalDepts: comparisonData.length,
      activeDepts,
      retainedCount,
      newChampionCount,
    };
  }, [comparisonData]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 md:p-6 overflow-hidden">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 flex-shrink-0">
            <Trophy className="w-6 h-6 text-amber-200 fill-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg md:text-xl font-bold text-slate-900">
                Department-wise Weekly Top Performer Comparison
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                Weekly Champions
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pichhle hafte (Previous Week) vs Is hafte (Current Week) ke department-wise top performers ki tulna
            </p>
          </div>
        </div>

        {/* Dual Week Selectors (Last Week vs Current Week) */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs">
          {/* Previous Week Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span className="font-semibold text-slate-600">Last Week:</span>
            <select
              value={activePrevWeek?.key || ""}
              onChange={(e) => setPrevWeekKey(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {availableWeeks.map((w) => (
                <option key={`prev-${w.key}`} value={w.key}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>

          <span className="text-slate-400 font-bold px-1">vs</span>

          {/* Current Week Selector */}
          <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
            <Crown className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
            <span className="font-semibold text-indigo-800">This Week:</span>
            <select
              value={activeCurrentWeek?.key || ""}
              onChange={(e) => setCurrentWeekKey(e.target.value)}
              className="bg-transparent font-bold text-indigo-900 focus:outline-none cursor-pointer"
            >
              {availableWeeks.map((w) => (
                <option key={`curr-${w.key}`} value={w.key}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="bg-gradient-to-br from-indigo-50/70 to-white border border-indigo-100 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-indigo-600 uppercase tracking-wider">Total Depts</p>
            <p className="text-lg font-bold text-slate-900">{summaryStats.totalDepts}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50/70 to-white border border-emerald-100 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider">Retained Crown</p>
            <p className="text-lg font-bold text-emerald-700">{summaryStats.retainedCount} Depts</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50/70 to-white border border-purple-100 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-purple-600 uppercase tracking-wider">New Champions</p>
            <p className="text-lg font-bold text-purple-700">{summaryStats.newChampionCount} Depts</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50/70 to-white border border-amber-100 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-amber-600 uppercase tracking-wider">Active Depts</p>
            <p className="text-lg font-bold text-slate-900">{summaryStats.activeDepts}</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search department or employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs w-full sm:w-auto justify-end">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              statusFilter === "all"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            All ({comparisonData.length})
          </button>
          <button
            onClick={() => setStatusFilter("retained")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              statusFilter === "retained"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50"
            }`}
          >
            👑 Retained ({summaryStats.retainedCount})
          </button>
          <button
            onClick={() => setStatusFilter("new")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              statusFilter === "new"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-purple-50"
            }`}
          >
            🔄 New ({summaryStats.newChampionCount})
          </button>
        </div>
      </div>

      {/* Comparison Table (Desktop View) */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/90 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-4 w-[22%]">Department</th>
              <th className="py-3 px-4 w-[28%] bg-slate-100/50">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Last Week Top Performer</span>
                  {activePrevWeek && (
                    <span className="text-[10px] font-normal text-slate-500">
                      ({activePrevWeek.label})
                    </span>
                  )}
                </div>
              </th>
              <th className="py-3 px-2 text-center w-[4%] text-slate-400">VS</th>
              <th className="py-3 px-4 w-[28%] bg-indigo-50/40 text-indigo-900">
                <div className="flex items-center gap-1.5 text-indigo-900">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>Current Week Top Performer</span>
                  {activeCurrentWeek && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded">
                      ({activeCurrentWeek.label})
                    </span>
                  )}
                </div>
              </th>
              <th className="py-3 px-4 text-center w-[18%]">Outcome / Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 text-xs">
            {filteredComparison.length > 0 ? (
              filteredComparison.map((row) => {
                const style = getDeptBadgeStyle(row.department);

                return (
                  <tr
                    key={row.department}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* 1. Department */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider w-max ${style.bg}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                          {row.department}
                        </span>
                        <span className="text-[11px] text-slate-500 pl-1 font-medium">
                          {row.totalStaff} staff members
                        </span>
                      </div>
                    </td>

                    {/* 2. Last Week Winner */}
                    <td className="py-3.5 px-4 align-middle bg-slate-50/30">
                      {row.prevWinner ? (
                        <div
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => onSelectStaff && onSelectStaff(row.prevWinner)}
                        >
                          <div className="relative flex-shrink-0">
                            <Avatar
                              src={row.prevWinner.image}
                              name={row.prevWinner.name}
                              className="w-9 h-9 rounded-full border border-slate-300 shadow-2xs group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute -top-1 -right-1 bg-slate-200 text-slate-700 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">
                              #1
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-800 text-xs truncate group-hover:text-indigo-600 transition-colors">
                              {row.prevWinner.name}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {row.prevWinner.designation || row.prevWinner.firm || "Staff"}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                <CheckCircle2 className="w-2.5 h-2.5 text-slate-500" />
                                {row.prevWinner.actualWorkDone} Done
                              </span>
                              <span className="text-[10px] text-slate-500 font-semibold">
                                ({row.prevWinner.completionPct}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-xs flex items-center gap-1.5 py-1">
                          <span>No record for this week</span>
                        </div>
                      )}
                    </td>

                    {/* VS Separator */}
                    <td className="py-3.5 px-2 align-middle text-center">
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-400 text-[10px] font-extrabold flex items-center justify-center mx-auto shadow-2xs">
                        vs
                      </div>
                    </td>

                    {/* 3. Current Week Winner */}
                    <td className="py-3.5 px-4 align-middle bg-indigo-50/20">
                      {row.currentWinner ? (
                        <div
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => onSelectStaff && onSelectStaff(row.currentWinner)}
                        >
                          <div className="relative flex-shrink-0">
                            <Avatar
                              src={row.currentWinner.image}
                              name={row.currentWinner.name}
                              className="w-9 h-9 rounded-full border-2 border-indigo-300 shadow-2xs group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute -top-1.5 -right-1 bg-amber-400 text-slate-900 rounded-full w-4 h-4 flex items-center justify-center shadow-xs">
                              <Crown className="w-2.5 h-2.5 text-slate-900 fill-slate-900" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 text-xs truncate group-hover:text-indigo-600 transition-colors">
                              {row.currentWinner.name}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {row.currentWinner.designation || row.currentWinner.firm || "Staff"}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                {row.currentWinner.actualWorkDone} Done
                              </span>
                              <span className="text-[10px] text-indigo-700 font-bold">
                                ({row.currentWinner.completionPct}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-xs flex items-center gap-1.5 py-1">
                          <span>No record for this week</span>
                        </div>
                      )}
                    </td>

                    {/* 4. Outcome & Trend Badge */}
                    <td className="py-3.5 px-4 align-middle text-center">
                      {row.isSameWinner ? (
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                            <Crown className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                            Crown Retained
                          </span>
                          <span className="text-[10px] font-medium text-emerald-600">
                            {row.taskDiff >= 0
                              ? `+${row.taskDiff} tasks vs prev`
                              : `${row.taskDiff} tasks vs prev`}
                          </span>
                        </div>
                      ) : row.hasBoth ? (
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-300 shadow-2xs">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600 fill-purple-300" />
                            New Champion
                          </span>
                          <span className="text-[10px] font-medium text-purple-600">
                            {row.taskDiff >= 0 ? (
                              <span className="text-emerald-600 font-bold">
                                ↑ +{row.taskDiff} score diff
                              </span>
                            ) : (
                              <span className="text-slate-500 font-medium">
                                Winner shifted
                              </span>
                            )}
                          </span>
                        </div>
                      ) : row.currentWinner ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Current Leader
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-400 text-xs">
                  No department comparison data matching the criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filteredComparison.length > 0 ? (
          filteredComparison.map((row) => {
            const style = getDeptBadgeStyle(row.department);

            return (
              <div
                key={row.department}
                className="bg-slate-50/60 border border-slate-200 rounded-xl p-3.5 space-y-3"
              >
                {/* Dept Header & Status */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold uppercase tracking-wider ${style.bg}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {row.department}
                  </span>

                  {row.isSameWinner ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <Crown className="w-3 h-3 text-emerald-600" /> Crown Retained
                    </span>
                  ) : row.hasBoth ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                      <Sparkles className="w-3 h-3 text-purple-600" /> New Winner
                    </span>
                  ) : null}
                </div>

                {/* 2 Column Comparison on Mobile */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Last Week */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Last Week #1
                    </p>
                    {row.prevWinner ? (
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={row.prevWinner.image}
                          name={row.prevWinner.name}
                          className="w-7 h-7 rounded-full text-[10px] flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-[11px] truncate">
                            {row.prevWinner.name}
                          </p>
                          <p className="text-[10px] text-emerald-700 font-bold">
                            {row.prevWinner.actualWorkDone} Done ({row.prevWinner.completionPct}%)
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">No record</p>
                    )}
                  </div>

                  {/* Current Week */}
                  <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-200">
                    <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-500" /> Current #1
                    </p>
                    {row.currentWinner ? (
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={row.currentWinner.image}
                          name={row.currentWinner.name}
                          className="w-7 h-7 rounded-full text-[10px] flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-[11px] truncate">
                            {row.currentWinner.name}
                          </p>
                          <p className="text-[10px] text-indigo-700 font-bold">
                            {row.currentWinner.actualWorkDone} Done ({row.currentWinner.completionPct}%)
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">No record</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
            No department comparison data found
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentTopPerformerComparison;
