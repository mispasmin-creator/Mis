import React, { useState, useMemo, useEffect } from 'react';
import { Search, Clock, X, Loader2 } from 'lucide-react';

const parseSheetRef = (ref) => {
  if (!ref) return null;
  const str = String(ref).trim();
  const bangIndex = str.indexOf("!");
  if (bangIndex === -1) return { sheetName: str, colIndex: -1, startRowIndex: 0 };
  const sheetName = str.substring(0, bangIndex);
  const rangePart = str.substring(bangIndex + 1);

  const colMatch = rangePart.match(/^([A-Za-z]+)(\d*)/);
  if (!colMatch) return { sheetName, colIndex: -1, startRowIndex: 0 };

  const colLetter = colMatch[1].toUpperCase();
  let colIndex = 0;
  for (let i = 0; i < colLetter.length; i++) {
    colIndex = colIndex * 26 + (colLetter.charCodeAt(i) - 64);
  }
  colIndex -= 1;

  const startRow = colMatch[2] ? parseInt(colMatch[2]) : 1;
  const startRowIndex = startRow > 0 ? startRow - 1 : 0;

  return { sheetName, colIndex, startRowIndex };
};

const parseFilterDate = (val) => {
  if (val === null || val === undefined || val === "") return null;

  const numVal = Number(val);
  if (!isNaN(numVal) && numVal > 1000 && numVal < 100000) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(epoch.getTime() + numVal * 24 * 60 * 60 * 1000);
  }

  const str = String(val).trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const isoDatePart = str.split('T')[0].split(' ')[0];
    const parts = isoDatePart.split('-');
    if (parts.length >= 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
  }

  const datePart = str.split(' ')[0];
  const parts = datePart.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[2].length === 4) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    if (parts[0].length === 4) return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

const formatDateDisplay = (val) => {
  const d = parseFilterDate(val);
  return d ? d.toLocaleDateString() : String(val || "");
};

