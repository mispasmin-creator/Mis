import React, { useState, useMemo } from "react";
import {
  Trophy,
  Award,
  Crown,
  Medal,
  Star,
  Flame,
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Building2,
  Briefcase,
  Users,
  ExternalLink,
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

      if (!empMap.has(key)) {
        empMap.set(key, {
          ...emp,
          target: targetNum,
          actualWorkDone: actNum,
          totalWorkDone: totNum,
          weekPending: weekPenNum,
          allPendingTillDate: allPenNum,
        });
      } else {
        const existing = empMap.get(key);
        // Consolidate entries for same person
        existing.target += targetNum;
        existing.actualWorkDone += actNum;
        existing.totalWorkDone += totNum;
        existing.weekPending += weekPenNum;
        existing.allPendingTillDate = Math.max(existing.allPendingTillDate, allPenNum);

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
      // 1. Actual work done (highest first)
      if (b.actualWorkDone !== a.actualWorkDone) return b.actualWorkDone - a.actualWorkDone;
      // 2. Total work done (highest first)
      if (b.totalWorkDone !== a.totalWorkDone) return b.totalWorkDone - a.totalWorkDone;
      // 3. Completion percentage (highest first)
      if (b.completionPct !== a.completionPct) return b.completionPct - a.completionPct;
      // 4. Pending tasks (lowest first)
      return a.allPendingTillDate - b.allPendingTillDate;
    });
  }, [employees]);

  if (rankedPerformers.length === 0) {
    return null;
  }

  const rank1 = rankedPerformers[0];
  const rank2 = rankedPerformers[1];
  const rank3 = rankedPerformers[2];
  const restTop = rankedPerformers.slice(3, showAllTop ? 10 : 5);

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return {
        bg: "bg-amber-500 text-white shadow-amber-200 shadow-md ring-2 ring-amber-300",
        label: "1st Place",
        icon: Crown,
        color: "text-amber-500",
      };
    }
    if (rank === 2) {
      return {
        bg: "bg-slate-500 text-white shadow-slate-200 shadow-md ring-2 ring-slate-300",
        label: "2nd Place",
        icon: Medal,
        color: "text-slate-500",
      };
    }
    if (rank === 3) {
      return {
        bg: "bg-amber-700 text-white shadow-amber-100 shadow-md ring-2 ring-amber-800/30",
        label: "3rd Place",
        icon: Award,
        color: "text-amber-700",
      };
    }
    return {
      bg: "bg-gray-100 text-gray-700",
      label: `${rank}th`,
      icon: Star,
      color: "text-gray-500",
    };
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 rounded-2xl border border-indigo-700/40 shadow-xl overflow-hidden text-white p-4 md:p-6 transition-all">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-indigo-800/60">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 ring-2 ring-amber-300/40 flex-shrink-0">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg md:text-xl font-black tracking-tight text-white flex items-center gap-2">
                Overall Top Performers Report
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Flame className="w-3 h-3 text-amber-400" /> Leaderboard
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              Ranked across all departments by verified tasks completed &amp; efficiency
            </p>
          </div>
        </div>

        {selectedWeekLabel && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-white shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-indigo-200 text-[11px] font-bold uppercase tracking-wider">
              {isLiveWeek ? "Live Week:" : "Week:"}
            </span>
            <span className="font-bold text-amber-300">{selectedWeekLabel}</span>
          </div>
        )}
      </div>

      {/* Top 3 Podium Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 pb-4 items-end">
        {/* 2nd Place (Silver) */}
        {rank2 && (
          <div
            onClick={() => onSelectStaff && onSelectStaff(rank2)}
            className="order-2 md:order-1 relative bg-white/10 hover:bg-white/15 border border-slate-300/30 hover:border-slate-200/60 rounded-2xl p-4.5 backdrop-blur-md transition-all duration-300 cursor-pointer group shadow-lg hover:-translate-y-1"
          >
            <div className="absolute -top-3.5 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-300 text-slate-900 text-xs font-black shadow-md">
              <Medal className="w-3.5 h-3.5 text-slate-800" />
              <span>#2 Silver</span>
            </div>

            <div className="flex items-center gap-3.5 mt-2 mb-3.5">
              <div className="relative">
                <Avatar
                  src={rank2.image}
                  name={rank2.name}
                  className="w-13 h-13 md:w-14 md:h-14 rounded-full border-2 border-slate-300 shadow-md text-sm font-bold"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-200 text-slate-900 font-extrabold text-[10px] flex items-center justify-center border border-white shadow">
                  2
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm md:text-base font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                  {rank2.name}
                </h3>
                <p className="text-xs text-indigo-200 truncate">{rank2.designation || "Staff"}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300 mt-0.5 truncate">
                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{rank2.department}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-black/25 rounded-xl p-2.5 border border-white/5 text-center">
              <div>
                <p className="text-[10px] text-indigo-200/70 font-semibold uppercase">Done</p>
                <p className="text-sm font-black text-emerald-400">{rank2.actualWorkDone}</p>
              </div>
              <div>
                <p className="text-[10px] text-indigo-200/70 font-semibold uppercase">Target</p>
                <p className="text-sm font-bold text-white">{rank2.target}</p>
              </div>
              <div>
                <p className="text-[10px] text-indigo-200/70 font-semibold uppercase">Comp %</p>
                <p className="text-sm font-bold text-amber-300">{rank2.completionPct}%</p>
              </div>
            </div>
          </div>
        )}

        {/* 1st Place (Champion Gold) - Featured Center/Top */}
        {rank1 && (
          <div
            onClick={() => onSelectStaff && onSelectStaff(rank1)}
            className="order-1 md:order-2 relative bg-gradient-to-b from-amber-500/25 via-white/15 to-white/10 hover:from-amber-500/35 border-2 border-amber-400/80 hover:border-amber-300 rounded-2xl p-5 backdrop-blur-md transition-all duration-300 cursor-pointer group shadow-2xl shadow-amber-500/20 hover:-translate-y-2 md:-mt-4"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-amber-950 text-xs font-black shadow-lg shadow-amber-500/40 uppercase tracking-wide">
              <Crown className="w-4 h-4 text-amber-950 fill-amber-950" />
              <span>👑 #1 Overall Champion</span>
            </div>

            <div className="flex flex-col items-center text-center mt-3 mb-4">
              <div className="relative mb-2.5">
                <Avatar
                  src={rank1.image}
                  name={rank1.name}
                  className="w-18 h-18 md:w-20 md:h-20 rounded-full border-3 border-amber-300 shadow-xl text-base font-black ring-4 ring-amber-400/30"
                />
                <div className="absolute -top-2 -right-1 w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center border-2 border-white shadow-lg">
                  1
                </div>
              </div>
              <h3 className="text-base md:text-lg font-black text-amber-200 group-hover:text-amber-100 transition-colors">
                {rank1.name}
              </h3>
              <p className="text-xs text-indigo-200 font-medium">{rank1.designation || "Department Star"}</p>
              <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-300/90 bg-amber-400/15 px-2.5 py-0.5 rounded-full mt-1 border border-amber-400/30">
                <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{rank1.department}</span>
                {rank1.firm && <span className="text-amber-200/70">• {rank1.firm}</span>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-black/35 rounded-xl p-3 border border-amber-400/20 text-center">
              <div>
                <p className="text-[10px] text-amber-200/80 font-bold uppercase">Actual Done</p>
                <p className="text-base font-black text-green-400 flex items-center justify-center gap-0.5">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 inline" />
                  {rank1.actualWorkDone}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-amber-200/80 font-bold uppercase">Target</p>
                <p className="text-base font-bold text-white">{rank1.target}</p>
              </div>
              <div>
                <p className="text-[10px] text-amber-200/80 font-bold uppercase">Completion</p>
                <p className="text-base font-black text-amber-300">{rank1.completionPct}%</p>
              </div>
            </div>
          </div>
        )}

        {/* 3rd Place (Bronze) */}
        {rank3 && (
          <div
            onClick={() => onSelectStaff && onSelectStaff(rank3)}
            className="order-3 relative bg-white/10 hover:bg-white/15 border border-amber-700/40 hover:border-amber-600/70 rounded-2xl p-4.5 backdrop-blur-md transition-all duration-300 cursor-pointer group shadow-lg hover:-translate-y-1"
          >
            <div className="absolute -top-3.5 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-700 text-white text-xs font-black shadow-md">
              <Award className="w-3.5 h-3.5 text-amber-200" />
              <span>#3 Bronze</span>
            </div>

            <div className="flex items-center gap-3.5 mt-2 mb-3.5">
              <div className="relative">
                <Avatar
                  src={rank3.image}
                  name={rank3.name}
                  className="w-13 h-13 md:w-14 md:h-14 rounded-full border-2 border-amber-600 shadow-md text-sm font-bold"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-700 text-white font-extrabold text-[10px] flex items-center justify-center border border-white shadow">
                  3
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm md:text-base font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                  {rank3.name}
                </h3>
                <p className="text-xs text-indigo-200 truncate">{rank3.designation || "Staff"}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-amber-200/80 mt-0.5 truncate">
                  <Building2 className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="truncate">{rank3.department}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-black/25 rounded-xl p-2.5 border border-white/5 text-center">
              <div>
                <p className="text-[10px] text-indigo-200/70 font-semibold uppercase">Done</p>
                <p className="text-sm font-black text-emerald-400">{rank3.actualWorkDone}</p>
              </div>
              <div>
                <p className="text-[10px] text-indigo-200/70 font-semibold uppercase">Target</p>
                <p className="text-sm font-bold text-white">{rank3.target}</p>
              </div>
              <div>
                <p className="text-[10px] text-indigo-200/70 font-semibold uppercase">Comp %</p>
                <p className="text-sm font-bold text-amber-300">{rank3.completionPct}%</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ranks 4 to 10 Leaderboard Table / Cards */}
      {restTop.length > 0 && (
        <div className="mt-4 pt-4 border-t border-indigo-800/60">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              {showAllTop ? "Top 4 to 10 Honor Roll" : "Top 4 & 5 Performers"}
            </h4>
            {rankedPerformers.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllTop((prev) => !prev)}
                className="text-xs font-bold text-amber-300 hover:text-amber-200 inline-flex items-center gap-1 bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
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
                  className="bg-white/5 hover:bg-white/12 border border-white/10 hover:border-indigo-400/40 rounded-xl p-3 flex items-center justify-between gap-2.5 cursor-pointer transition-all duration-200 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-indigo-800/80 text-indigo-200 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                      {rank}
                    </span>
                    <Avatar
                      src={emp.image}
                      name={emp.name}
                      className="w-8 h-8 rounded-full border border-white/20 shrink-0 text-xs font-bold"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                        {emp.name}
                      </p>
                      <p className="text-[10px] text-indigo-300/80 truncate">{emp.department}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-emerald-400 block">
                      {emp.actualWorkDone} Done
                    </span>
                    <span className="text-[10px] text-amber-300 font-semibold">
                      {emp.completionPct}%
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
