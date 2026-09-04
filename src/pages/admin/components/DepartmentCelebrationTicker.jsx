import React from "react";
import { Trophy, Award, TrendingUp, CheckCircle2, Star } from "lucide-react";
import { useTopPerformers } from "../../../contexts/TopPerformersContext";

const DepartmentCelebrationTicker = ({ departmentTopPerformers: propPerformers }) => {
    const { topPerformers: contextPerformers, loading } = useTopPerformers();
    const performers = (propPerformers && propPerformers.length > 0) ? propPerformers : contextPerformers;

    // If loading or no performers, return null
    if (!performers || performers.length === 0) {
        return null;
    }

    // Duplicate list so the marquee scroll loops seamlessly without gaps
    const tickerItems = [...performers, ...performers];

    // Refined corporate department color theme
    const getDeptStyle = (deptName = "") => {
        const d = String(deptName).toUpperCase();
        if (d.includes("IT")) return { bg: "bg-cyan-50 border-cyan-200/80 text-cyan-800", dot: "bg-cyan-500" };
        if (d.includes("ACCOUNT")) return { bg: "bg-emerald-50 border-emerald-200/80 text-emerald-800", dot: "bg-emerald-500" };
        if (d.includes("PROD")) return { bg: "bg-amber-50 border-amber-200/80 text-amber-800", dot: "bg-amber-500" };
        if (d.includes("STORE")) return { bg: "bg-purple-50 border-purple-200/80 text-purple-800", dot: "bg-purple-500" };
        if (d.includes("SALE")) return { bg: "bg-rose-50 border-rose-200/80 text-rose-800", dot: "bg-rose-500" };
        if (d.includes("PURCHASE")) return { bg: "bg-indigo-50 border-indigo-200/80 text-indigo-800", dot: "bg-indigo-500" };
        if (d.includes("HR") || d.includes("ADMIN")) return { bg: "bg-pink-50 border-pink-200/80 text-pink-800", dot: "bg-pink-500" };
        return { bg: "bg-slate-50 border-slate-200/80 text-slate-800", dot: "bg-slate-500" };
    };

    return (
        <div className="relative flex items-center bg-gradient-to-r from-slate-50 via-white to-slate-50 border border-slate-200/90 rounded-xl px-2 py-1 shadow-2xs overflow-hidden backdrop-blur-xs w-full max-w-full">
            {/* Left Executive Top Performers Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white rounded-lg text-[11px] font-bold shadow-xs flex-shrink-0 z-10 select-none">
                <Trophy className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span className="hidden sm:inline uppercase tracking-wider text-[10px]">Top Performers</span>
                <span className="sm:hidden text-[10px]">Top</span>
            </div>

            {/* Seamless Infinite Marquee Ticker */}
            <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)] mx-2">
                <div className="flex items-center gap-3 py-0.5 animate-celebration-marquee hover:[animation-play-state:paused] w-max cursor-pointer">
                    {tickerItems.map((emp, index) => {
                        const style = getDeptStyle(emp.department);
                        const doneCount = emp.actualWorkDone || emp.totalWorkDone || 0;

                        return (
                            <div
                                key={`${emp.department}-${emp.name}-${index}`}
                                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-lg px-2.5 py-0.5 shadow-2xs transition-all duration-200 hover:scale-[1.02] flex-shrink-0"
                            >
                                {/* Profile Avatar */}
                                <div className="relative flex-shrink-0">
                                    {emp.image ? (
                                        <img
                                            src={emp.image}
                                            alt={emp.name}
                                            className="w-5 h-5 rounded-full object-cover border border-slate-300"
                                            onError={(e) => {
                                                e.currentTarget.style.display = "none";
                                                if (e.currentTarget.nextElementSibling) {
                                                    e.currentTarget.nextElementSibling.style.display = "flex";
                                                }
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className={`w-5 h-5 rounded-full bg-indigo-100 border border-indigo-200 items-center justify-center text-indigo-700 font-bold text-[9px] ${emp.image ? "hidden" : "flex"}`}
                                    >
                                        {emp.name ? emp.name.charAt(0).toUpperCase() : "U"}
                                    </div>
                                    <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 rounded-full w-2.5 h-2.5 flex items-center justify-center shadow-2xs">
                                        <Star className="w-1.5 h-1.5 fill-slate-900 text-slate-900" />
                                    </div>
                                </div>

                                {/* Department Pill */}
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${style.bg} uppercase tracking-wider flex items-center gap-1 flex-shrink-0`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
                                    {emp.department}
                                </span>

                                {/* Employee Name */}
                                <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">
                                    {emp.name}
                                </span>

                                {/* Score / Tasks Done Badge */}
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex-shrink-0">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>{doneCount} Done</span>
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right subtle metric icon */}
            <div className="hidden lg:flex items-center pr-1 text-indigo-600 flex-shrink-0 select-none">
                <TrendingUp className="w-3.5 h-3.5" />
            </div>
        </div>
    );
};

export default DepartmentCelebrationTicker;