const AdminPendingTasks = () => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [personFilter, setPersonFilter] = useState('all');
  const [fmsFilter, setFmsFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeDrillDown, setActiveDrillDown] = useState(null);
  const [drillDownLoading, setDrillDownLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const scriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
        if (!scriptUrl) {
          console.error("VITE_APPS_SCRIPT_URL not set");
          setTasks([]);
          return;
        }

        const res = await fetch(`${scriptUrl}?sheet=Data`);
        const result = await res.json();

        if (result.success && Array.isArray(result.data)) {
          const parsed = result.data
            .slice(1)
            .filter((row) => row[4] && String(row[4]).trim() !== "")
            .map((row, index) => ({
              id: `task-${index}`,
              department: row[0] || "",
              fmsName: row[2] || "",
              taskName: row[3] || "",
              personName: row[4] || "",
              sheetId: row[5] || "",
              plannedSheetRef: row[7] || "",
              actualSheetRef: row[8] || "",
              nameColRef: row[9] || "",
              allPendingTillDate: parseFloat(row[14]) || 0,
              fromDate: row[21] || "",
              toDate: row[22] || "",
              totalPendingDelayTask: parseFloat(row[24]) || 0,
              scriptUrl: row[25] || "",
              taskNameColRef: row[26] || "",
              delayColRef: row[27] || "",
            }));
          setTasks(parsed);
        } else {
          console.error("Failed to load Data sheet", result);
          setTasks([]);
        }
      } catch (error) {
        console.error("Error fetching Data sheet:", error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRowClick = async (task) => {
    const scriptUrl = String(task.scriptUrl || "").trim();
    if (!scriptUrl) {
      console.error("No App Script URL found in Data sheet for task:", task.taskName);
      return;
    }

    const plannedParsed = parseSheetRef(task.plannedSheetRef);
    const actualParsed = parseSheetRef(task.actualSheetRef);
    const nameParsed = parseSheetRef(task.nameColRef);
    const taskNameParsed = parseSheetRef(task.taskNameColRef);
    const delayParsed = parseSheetRef(task.delayColRef);

    setDrillDownLoading(true);
    setActiveDrillDown({
      taskId: task.taskName,
      title: `Pending Tasks - ${task.personName}`,
      rows: [],
      loading: true
    });

    try {
      const sheetDataCache = {};
      const sheetsToFetch = new Set();
      if (plannedParsed?.sheetName) sheetsToFetch.add(plannedParsed.sheetName);
      if (actualParsed?.sheetName) sheetsToFetch.add(actualParsed.sheetName);
      if (nameParsed?.sheetName) sheetsToFetch.add(nameParsed.sheetName);
      if (taskNameParsed?.sheetName) sheetsToFetch.add(taskNameParsed.sheetName);
      if (delayParsed?.sheetName) sheetsToFetch.add(delayParsed.sheetName);

      await Promise.all([...sheetsToFetch].map(async (name) => {
        const separator = scriptUrl.includes('?') ? '&' : '?';
        let fetchUrl = `${scriptUrl}${separator}sheet=${encodeURIComponent(name)}`;
        if (task.sheetId) {
          fetchUrl += `&spreadsheetId=${encodeURIComponent(task.sheetId)}`;
        }
        const res = await fetch(fetchUrl);
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          sheetDataCache[name] = result.data;
        } else {
          throw new Error(`Failed to fetch sheet ${name}`);
        }
      }));

      let matchingRowIndices = null;
      if (nameParsed && nameParsed.sheetName && nameParsed.colIndex >= 0) {
        const nameSheetRows = sheetDataCache[nameParsed.sheetName] || [];
        const nameRowsFromStart = nameParsed.startRowIndex > 0
          ? nameSheetRows.slice(nameParsed.startRowIndex)
          : nameSheetRows;

        matchingRowIndices = [];
        nameRowsFromStart.forEach((row, idx) => {
          const nameInSheet = row[nameParsed.colIndex] ? String(row[nameParsed.colIndex]).trim() : "";
          if (nameInSheet === task.personName) {
            matchingRowIndices.push(idx);
          }
        });
      }

      const getColumnValues = (parsed) => {
        if (!parsed || !parsed.sheetName || parsed.colIndex < 0) return [];
        const allRows = sheetDataCache[parsed.sheetName] || [];
        const rowsFromStart = parsed.startRowIndex > 0 ? allRows.slice(parsed.startRowIndex) : allRows;

        if (matchingRowIndices !== null) {
          return matchingRowIndices.map(idx =>
            rowsFromStart[idx] !== undefined ? rowsFromStart[idx][parsed.colIndex] : ""
          );
        }
        return rowsFromStart.map(row => row[parsed.colIndex]);
      };

      const plannedValues = getColumnValues(plannedParsed);
      const actualValues = getColumnValues(actualParsed);
      const taskNameValues = getColumnValues(taskNameParsed);
      const delayValues = getColumnValues(delayParsed);

      const filterFrom = parseFilterDate(task.fromDate);
      const filterTo = parseFilterDate(task.toDate);
      if (filterTo) filterTo.setHours(23, 59, 59, 999);

      const maxLen = Math.max(plannedValues.length, actualValues.length, taskNameValues.length);
      const rows = [];

      for (let i = 0; i < maxLen; i++) {
        const plannedVal = plannedValues[i] || "";
        const actualVal = actualValues[i] || "";
        const delayVal = delayValues[i] || "";

        if (plannedVal) {
          let inRange = true;
          const pDate = parseFilterDate(plannedVal);
          if (pDate) {
            if (filterFrom && pDate < filterFrom) inRange = false;
            if (filterTo && pDate > filterTo) inRange = false;
          }

          if (inRange) {
            rows.push({
              taskName: taskNameValues[i] || task.taskName,
              plannedDate: formatDateDisplay(plannedVal),
              actualDate: actualVal ? formatDateDisplay(actualVal) : "",
              delayTime: delayVal ? String(delayVal) : "0000"
            });
          }
        }
      }

      setActiveDrillDown({
        taskId: task.taskName,
        title: `Pending Tasks (${rows.length})`,
        rows,
        loading: false
      });
    } catch (error) {
      console.error("Error fetching drill-down data:", error);
      setActiveDrillDown({
        taskId: task.taskName,
        title: `Pending Tasks`,
        rows: [],
        loading: false,
        error: error.message
      });
    } finally {
      setDrillDownLoading(false);
    }
  };

  const persons = useMemo(() => {
    const uniquePersons = [...new Set(tasks.map(task => task.personName))];
    return uniquePersons.sort();
  }, [tasks]);

  const fmsNames = useMemo(() => {
    const uniqueFMS = [...new Set(tasks.map(task => task.fmsName))];
    return uniqueFMS.sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch =
        task.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.fmsName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPerson = personFilter === 'all' || task.personName === personFilter;
      const matchesFMS = fmsFilter === 'all' || task.fmsName === fmsFilter;

      let matchesStatus = true;
      if (statusFilter === 'ontime') matchesStatus = task.allPendingTillDate === 0;
      if (statusFilter === 'pending') matchesStatus = task.allPendingTillDate > 0;
      if (statusFilter === 'delay') matchesStatus = task.totalPendingDelayTask > 0;

      return matchesSearch && matchesPerson && matchesFMS && matchesStatus;
    });
  }, [tasks, searchQuery, personFilter, fmsFilter, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded shadow-sm p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="w-full md:w-56">
              <select
                value={personFilter}
                onChange={(e) => setPersonFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-500 appearance-none bg-white"
              >
                <option value="all">All Persons</option>
                {persons.map(person => (
                  <option key={person} value={person}>{person}</option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-56">
              <select
                value={fmsFilter}
                onChange={(e) => setFmsFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-500 appearance-none bg-white"
              >
                <option value="all">All FMS Names</option>
                {fmsNames.map(fms => (
                  <option key={fms} value={fms}>{fms}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Persons</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {personFilter === 'all' ? persons.length : 1}
                </p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total FMS Names</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {[...new Set(filteredTasks.map(task => task.fmsName))].length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Task Names</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {[...new Set(filteredTasks.map(task => task.taskName))].length}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pending Tasks</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {filteredTasks.reduce((total, task) => total + task.allPendingTillDate, 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-base font-semibold text-gray-700">Pending Tasks</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${statusFilter === 'all' ? 'bg-gray-800 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('ontime')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${statusFilter === 'ontime' ? 'bg-green-600 text-white shadow-sm' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
              >
                On Time
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${statusFilter === 'pending' ? 'bg-red-600 text-white shadow-sm' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('delay')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${statusFilter === 'delay' ? 'bg-orange-600 text-white shadow-sm' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}
              >
                Delay
              </button>
            </div>
          </div>

          {filteredTasks.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FMS Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Name</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Delay Count</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Tasks</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTasks.map(task => {
                      const isDelay = task.totalPendingDelayTask > 0;
                      const isPending = task.allPendingTillDate > 0;

                      let rowBg = 'hover:bg-indigo-50';
                      if (isDelay) rowBg = 'bg-orange-50 hover:bg-orange-100';
                      else if (isPending) rowBg = 'bg-red-50 hover:bg-red-100';
                      else rowBg = 'bg-green-50 hover:bg-green-100';

                      return (
                        <tr key={task.id} className={`${rowBg} cursor-pointer transition-colors`} onClick={() => handleRowClick(task)}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.department}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{task.personName}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.fmsName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.taskName}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${isDelay ? 'text-orange-600' : 'text-gray-900'}`}>
                            {task.totalPendingDelayTask}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-gray-200 text-gray-800 shadow-sm">
                              {task.allPendingTillDate}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200">
                {filteredTasks.map(task => {
                  const isDelay = task.totalPendingDelayTask > 0;
                  const isPending = task.allPendingTillDate > 0;

                  let rowBg = '';
                  if (isDelay) rowBg = 'bg-orange-50';
                  else if (isPending) rowBg = 'bg-red-50';
                  else rowBg = 'bg-green-50';

                  return (
                    <div key={task.id} className={`p-4 ${rowBg} hover:bg-opacity-80 cursor-pointer transition-colors border-b border-gray-100`} onClick={() => handleRowClick(task)}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 mb-1">{task.department}</div>
                          <div className="text-sm font-medium text-gray-900">{task.personName}</div>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="text-xs text-gray-500 mb-1">Pending</div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-gray-200 text-gray-800">
                            {task.allPendingTillDate}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-2">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">FMS Name</div>
                          <div className="text-sm text-gray-900">{task.fmsName}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Task Name</div>
                          <div className="text-sm text-gray-900">{task.taskName}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 mb-1">Delay Count</div>
                        <div className={`text-sm font-medium ${isDelay ? 'text-orange-600' : 'text-gray-900'}`}>{task.totalPendingDelayTask}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                <Clock className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-2">
                No Pending Tasks Found
              </h3>
              <p className="text-sm text-gray-500">
                Try adjusting your filters or search query
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Drill Down Modal */}
      {activeDrillDown && (
        <div className="fixed inset-0 bg-black bg-opacity-25 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-fadeIn border-2 border-gray-100">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {activeDrillDown.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {activeDrillDown.taskId}
                </p>
              </div>
              <button
                onClick={() => setActiveDrillDown(null)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-0">
              {drillDownLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                </div>
              ) : activeDrillDown.error ? (
                <div className="text-center py-12 px-4 text-red-500 text-sm">
                  Failed to load: {activeDrillDown.error}
                </div>
              ) : activeDrillDown.rows.length === 0 ? (
                <div className="text-center py-12 px-4 text-gray-500 text-sm">
                  No matching rows found.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delay</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeDrillDown.rows.map((row, idx) => {
                      const isDelay = row.delayTime !== '0000';
                      const isPending = row.actualDate === '';
                      const isOnTime = row.delayTime === '0000' && !isPending;

                      let rowBg = '';
                      if (isDelay) rowBg = 'bg-orange-50';
                      else if (isPending) rowBg = 'bg-red-50';
                      else if (isOnTime) rowBg = 'bg-green-50';

                      return (
                        <tr key={idx} className={`${rowBg} hover:bg-opacity-80 transition-colors`}>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{row.plannedDate}</td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{row.actualDate || '-'}</td>
                          <td className={`px-6 py-3 whitespace-nowrap text-sm font-medium ${isDelay ? 'text-orange-600' : 'text-gray-900'}`}>
                            {row.delayTime}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
      )}
    </div>
  );
};

export default AdminPendingTasks;
