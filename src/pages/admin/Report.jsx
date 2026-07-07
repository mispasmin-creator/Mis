import React, { useState, useEffect, useMemo } from "react";
import { Filter, Search, ChevronDown, Loader2 } from "lucide-react";

const Report = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [filterName, setFilterName] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [isNameDropdownOpen, setIsNameDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const scriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
        if (!scriptUrl) {
          console.error("VITE_APPS_SCRIPT_URL not set");
          setRows([]);
          return;
        }

        const res = await fetch(`${scriptUrl}?sheet=Data`);
        const result = await res.json();

        if (result.success && Array.isArray(result.data)) {
          const parsed = result.data
            .slice(1)
            .filter((row) => row[4] && String(row[4]).trim() !== "")
            .map((row, index) => ({
              id: `row-${index}`,
              department: row[0] || "",
              fmsName: row[2] || "",
              taskName: row[3] || "",
              personName: row[4] || "",
              target: parseFloat(row[10]) || 0,
              totalAchievement: parseFloat(row[11]) || 0,
              workNotDonePct: parseFloat(String(row[12] || "0").replace("%", "")) || 0,
              workNotDoneOnTimePct: parseFloat(String(row[13] || "0").replace("%", "")) || 0,
              allPendingTillDate: parseFloat(row[14]) || 0,
            }));
          setRows(parsed);
        } else {
          console.error("Failed to load Data sheet", result);
          setRows([]);
        }
      } catch (error) {
        console.error("Error fetching Data sheet:", error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const uniqueDepartments = useMemo(
    () => [...new Set(rows.map((r) => r.department).filter(Boolean))].sort(),
    [rows]
  );

  const uniqueNames = useMemo(
    () => [...new Set(rows.map((r) => r.personName).filter(Boolean))].sort(),
    [rows]
  );

  const filteredData = useMemo(() => {
    return rows.filter((row) => {
      const matchesName =
        !filterName || row.personName.toLowerCase().includes(filterName.toLowerCase());
      const matchesDepartment = !filterDepartment || row.department === filterDepartment;
      return matchesName && matchesDepartment;
    });
  }, [rows, filterName, filterDepartment]);

  const clearFilters = () => {
    setFilterName("");
    setFilterDepartment("");
  };

  const handleNameSelect = (name) => {
    setFilterName(name);
    setIsNameDropdownOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4 md:space-y-6 md:p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 justify-between items-start sm:flex-row sm:items-center md:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
            Department Report
          </h1>
        </div>
        <div className="flex flex-shrink-0 gap-2 items-center px-3 py-2 text-sm text-gray-500 bg-gray-50 rounded-md">
          <Filter className="flex-shrink-0 w-4 h-4" />
          <span className="font-medium whitespace-nowrap">{filteredData.length} tasks found</span>
        </div>
      </div>

      {/* Filters Section */}
      <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 justify-between items-start mb-6 sm:flex-row sm:items-center sm:mb-4">
          <h2 className="flex gap-2 items-center text-lg font-semibold text-gray-900">
            <Filter className="w-5 h-5" />
            Filters
          </h2>
          <button
            onClick={clearFilters}
            className="px-4 py-2.5 w-full text-sm font-medium text-gray-600 rounded-md border border-gray-300 transition-colors hover:text-gray-800 hover:bg-gray-50 sm:w-auto"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-4">
          {/* Filter by Name - Dropdown */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Filter by Name
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNameDropdownOpen(!isNameDropdownOpen)}
                className="flex justify-between items-center px-3 py-3 w-full bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <span className={filterName ? "text-gray-900" : "text-gray-500"}>
                  {filterName || "Select employee..."}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    isNameDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isNameDropdownOpen && (
                <div className="overflow-auto absolute z-50 mt-1 w-full max-h-60 bg-white rounded-md border border-gray-300 shadow-lg">
                  <div className="py-1">
                    <button
                      onClick={() => handleNameSelect("")}
                      className="px-4 py-3 w-full text-sm text-left text-gray-700 border-b border-gray-100 hover:bg-gray-100"
                    >
                      All Employees
                    </button>
                    {uniqueNames.map((name) => (
                      <button
                        key={name}
                        onClick={() => handleNameSelect(name)}
                        className="flex gap-3 items-center px-4 py-3 w-full text-sm text-left text-gray-900 border-b border-gray-100 hover:bg-gray-100 last:border-b-0"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Filter by Department */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Filter by Department
            </label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-3 py-3 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Departments</option>
              {uniqueDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        <div className="w-full p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600">FMS Name</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {[...new Set(filteredData.map((r) => r.fmsName))].length}
              </p>
            </div>
            <div className="flex justify-center items-center w-9 h-9 bg-indigo-50 rounded-full ml-3">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="w-full p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600">Employees</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {[...new Set(filteredData.map((r) => r.personName))].length}
              </p>
            </div>
            <div className="flex justify-center items-center w-9 h-9 bg-green-50 rounded-full ml-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="w-full p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600">Pending Tasks</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {filteredData.reduce((total, r) => total + r.allPendingTillDate, 0)}
              </p>
            </div>
            <div className="flex justify-center items-center w-9 h-9 bg-orange-50 rounded-full ml-3">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="w-full p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600">Avg % Work Not Done</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {filteredData.length > 0
                  ? Math.round(
                      filteredData.reduce((total, r) => total + r.workNotDonePct, 0) / filteredData.length
                    )
                  : 0}%
              </p>
            </div>
            <div className="flex justify-center items-center w-9 h-9 bg-red-50 rounded-full ml-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap md:px-4">Department</th>
                <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap md:px-4">FMS Name</th>
                <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap md:px-4">Task Name</th>
                <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap md:px-4">Employee</th>
                <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap md:px-4">Target</th>
                <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap md:px-4">Total Achievement</th>
                <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap md:px-4">% Work Not Done</th>
                <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap md:px-4">% Not Done On Time</th>
                <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap md:px-4">All Pending Till Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length > 0 ? (
                filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm font-medium text-gray-900 whitespace-nowrap md:px-4">{row.department}</td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-900 whitespace-nowrap md:px-4">{row.fmsName}</td>
                    <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap md:px-4">{row.taskName}</td>
                    <td className="px-3 py-3 whitespace-nowrap md:px-4">
                      <span className="text-sm font-medium text-gray-900">{row.personName}</span>
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 whitespace-nowrap md:px-4">
                      <span className="inline-flex justify-center items-center w-14 h-8 text-sm font-semibold text-indigo-800 bg-indigo-100 rounded-full">
                        {row.target}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 whitespace-nowrap md:px-4">
                      <span
                        className={`inline-flex items-center justify-center w-16 h-8 rounded-full text-sm font-semibold ${
                          row.totalAchievement >= row.target
                            ? "bg-green-100 text-green-800"
                            : row.totalAchievement >= row.target * 0.8
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {row.totalAchievement}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 whitespace-nowrap md:px-4">
                      <span
                        className={`inline-flex items-center justify-center w-16 h-8 rounded-full text-sm font-semibold ${
                          row.workNotDonePct <= 10
                            ? "bg-green-100 text-green-800"
                            : row.workNotDonePct <= 30
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {row.workNotDonePct}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 whitespace-nowrap md:px-4">
                      <span
                        className={`inline-flex items-center justify-center w-16 h-8 rounded-full text-sm font-semibold ${
                          row.workNotDoneOnTimePct <= 10
                            ? "bg-green-100 text-green-800"
                            : row.workNotDoneOnTimePct <= 30
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {row.workNotDoneOnTimePct}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 whitespace-nowrap md:px-4">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                          row.allPendingTillDate === 0
                            ? "bg-green-100 text-green-800"
                            : row.allPendingTillDate <= 3
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {row.allPendingTillDate}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                    <div className="flex flex-col justify-center items-center">
                      <Filter className="mb-2 w-12 h-12 text-gray-300" />
                      <p className="text-lg font-medium text-gray-900">No tasks found</p>
                      <p className="text-gray-500">Try adjusting your filters to see more results</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        <div className="space-y-3">
          {filteredData.length > 0 ? (
            filteredData.map((row) => (
              <div key={row.id} className="p-3 bg-white border border-gray-200 rounded-lg">
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-600 mb-1">{row.department}</div>
                  <div className="text-xs font-medium text-indigo-600 mb-1">{row.fmsName}</div>
                  <div className="text-sm font-medium text-gray-900">{row.taskName}</div>
                </div>

                <div className="flex items-center mb-3 pb-2 border-b border-gray-100">
                  <span className="text-xs text-gray-600">{row.personName}</span>
                </div>

                <div className="grid grid-cols-5 gap-1 text-center">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">TGT</div>
                    <span className="text-sm font-semibold text-indigo-600">{row.target}</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">ACH</div>
                    <span className={`text-sm font-semibold ${row.totalAchievement >= row.target ? "text-green-600" : "text-red-600"}`}>
                      {row.totalAchievement}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">NOT DONE</div>
                    <span className={`text-sm font-semibold ${row.workNotDonePct <= 10 ? "text-green-600" : row.workNotDonePct <= 30 ? "text-yellow-600" : "text-red-600"}`}>
                      {row.workNotDonePct}%
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">NOT OT</div>
                    <span className={`text-sm font-semibold ${row.workNotDoneOnTimePct <= 10 ? "text-green-600" : row.workNotDoneOnTimePct <= 30 ? "text-yellow-600" : "text-red-600"}`}>
                      {row.workNotDoneOnTimePct}%
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">PEN</div>
                    <span className={`text-sm font-semibold ${row.allPendingTillDate === 0 ? "text-green-600" : row.allPendingTillDate <= 3 ? "text-yellow-600" : "text-red-600"}`}>
                      {row.allPendingTillDate}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Filter className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">No tasks found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Report;
