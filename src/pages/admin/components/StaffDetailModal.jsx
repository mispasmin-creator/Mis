import React from "react";
import ReactDOM from "react-dom";
import { X, Phone, Briefcase, Building2, Target, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import Avatar from "../../../components/common/Avatar";

const StatTile = ({ icon: Icon, label, value, color }) => (
  <div className={`flex flex-col items-center justify-center gap-1 rounded-lg border p-3 ${color.border} ${color.bg}`}>
    <Icon className={`w-4 h-4 ${color.text}`} />
    <span className={`text-lg font-bold ${color.text}`}>{value}</span>
    <span className="text-[11px] font-medium text-gray-500 text-center leading-tight">{label}</span>
  </div>
);

const StaffDetailModal = ({ employee, onClose }) => {
  if (!employee) return null;

  const target = parseFloat(employee.target) || 0;
  const actual = parseFloat(employee.actualWorkDone) || 0;
  const pending = parseFloat(employee.allPendingTillDate) || 0;
  const completionPct = target > 0 ? Math.round((actual / target) * 100) : actual > 0 ? 100 : 0;

  const completionColor =
    completionPct >= 100
      ? { border: "border-green-200", bg: "bg-green-50", text: "text-green-700" }
      : completionPct >= 80
      ? { border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-700" }
      : { border: "border-red-200", bg: "bg-red-50", text: "text-red-700" };

  const pendingColor =
    pending === 0
      ? { border: "border-green-200", bg: "bg-green-50", text: "text-green-700" }
      : pending <= 3
      ? { border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-700" }
      : { border: "border-red-200", bg: "bg-red-50", text: "text-red-700" };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-br from-indigo-600 to-indigo-500 p-5 pb-14">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
            <Building2 className="w-4 h-4" />
            {employee.department || "Unassigned"}
          </div>
        </div>

        <div className="px-5 -mt-10">
          <Avatar
            src={employee.image}
            name={employee.name}
            className="w-20 h-20 rounded-full border-4 border-white shadow-md text-xl"
          />
        </div>

        <div className="px-5 pt-3 pb-5">
          <h3 className="text-lg font-bold text-gray-900">{employee.name}</h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
            {employee.designation && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" /> {employee.designation}
              </span>
            )}
            {employee.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> {employee.phone}
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 mt-5">
            <StatTile
              icon={Target}
              label="Target"
              value={target}
              color={{ border: "border-indigo-200", bg: "bg-indigo-50", text: "text-indigo-700" }}
            />
            <StatTile icon={CheckCircle2} label="Actual Done" value={actual} color={completionColor} />
            <StatTile icon={TrendingUp} label="Completion" value={`${completionPct}%`} color={completionColor} />
            <StatTile icon={Clock} label="Pending" value={pending} color={pendingColor} />
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
              <span>Completion Progress</span>
              <span>{completionPct}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  completionPct >= 100 ? "bg-green-500" : completionPct >= 80 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${Math.min(100, completionPct)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default StaffDetailModal;
