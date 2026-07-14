import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Users,
  Target,
  Clock,
  TrendingUp,
  Search,
  ChevronDown,
  ChevronUp,
  Award,
  Loader2,
  Filter,
} from "lucide-react";
import { getDisplayableImageUrl } from "../../utils/imageUtils";
import { useAuth } from "../../contexts/AuthContext";
import Avatar from "../../components/common/Avatar";
import StatsCard from "../../components/dashboard/StatsCard";
import DepartmentWorkloadChart from "../../components/charts/DepartmentWorkloadChart";
import DepartmentScoreChart from "../../components/charts/DepartmentScoreChart";
import DoughnutChart from "../../components/charts/DoughnutChart";
import StaffDetailModal from "./components/StaffDetailModal";

const PALETTE = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#06b6d4",
  "#8b5cf6", "#ec4899", "#84cc16", "#f97316", "#0ea5e9",
];

const DepartmentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [departmentScores, setDepartmentScores] = useState([]);

  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [performanceFilter, setPerformanceFilter] = useState("all");
  const [searchName, setSearchName] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "completionPct", dir: "desc" });
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Lock body scroll while the staff detail modal is open
  useEffect(() => {
    document.body.style.overflow = selectedStaff ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedStaff]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const scriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
        if (!scriptUrl) {
          console.error("VITE_APPS_SCRIPT_URL not set");
          setEmployees([]);
          setLoading(false);
          return;
        }

        const [recordsResponse, masterResponse, deptScoreResponse] = await Promise.all([
          fetch(`${scriptUrl}?sheet=For Records`),
          fetch(`${scriptUrl}?sheet=Master`),
          fetch(`${scriptUrl}?sheet=Department Score Graph`),
        ]);

        const result = await recordsResponse.json();
        const masterResult = await masterResponse.json();
        const deptScoreResult = await deptScoreResponse.json();

        if (deptScoreResult.success && Array.isArray(deptScoreResult.data)) {
          const parsedDeptScores = deptScoreResult.data
            .slice(1)
            .filter((row) => row[0])
            .map((row) => ({
              name: row[0],
              workNotDonePct: parseFloat(row[1]) || 0,
              notDoneOnTimePct: parseFloat(row[2]) || 0,
              pendingWorks: parseInt(row[3]) || 0,
            }));
          setDepartmentScores(parsedDeptScores);
        }

        const designationMap = {};
        const departmentMap = {};
        const imageMap = {};
        const phoneMap = {};
        const reportedByMap = {};
        if (masterResult.success && Array.isArray(masterResult.data)) {
          masterResult.data.slice(1).forEach((row) => {
            const name = row[0] ? String(row[0]).trim().toLowerCase() : "";
            const department = row[2] ? String(row[2]).trim() : "";
            const designation = row[3] ? String(row[3]).trim() : "";
            const imageUrl = row[4];
            const phone = row[1] ? String(row[1]).trim() : "";
            const reportedBy = row[9] ? String(row[9]).trim().toLowerCase() : "";
            if (name) {
              if (imageUrl) imageMap[name] = imageUrl;
              if (designation) designationMap[name] = designation;
              if (department) departmentMap[name] = department;
              if (phone) phoneMap[name] = phone;
              if (reportedBy) reportedByMap[name] = reportedBy;
            }
          });
        }

        if (result.success && Array.isArray(result.data)) {
          const parsedData = result.data
            .slice(2)
            .filter((row) => row[2] && String(row[2]).trim() !== "")
            .map((row, index) => {
              const empName = row[2] || "Unknown";
              const normalizedName = String(empName).trim().toLowerCase();
              const rawImageUrl = imageMap[normalizedName];
              const finalImageUrl = rawImageUrl ? getDisplayableImageUrl(rawImageUrl) : null;

              return {
                id: `dept-emp-${index}`,
                name: empName,
                designation: designationMap[normalizedName] || "",
                department: departmentMap[normalizedName] || "Unassigned",
                phone: phoneMap[normalizedName] || "",
                image: finalImageUrl,
                target: parseFloat(row[3]) || 0,
                actualWorkDone: parseFloat(row[4]) || 0,
                weekPending: parseFloat(row[8]) || 0,
                allPendingTillDate: parseFloat(row[9]) || 0,
              };
            });

          const isAdmin = user && (user.role === "admin" || user.role === "superadmin");
          const isHod = user && user.role === "hod";
          const lowerName = (user?.name || "").toLowerCase().trim();
          const lowerId = (user?.id || "").toLowerCase().trim();

          const finalData = isAdmin
            ? parsedData
            : isHod
            ? parsedData.filter((emp) => {
                const empLowerName = emp.name.toLowerCase().trim();
                const empManager = reportedByMap[empLowerName] || "";
                return empLowerName === lowerName || empManager === lowerName || empManager === lowerId;
              })
            : parsedData.filter((emp) => emp.name.toLowerCase().trim() === lowerName);

          setEmployees(finalData);
        } else {
          console.error("Failed to load sheet data", result);
          setEmployees([]);
        }
      } catch (error) {
        console.error("Error fetching department dashboard data:", error);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const employeesWithStats = useMemo(
    () =>
      employees.map((emp) => {
        const completionPct =
          emp.target > 0 ? Math.round((emp.actualWorkDone / emp.target) * 100) : emp.actualWorkDone > 0 ? 100 : 0;
        return { ...emp, completionPct };
      }),
    [employees]
  );

  const uniqueDesignations = useMemo(
    () => [...new Set(employeesWithStats.map((e) => e.designation).filter(Boolean))].sort(),
    [employeesWithStats]
  );

  const departmentAgg = useMemo(() => {
    const byDept = {};
    employeesWithStats.forEach((emp) => {
      const dept = emp.department || "Unassigned";
      if (!byDept[dept]) {
        byDept[dept] = { department: dept, staffCount: 0, target: 0, actual: 0, pending: 0, employees: [] };
      }
      byDept[dept].staffCount += 1;
      byDept[dept].target += emp.target;
      byDept[dept].actual += emp.actualWorkDone;
      byDept[dept].pending += emp.allPendingTillDate;
      byDept[dept].employees.push(emp);
    });

    return Object.values(byDept)
      .map((d) => {
        const completionPct = d.target > 0 ? Math.round((d.actual / d.target) * 100) : d.actual > 0 ? 100 : 0;
        const topPerformer = [...d.employees].sort((a, b) => b.completionPct - a.completionPct)[0];
        return { ...d, completionPct, topPerformer };
      })
      .sort((a, b) => b.staffCount - a.staffCount);
  }, [employeesWithStats]);

  const overallStats = useMemo(() => {
    const totalStaff = employeesWithStats.length;
    const totalTarget = employeesWithStats.reduce((s, e) => s + e.target, 0);
    const totalActual = employeesWithStats.reduce((s, e) => s + e.actualWorkDone, 0);
    const totalPending = employeesWithStats.reduce((s, e) => s + e.allPendingTillDate, 0);
    const completionPct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
    return { totalDepartments: departmentAgg.length, totalStaff, completionPct, totalPending };
  }, [employeesWithStats, departmentAgg]);

  const departmentWorkloadLabels = useMemo(() => departmentAgg.map((d) => d.department), [departmentAgg]);
  const departmentWorkloadTarget = useMemo(() => departmentAgg.map((d) => d.target), [departmentAgg]);
  const departmentWorkloadActual = useMemo(() => departmentAgg.map((d) => d.actual), [departmentAgg]);
  const departmentStaffCounts = useMemo(() => departmentAgg.map((d) => d.staffCount), [departmentAgg]);

  const departmentScoresLabels = useMemo(() => departmentScores.map((d) => d.name), [departmentScores]);
  const departmentScoresPending = useMemo(() => departmentScores.map((d) => d.pendingWorks), [departmentScores]);
  const departmentScoresNotDone = useMemo(() => departmentScores.map((d) => d.workNotDonePct), [departmentScores]);
  const departmentScoresNotDoneOnTime = useMemo(
    () => departmentScores.map((d) => d.notDoneOnTimePct),
    [departmentScores]
  );

  const filteredStaff = useMemo(() => {
    let list = employeesWithStats.filter((emp) => {
      const matchesDept = !selectedDepartment || emp.department === selectedDepartment;
      const matchesDesignation = !selectedDesignation || emp.designation === selectedDesignation;
      const matchesName = !searchName || emp.name.toLowerCase().includes(searchName.toLowerCase());
      const matchesPerformance =
        performanceFilter === "best"
          ? emp.completionPct >= 100
          : performanceFilter === "average"
          ? emp.completionPct >= 80 && emp.completionPct < 100
          : performanceFilter === "attention"
          ? emp.completionPct < 80
          : performanceFilter === "pending"
          ? emp.allPendingTillDate > 0
          : true;
      return matchesDept && matchesDesignation && matchesName && matchesPerformance;
    });

    const { key, dir } = sortConfig;
    list = [...list].sort((a, b) => {
      let av = a[key];
      let bv = b[key];
      if (typeof av === "string") {
        return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return dir === "asc" ? av - bv : bv - av;
    });

    return list;
  }, [employeesWithStats, selectedDepartment, selectedDesignation, searchName, performanceFilter, sortConfig]);

  const hasActiveFilters = selectedDepartment || selectedDesignation || searchName || performanceFilter !== "all";

  const clearFilters = () => {
    setSelectedDepartment("");
    setSelectedDesignation("");
    setSearchName("");
    setPerformanceFilter("all");
  };

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }
    );
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.dir === "asc" ? (
      <ChevronUp className="inline w-3 h-3 ml-0.5" />
    ) : (
      <ChevronDown className="inline w-3 h-3 ml-0.5" />
    );
  };

  const pillColor = (pct) =>
    pct >= 100 ? "bg-green-100 text-green-800" : pct >= 80 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";

  const pendingPillColor = (val) =>
    val === 0 ? "bg-green-100 text-green-800" : val <= 3 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-3 space-y-5 md:space-y-6 md:p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 justify-between items-start sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 md:text-2xl flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            Department Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Department-wise &amp; staff-wise performance overview</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatsCard title="Departments" value={overallStats.totalDepartments} icon={Building2} color="purple" />
        <StatsCard title="Total Staff" value={overallStats.totalStaff} icon={Users} color="blue" />
        <StatsCard title="Overall Completion" value={`${overallStats.completionPct}%`} icon={TrendingUp} color="green" />
        <StatsCard title="Total Pending" value={overallStats.totalPending} icon={Clock} color="amber" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-4 h-96 flex flex-col overflow-hidden max-w-full">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex-shrink-0">Target vs Actual — by Department</h3>
          <div className="flex-1 min-h-0 min-w-0">
            {departmentWorkloadLabels.length > 0 ? (
              <DepartmentWorkloadChart
                labels={departmentWorkloadLabels}
                targetData={departmentWorkloadTarget}
                actualData={departmentWorkloadActual}
              />
            ) : (
              <p className="text-sm text-gray-400 text-center mt-10">No data available</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 h-96 flex flex-col overflow-hidden max-w-full">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex-shrink-0">Staff Distribution</h3>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {departmentWorkloadLabels.length > 0 ? (
              <DoughnutChart
                labels={departmentWorkloadLabels}
                data={departmentStaffCounts}
                colors={departmentWorkloadLabels.map((_, i) => PALETTE[i % PALETTE.length])}
              />
            ) : (
              <p className="text-sm text-gray-400 text-center">No data available</p>
            )}
          </div>
        </div>
      </div>

      {departmentScoresLabels.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 h-[520px] flex flex-col overflow-hidden max-w-full">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex-shrink-0">Department Score — Pending vs Not-Done %</h3>
          <div className="flex-1 min-h-0 min-w-0">
            <DepartmentScoreChart
              labels={departmentScoresLabels}
              pendingData={departmentScoresPending}
              notDoneData={departmentScoresNotDone}
              notDoneOnTimeData={departmentScoresNotDoneOnTime}
            />
          </div>
        </div>
      )}

      {/* Department Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900">Departments</h3>
          {selectedDepartment && (
            <button
              onClick={() => setSelectedDepartment("")}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              Clear selection
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {departmentAgg.map((dept, idx) => {
            const isActive = selectedDepartment === dept.department;
            return (
              <button
                key={dept.department}
                onClick={() => setSelectedDepartment(isActive ? "" : dept.department)}
                className={`text-left p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all ${
                  isActive ? "border-indigo-500 ring-2 ring-indigo-200" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
                  />
                  <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {dept.staffCount}
                  </span>
                </div>
                <h4 className="font-bold text-gray-900 text-sm mb-2 truncate" title={dept.department}>
                  {dept.department}
                </h4>

                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Completion</span>
                  <span className="font-semibold text-gray-700">{dept.completionPct}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full ${
                      dept.completionPct >= 100 ? "bg-green-500" : dept.completionPct >= 80 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(100, dept.completionPct)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" /> {dept.target}/{dept.actual}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${pendingPillColor(dept.pending)}`}>
                    {dept.pending} pending
                  </span>
                </div>

                {dept.topPerformer && (
                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-500 truncate">
                    <Award className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span className="truncate">Top: {dept.topPerformer.name}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters Panel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
        <div className="flex flex-col gap-3 justify-between items-start mb-4 sm:flex-row sm:items-center">
          <h3 className="flex gap-2 items-center text-base font-semibold text-gray-900">
            <Filter className="w-4 h-4" />
            Filters
          </h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 w-full text-sm font-medium text-gray-600 rounded-md border border-gray-300 transition-colors hover:text-gray-800 hover:bg-gray-50 sm:w-auto"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Search staff..."
              className="pl-8 pr-3 py-2.5 text-sm border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Departments</option>
            {departmentAgg.map((d) => (
              <option key={d.department} value={d.department}>
                {d.department}
              </option>
            ))}
          </select>

          <select
            value={selectedDesignation}
            onChange={(e) => setSelectedDesignation(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Designations</option>
            {uniqueDesignations.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={performanceFilter}
            onChange={(e) => setPerformanceFilter(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Performance</option>
            <option value="best">Best Performers (&ge;100%)</option>
            <option value="average">Average (80&ndash;99%)</option>
            <option value="attention">Needs Attention (&lt;80%)</option>
            <option value="pending">Has Pending Tasks</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col gap-3 justify-between items-start mb-4 sm:flex-row sm:items-center">
          <h3 className="text-base font-semibold text-gray-900">Staff Performance</h3>
          <span className="flex gap-2 items-center px-3 py-1.5 text-xs text-gray-500 bg-gray-50 rounded-md font-medium">
            {filteredStaff.length} staff found
          </span>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Staff</th>
                <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Department</th>
                <th
                  className="px-3 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase cursor-pointer select-none"
                  onClick={() => handleSort("target")}
                >
                  Target <SortIcon column="target" />
                </th>
                <th
                  className="px-3 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase cursor-pointer select-none"
                  onClick={() => handleSort("actualWorkDone")}
                >
                  Actual <SortIcon column="actualWorkDone" />
                </th>
                <th
                  className="px-3 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase cursor-pointer select-none"
                  onClick={() => handleSort("completionPct")}
                >
                  Completion <SortIcon column="completionPct" />
                </th>
                <th
                  className="px-3 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase cursor-pointer select-none"
                  onClick={() => handleSort("allPendingTillDate")}
                >
                  Pending <SortIcon column="allPendingTillDate" />
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStaff.length > 0 ? (
                filteredStaff.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedStaff(emp)}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={emp.image} name={emp.name} className="w-8 h-8 rounded-full text-xs flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{emp.name}</p>
                          <p className="text-xs text-gray-500 truncate">{emp.designation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-sm text-gray-700 whitespace-nowrap">{emp.department}</td>
                    <td className="px-3 py-2.5 text-sm text-center text-gray-900">{emp.target}</td>
                    <td className="px-3 py-2.5 text-sm text-center text-gray-900">{emp.actualWorkDone}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold ${pillColor(emp.completionPct)}`}>
                        {emp.completionPct}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold ${pendingPillColor(emp.allPendingTillDate)}`}>
                        {emp.allPendingTillDate}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No staff found for the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {filteredStaff.length > 0 ? (
            filteredStaff.map((emp) => (
              <div
                key={emp.id}
                onClick={() => setSelectedStaff(emp)}
                className="p-3 bg-white border border-gray-200 rounded-lg active:bg-gray-50"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <Avatar src={emp.image} name={emp.name} className="w-9 h-9 rounded-full text-xs flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{emp.name}</p>
                    <p className="text-xs text-gray-500 truncate">{emp.department}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1 text-center">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">TGT</div>
                    <span className="text-sm font-semibold text-indigo-600">{emp.target}</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">ACT</div>
                    <span className="text-sm font-semibold text-gray-800">{emp.actualWorkDone}</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">COMP</div>
                    <span className={`text-sm font-semibold ${emp.completionPct >= 100 ? "text-green-600" : emp.completionPct >= 80 ? "text-amber-600" : "text-red-600"}`}>
                      {emp.completionPct}%
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">PEN</div>
                    <span className={`text-sm font-semibold ${emp.allPendingTillDate === 0 ? "text-green-600" : emp.allPendingTillDate <= 3 ? "text-amber-600" : "text-red-600"}`}>
                      {emp.allPendingTillDate}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500 text-sm">No staff found for the selected filters</div>
          )}
        </div>
      </div>

      <StaffDetailModal employee={selectedStaff} onClose={() => setSelectedStaff(null)} />
    </div>
  );
};

export default DepartmentDashboard;
