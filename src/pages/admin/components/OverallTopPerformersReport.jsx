import React, { useState, useMemo } from "react";
import {
  Trophy,
  Award,
  Crown,
  Medal,
  Star,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Building2,
} from "lucide-react";
import Avatar from "../../../components/common/Avatar";

const OverallTopPerformersReport = ({
  employees = [],
  selectedWeekLabel = "",
  isLiveWeek = false,
  onSelectStaff,
}) => {
  const [showAllTop, setShowAllTop] = useState(false);

  // Sort overall performers across all departments for current selected week (unique per person)
  const rankedPerformers = useMemo(() => {
    if (!employees || employees.length === 0) return [];

    // Group by unique employee name so no person repeats across ranks
    const empMap = new Map();

    employees.forEach((emp) => {
      if (!emp || !emp.name || String(emp.name).trim() === "") return;
      const key = emp.name.toLowerCase().trim();

      const targetNum = Number(String(emp.target).replace(/,/g, "")) || 0;
      const actNum = Number(String(emp.actualWorkDone).replace(/,/g, "")) || 0;
      const totNum = Number(String(emp.totalWorkDone).replace(/,/g, "")) || 0;
      const weekPenNum = Number(String(emp.weekPending).replace(/,/g, "")) || 0;
      const allPenNum = Number(String(emp.allPendingTillDate).replace(/,/g, "")) || 0;
      // On-time % is already a target-weighted percentage (0-100, higher = better)
      // computed upstream from the Data sheet's Target and Actual On Time columns.
      const onTimePctNum = Math.min(100, Math.max(0, Number(String(emp.onTimePct).replace(/,/g, "")) || 0));

      if (!empMap.has(key)) {
        empMap.set(key, {
          ...emp,
          target: targetNum,
          actualWorkDone: actNum,
          totalWorkDone: totNum,
          weekPending: weekPenNum,
          allPendingTillDate: allPenNum,
          onTimePct: onTimePctNum,
        });
      } else {
        const existing = empMap.get(key);
        // Consolidate entries for same person
        existing.target += targetNum;
        existing.actualWorkDone += actNum;
        existing.totalWorkDone += totNum;
        existing.weekPending += weekPenNum;
        existing.allPendingTillDate = Math.max(existing.allPendingTillDate, allPenNum);
        // On-time % is already a per-person aggregate from the Data sheet, so keep
        // whichever value is available rather than summing it across rows.
        if (!existing.onTimePct && onTimePctNum) {
          existing.onTimePct = onTimePctNum;
        }

        if (!existing.image && emp.image) existing.image = emp.image;
        if (!existing.designation && emp.designation) existing.designation = emp.designation;
        if (!existing.department && emp.department) existing.department = emp.department;
        if (emp.firm && existing.firm && !existing.firm.toLowerCase().includes(emp.firm.toLowerCase())) {
          existing.firm = `${existing.firm}, ${emp.firm}`;
        } else if (!existing.firm && emp.firm) {
          existing.firm = emp.firm;
        }
      }
    });

    const uniqueList = Array.from(empMap.values()).map((emp) => {
      const completionPct =
        emp.target > 0
          ? Math.round((emp.actualWorkDone / emp.target) * 100)
          : emp.actualWorkDone > 0
          ? 100
          : 0;
        return {
          ...emp,
          completionPct,
        };
      });

    return uniqueList.sort((a, b) => {
      // 1. This week's actual work done vs target (highest done first) — who did the most work
      if (b.actualWorkDone !== a.actualWorkDone) return b.actualWorkDone - a.actualWorkDone;
      // 2. On-time % from the Data sheet (highest first) — who did it on time
      if (b.onTimePct !== a.onTimePct) return b.onTimePct - a.onTimePct;
      // 3. Among those tied on the above, overall Till Date Pending decides (lowest first)
      if (a.allPendingTillDate !== b.allPendingTillDate) return a.allPendingTillDate - b.allPendingTillDate;
      // 4. Final tie-break: completion percentage (highest first)
      return b.completionPct - a.completionPct;
    });
  }, [employees]);

  if (rankedPerformers.length === 0) {
    return null;
  }

  const rank1 = rankedPerformers[0];
  const rank2 = rankedPerformers[1];
  const rank3 = rankedPerformers[2];
  const restTop = rankedPerformers.slice(3, showAllTop ? 10 : 5);

  const onTimeTextColor = (pct) => (pct >= 100 ? "text-emerald-600" : pct >= 80 ? "text-amber-600" : "text-red-600");
  const pendingTextColor = (val) => (val === 0 ? "text-emerald-600" : val <= 3 ? "text-amber-600" : "text-red-600");

  const PODIUM_THEME = {
    1: {
      icon: Crown,
      badgeBg: "bg-gradient-to-r from-amber-400 to-amber-600",
      cardBorder: "border-amber-400",
      cardBg: "bg-gradient-to-b from-amber-50 to-white",
      ring: "ring-2 ring-amber-200",
      label: "👑 #1 CHAMPION",
    },
    2: {
      icon: Medal,
      badgeBg: "bg-slate-400",
      cardBorder: "border-slate-200",
      cardBg: "bg-slate-50/60",
      ring: "",
      label: "#2 Silver",
    },
    3: {
      icon: Award,
      badgeBg: "bg-orange-500",
      cardBorder: "border-orange-200",
      cardBg: "bg-orange-50/60",
      ring: "",
      label: "#3 Bronze",
    },
  };

  const PodiumCard = ({ emp, rank }) => {
    const theme = PODIUM_THEME[rank];
    const Icon = theme.icon;
    const isChampion = rank === 1;

    return (
      <div
        onClick={() => onSelectStaff && onSelectStaff(emp)}
        className={`relative bg-white ${theme.cardBg} border ${theme.cardBorder} ${theme.ring} rounded-xl cursor-pointer transition-all hover:shadow-lg ${
          isChampion
            ? "p-5 shadow-md md:-mt-4 border-2 hover:-translate-y-1 z-10"
            : "p-3.5 shadow-sm mt-3 md:mt-5 hover:-translate-y-0.5"
        }`}
      >
        <div
          className={`absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full whitespace-nowrap ${theme.badgeBg} text-white shadow-sm ${
            isChampion ? "text-xs font-black tracking-wide shadow-md" : "text-[11px] font-bold"
          }`}
        >
          <Icon className={isChampion ? "w-4 h-4" : "w-3.5 h-3.5"} />
          <span>{theme.label}</span>
        </div>

        <div className={`flex flex-col items-center text-center ${isChampion ? "mt-3 mb-4" : "mt-2.5 mb-3"}`}>
          <div className="relative shrink-0 mb-2">
            <Avatar
              src={emp.image}
              name={emp.name}
              className={`rounded-full border-2 border-white shadow-md font-bold ${
                isChampion ? "w-16 h-16 text-base ring-4 ring-amber-300/50" : "w-11 h-11 text-sm"
              }`}
            />
            <div
              className={`absolute -bottom-1 -right-1 rounded-full font-black flex items-center justify-center border-2 border-white shadow-sm ${
                isChampion
                  ? "w-7 h-7 bg-amber-500 text-white text-sm"
                  : "w-5 h-5 bg-white text-gray-700 text-[10px] border-gray-200"
              }`}
            >
              {rank}
            </div>
          </div>
          <h3 className={`font-bold text-gray-900 truncate max-w-full ${isChampion ? "text-lg" : "text-sm"}`}>
            {emp.name}
          </h3>
          <p className={`text-gray-500 truncate ${isChampion ? "text-sm" : "text-xs"}`}>{emp.designation || "Staff"}</p>
          <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5 truncate">
            <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="truncate">{emp.department}</span>
          </div>
        </div>

        <div
          className={`grid grid-cols-5 gap-1.5 rounded-lg text-center ${
            isChampion ? "bg-white border border-amber-100 p-2.5 shadow-inner" : "bg-white/70 border border-gray-100 p-2"
          }`}
        >
          <div>
            <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">Done</p>
            <p className={`font-bold text-emerald-600 flex items-center justify-center gap-0.5 ${isChampion ? "text-base" : "text-sm"}`}>
              {isChampion && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
              {emp.actualWorkDone}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">Target</p>
            <p className={`font-bold text-gray-800 ${isChampion ? "text-base" : "text-sm"}`}>{emp.target}</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">On-Time</p>
            <p className={`font-bold ${onTimeTextColor(emp.onTimePct)} ${isChampion ? "text-base" : "text-sm"}`}>
              {Math.round(emp.onTimePct)}%
            </p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">Pending</p>
            <p className={`font-bold ${pendingTextColor(emp.allPendingTillDate)} ${isChampion ? "text-base" : "text-sm"}`}>
              {emp.allPendingTillDate}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">Comp %</p>
            <p className={`font-bold text-indigo-600 ${isChampion ? "text-base" : "text-sm"}`}>{emp.completionPct}%</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-gray-900">Overall Top Performers Report</h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Leaderboard
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Ranked by: Actual Done → On-Time % → Till Date Pending
            </p>
          </div>
        </div>

        {selectedWeekLabel && (
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              isLiveWeek ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-indigo-50 border-indigo-200 text-indigo-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="uppercase tracking-wider text-[11px]">{isLiveWeek ? "Live Week:" : "Week:"}</span>
            <span className="font-bold">{selectedWeekLabel}</span>
          </div>
        )}
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
        {rank2 && <PodiumCard emp={rank2} rank={2} />}
        {rank1 && <PodiumCard emp={rank1} rank={1} />}
        {rank3 && <PodiumCard emp={rank3} rank={3} />}
      </div>

      {/* Ranks 4 to 10 */}
      {restTop.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              {showAllTop ? "Top 4 to 10 Honor Roll" : "Top 4 & 5 Performers"}
            </h4>
            {rankedPerformers.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllTop((prev) => !prev)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              >
                {showAllTop ? (
                  <>
                    Show Less <ChevronUp className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    View Top 10 <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
            {restTop.map((emp, idx) => {
              const rank = idx + 4;
              return (
                <div
                  key={emp.id || emp.name}
                  onClick={() => onSelectStaff && onSelectStaff(emp)}
                  className="bg-white hover:bg-gray-50 border border-gray-200 hover:border-indigo-300 hover:shadow-sm rounded-lg p-2.5 flex items-center justify-between gap-2.5 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 font-bold text-[11px] flex items-center justify-center shrink-0">
                      {rank}
                    </span>
                    <Avatar
                      src={emp.image}
                      name={emp.name}
                      className="w-8 h-8 rounded-full border border-gray-200 shrink-0 text-xs font-bold"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{emp.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{emp.department}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-emerald-600 block">{emp.actualWorkDone} Done</span>
                    <span className="text-[10px] font-semibold block">
                      <span className={onTimeTextColor(emp.onTimePct)}>{Math.round(emp.onTimePct)}% OT</span>
                      <span className="text-gray-300"> • </span>
                      <span className={pendingTextColor(emp.allPendingTillDate)}>{emp.allPendingTillDate} Pend</span>
                      <span className="text-gray-300"> • </span>
                      <span className="text-indigo-600">{emp.completionPct}%</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverallTopPerformersReport;
