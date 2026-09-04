// ============ DASHBOARD PAGE ============
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { LayoutDashboard, Users, Calendar, Clock, AlertTriangle, Search, ChevronDown, Download, Filter, MessageSquare, Briefcase, TrendingUp, Target, CheckSquare, X, MapPin, Phone, Mail, User, Info, Loader2 } from 'lucide-react';
import { getDisplayableImageUrl } from '../../utils/imageUtils';
import EmployeesTable from "../../components/tables/EmployeesTable";
import HalfCircleChart from "../../components/charts/HalfCircleChart";
import HorizontalBarChart from "../../components/charts/HorizontalBarChart";
import VerticalBarChart from "../../components/charts/VerticalBarChart";
import StatsCard from "../../components/dashboard/StatsCard";
import DashboardHeader from "./components/DashboardHeader";
import EmployeeListSection from "./components/EmployeeListSection";
import UserDetailsModal from "./components/UserDetailsModal";
import ChartsGrid from "./components/ChartsGrid";
import DepartmentScoreChart from "../../components/charts/DepartmentScoreChart";
import DepartmentWorkloadChart from "../../components/charts/DepartmentWorkloadChart";
import { useAuth } from "../../contexts/AuthContext";
import CategoryTabs from "../../components/CategoryTabs";
import { categorizeByBasis, CATEGORY_KEYS } from "../../utils/categorize";

const getCurrentWeek = () => {
  const today = new Date();
  const startOfWeek = new Date(today);
  const day = today.getDay() || 7; // Make Sunday 7
  startOfWeek.setDate(today.getDate() - day + 1); // Set to Monday

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 5);

  return {
    start: startOfWeek.toISOString().split("T")[0],
    end: endOfWeek.toISOString().split("T")[0],
  };
};


// DateAssignmentToolbar removed as dates are now extracted from sheet data during submission.

const formatDateDisplay = (dateVal) => {
  if (!dateVal) return "";
  const str = String(dateVal).trim();
  if (/^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(str)) return str;
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
  return str;
};

const getLiveReportDateRange = () => {
  const today = new Date();
  const startOfWeek = new Date(today);
  const day = today.getDay(); // Sunday is 0
  startOfWeek.setDate(today.getDate() - day);

  return {
    startDate: formatDateDisplay(startOfWeek),
    endDate: formatDateDisplay(today)
  };
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  // Dashboard Logic
  const [dateRange, setDateRange] = useState(getCurrentWeek());

  // New State for Sheet Data
  const [loading, setLoading] = useState(true);
  const [sheetEmployees, setSheetEmployees] = useState([]);
  const [departmentScores, setDepartmentScores] = useState([]);
  const [dataSheetRows, setDataSheetRows] = useState([]);
  const [dataSheetDateRange, setDataSheetDateRange] = useState({ fromDate: "", toDate: "" });
  const [reportDateRange, setReportDateRange] = useState(getLiveReportDateRange());
  const [rawParsedData, setRawParsedData] = useState([]);
  const [reportedByMap, setReportedByMap] = useState({});

  // Dynamic Column Labels
  const [columnLabels, setColumnLabels] = useState({
    name: "Name",
    designation: "Designation",
    department: "Department",
    firm: "Firm Name",
    target: "Target",
    actualWork: "Actual Work",
    weeklyDone: "Weekly Not Done %",
    weeklyOnTime: "Weekly On Time Not Done %",
    totalWork: "Total Work",
    weekPending: "Week Pending",
    allPending: "All Pending",
    incentiveCategory: "Incentive Category"
  });

  // Column Visibility State
  const ALL_COLUMNS = [

    { key: "name", label: columnLabels.name },
    { key: "designation", label: columnLabels.designation },
    { key: "department", label: columnLabels.department },
    { key: "firm", label: columnLabels.firm },
    { key: "target", label: columnLabels.target },
    { key: "actualWork", label: columnLabels.actualWork },
    { key: "weeklyDone", label: columnLabels.weeklyDone },
    { key: "weeklyOnTime", label: columnLabels.weeklyOnTime },
    { key: "totalWork", label: columnLabels.totalWork },
    { key: "weekPending", label: columnLabels.weekPending },
    { key: "allPending", label: columnLabels.allPending },
    { key: "incentiveCategory", label: columnLabels.incentiveCategory || "Incentive Category" },
    { key: "lastWeekPlannedNotDone", label: "Last Week Planned Work Not Done %" },
    { key: "lastWeekPlannedNotDoneOnTime", label: "Last Week Planned Work Not Done On Time %" },
    { key: "lastWeekCommitment", label: "Last Week Commitment" },
    { key: "nextWeekPlannedNotDone", label: columnLabels.nextWeekPlannedNotDone },
    { key: "nextWeekPlannedNotDoneOnTime", label: columnLabels.nextWeekPlannedNotDoneOnTime },
    { key: "nextWeekCommitment", label: columnLabels.nextWeekCommitment },
  ];

  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const initial = {};
    ALL_COLUMNS.forEach(col => initial[col.key] = true);
    return initial;
  });

  const toggleColumn = (key) => {
    setVisibleColumns(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleAllColumns = (e) => {
    const isChecked = e.target.checked;
    const newVisibility = {};
    ALL_COLUMNS.forEach(col => newVisibility[col.key] = isChecked);
    setVisibleColumns(newVisibility);
  };

  const [selectAll, setSelectAll] = useState(false);
  const [employeeCommitments, setEmployeeCommitments] = useState({});
  const [expandedEmployee, setExpandedEmployee] = useState(null);
  const [filterName, setFilterName] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterDeptName, setFilterDeptName] = useState("");
  const [filterFirmName, setFilterFirmName] = useState("");
  const [filterIncentiveCategory, setFilterIncentiveCategory] = useState("");
  const [filterHR, setFilterHR] = useState("");
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORY_KEYS.MIS);

  // Lock body scroll when popup is open
  useEffect(() => {
    if (selectedUserDetails) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedUserDetails]);
  const [activeDrillDown, setActiveDrillDown] = useState(null);
  const [drillDownLoading, setDrillDownLoading] = useState(false);

  // New State for Data Editing
  const [editableData, setEditableData] = useState({});
  const [mainSubmitting, setMainSubmitting] = useState(false);
  const [whatsappSubmitting, setWhatsappSubmitting] = useState(false);
  const [archivedMap, setArchivedMap] = useState({});

  // Reset editable data when selection changes
  useEffect(() => {
    if (selectedEmployees.length === 0) {
      setEditableData({});
    }
  }, [selectedEmployees]);

  // Handle Edit functionalities
  const handleInputChange = (employeeId, field, value) => {
    // Number validation (Skip for Commitment field which allows text)
    if (field !== "nextWeekCommitment" && value && !/^\d*$/.test(value)) return;

    setEditableData(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value
      }
    }));
  };

  const handleCheckboxChange = (employeeId) => {
    const alreadySelected = selectedEmployees.includes(employeeId);
    const emp = sheetEmployees.find(e => e.id === employeeId);
    if (!emp) return;

    // SELECT
    if (!alreadySelected) {
      const existing = archivedMap[emp.name];

      if (existing) {
        setEditableData(prev => ({
          ...prev,
          [employeeId]: existing.values
        }));
      } else {
        setEditableData(prev => ({
          ...prev,
          [employeeId]: {
            nextWeekPlannedNotDone: "",
            nextWeekPlannedNotDoneOnTime: "",
            nextWeekCommitment: ""
          }
        }));
      }
    }
    // UNSELECT
    else {
      setEditableData(prev => {
        const copy = { ...prev };
        delete copy[employeeId];
        return copy;
      });
    }

    handleEmployeeSelect(employeeId);
  };

  // Fetch Data from Google Sheet
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const scriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
        if (!scriptUrl) {
          console.error("VITE_APPS_SCRIPT_URL not set");
          setSheetEmployees([]);
          setLoading(false);
          return;
        }

        // Fetch sheets
        const [recordsResponse, archivedResponse, masterResponse, dataResponse, deptScoreResponse] = await Promise.all([
          fetch(`${scriptUrl}?sheet=For Records`),
          fetch(`${scriptUrl}?sheet=Archived`),
          fetch(`${scriptUrl}?sheet=Master`),
          fetch(`${scriptUrl}?sheet=Data`),
          fetch(`${scriptUrl}?sheet=Department Score Graph`)
        ]);

        const result = await recordsResponse.json();
        const archivedResult = await archivedResponse.json();
        const masterResult = await masterResponse.json();
        const dataResult = await dataResponse.json();
        const deptScoreResult = await deptScoreResponse.json();

        // Store Data sheet rows (skip header row)
        const incentiveMap = {};
        const firmMap = {};

        if (dataResult.success && Array.isArray(dataResult.data)) {
          setDataSheetRows(dataResult.data.slice(1));
          const headerRow = dataResult.data[0] || [];

          // Column V (index 21) or header search for Incentive Category
          let incentiveColIdx = headerRow.findIndex(h => h && String(h).trim().toLowerCase() === "incentive category");
          if (incentiveColIdx === -1) incentiveColIdx = 21;

          // Column W (index 22) or header search for Firm Name
          let firmColIdx = headerRow.findIndex(h => h && String(h).trim().toLowerCase() === "firm name");
          if (firmColIdx === -1) firmColIdx = 22;

          // Header row date range columns
          const globalFromDate = headerRow[23] ? String(headerRow[23]).trim() : (headerRow[22] ? String(headerRow[22]).trim() : "");
          const globalToDate = headerRow[24] ? String(headerRow[24]).trim() : (headerRow[23] ? String(headerRow[23]).trim() : "");
          setDataSheetDateRange({ fromDate: globalFromDate, toDate: globalToDate });
          console.log("[Data Sheet] Global Date Range from header →", globalFromDate, "To:", globalToDate);
          
          // Live dynamic date range (Week Start Sunday to Today)
          setReportDateRange(getLiveReportDateRange());

          // Populate incentiveMap and firmMap from Data sheet rows (Person Name is at Column index 4)
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

        // Store Department Scores
        if (deptScoreResult.success && Array.isArray(deptScoreResult.data)) {
          // Column A: Name (index 0), B: Work Not Done % (index 1), C: Not Done On Time % (index 2), D: Pending (index 3)
          const parsedDeptScores = deptScoreResult.data.slice(1)
            .filter(row => row[0]) // Filter out empty names
            .map(row => ({
              name: row[0],
              workNotDonePct: parseFloat(row[1]) || 0,
              notDoneOnTimePct: parseFloat(row[2]) || 0,
              pendingWorks: parseInt(row[3]) || 0
            }));
          setDepartmentScores(parsedDeptScores);
        }

        // Build image and designation maps from Master sheet (Column A: Name, Column C: Department, Column D: Designation, Column E: Image, Column J: Reported By)
        const imageMap = {};
        const designationMap = {};
        const departmentMap = {};
        const phoneMap = {};
        const reportedByMap = {};
        if (masterResult.success && Array.isArray(masterResult.data)) {
          const masterHeader = masterResult.data[0] || [];
          let masterIncentiveIdx = masterHeader.findIndex(h => h && String(h).trim().toLowerCase() === "incentive category");
          if (masterIncentiveIdx === -1) masterIncentiveIdx = 10;
          let masterFirmIdx = masterHeader.findIndex(h => h && String(h).trim().toLowerCase() === "firm name");
          if (masterFirmIdx === -1) masterFirmIdx = 8;

          masterResult.data.slice(1).forEach(row => {
            const name = row[0] ? String(row[0]).trim().toLowerCase() : "";
            const department = row[2] ? String(row[2]).trim() : "";
            const designation = row[3] ? String(row[3]).trim() : "";
            const imageUrl = row[4];
            const phone = row[1] ? String(row[1]).trim() : ""; // Column B (index 1)
            const reportedBy = row[9] ? String(row[9]).trim().toLowerCase() : "";
            const firmName = row[masterFirmIdx] ? String(row[masterFirmIdx]).trim() : "";
            const masterIncentive = row[masterIncentiveIdx] ? String(row[masterIncentiveIdx]).trim() : "";

            if (name) {
              if (imageUrl) imageMap[name] = imageUrl;
              if (designation) designationMap[name] = designation;
              if (department) departmentMap[name] = department;
              if (phone) phoneMap[name] = phone;
              if (reportedBy) reportedByMap[name] = reportedBy;
              if (firmName && !firmMap[name]) firmMap[name] = firmName;
              if (masterIncentive && !incentiveMap[name]) {
                incentiveMap[name] = masterIncentive;
              }
            }
          });
        }

        // Update Dynamic Headers from Archived Sheet
        if (archivedResult.success && archivedResult.data && archivedResult.data[0]) {
          const arcHeaders = archivedResult.data[0];
          setColumnLabels(prev => ({
            ...prev,
            nextWeekPlannedNotDone: arcHeaders[3] || prev.nextWeekPlannedNotDone || "Next Week Planned Work Not Done",
            nextWeekPlannedNotDoneOnTime: arcHeaders[4] || prev.nextWeekPlannedNotDoneOnTime || "Next Week Planned Work Not Done On Time",
            nextWeekCommitment: arcHeaders[5] || prev.nextWeekCommitment || "Next Week Commitment"
          }));
        }

        // Build archived map by NAME (latest entry wins)
        const newArchivedMap = {};
        const currentWeek = getCurrentWeek();

        if (archivedResult.data && Array.isArray(archivedResult.data)) {
          archivedResult.data.slice(1).forEach((row, idx) => {
            const name = row[0];
            const rowStart = row[1];
            const rowEnd = row[2];

            if (!name) return;

            const normalizeDate = (d) => {
              if (!d) return "";
              const dateObj = new Date(d);
              if (isNaN(dateObj)) return d;
              return dateObj.toISOString().split("T")[0];
            };

            const normRowStart = normalizeDate(rowStart);

            if (normRowStart < currentWeek.start || normRowStart > currentWeek.end) {
              return;
            }

            newArchivedMap[name] = {
              rowIndex: idx + 2,
              start: normRowStart,
              end: normalizeDate(rowEnd),
              values: {
                nextWeekPlannedNotDone: row[3]?.toString() || "",
                nextWeekPlannedNotDoneOnTime: row[4]?.toString() || "",
                nextWeekCommitment: row[5]?.toString() || ""
              }
            };
          });
        }

        setArchivedMap(newArchivedMap);

        if (result.success && Array.isArray(result.data)) {
          const headers = result.data[0];

          // Live dynamic date range (Week Start Sunday to Today)
          setReportDateRange(getLiveReportDateRange());

          if (headers) {
            setColumnLabels(prev => ({
              ...prev,
              name: headers[2] || prev.name,
              designation: headers[3] || prev.designation,
              target: headers[3] || prev.target,
              actualWork: headers[4] || prev.actualWork,
              weeklyDone: "% Weekly Not Done",
              weeklyOnTime: "Weekly On Time Not Done %",
              totalWork: headers[7] || prev.totalWork,
              weekPending: headers[8] || prev.weekPending,
              allPending: headers[9] || prev.allPending
            }));
          }

          const parsedData = result.data.slice(2)
            .filter(row => row[2] && String(row[2]).trim() !== "")
            .map((row, index) => {
              const randomId = `emp-${100 + index}`;
              const empName = row[2] || "Unknown";
              const normalizedName = String(empName).trim().toLowerCase();
              const archivedData = newArchivedMap[empName] ? newArchivedMap[empName].values : {};

              const rawImageUrl = imageMap[normalizedName];
              let finalImageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(empName)}&background=0D8ABC&color=fff&size=128`;

              if (rawImageUrl) {
                const processedUrl = getDisplayableImageUrl(rawImageUrl);
                if (processedUrl) finalImageUrl = processedUrl;
              }

              return {
                id: randomId,
                name: empName,
                startDate: row[10] || "", // Column K (index 10)
                endDate: row[11] || "",   // Column L (index 11)
                designation: designationMap[normalizedName] || "",
                department: departmentMap[normalizedName] || "",
                firm: firmMap[normalizedName] || "",
                incentiveCategory: incentiveMap[normalizedName] || "",
                image: finalImageUrl,

                score: row[5] || 0,       // Column F (index 5) - Weekly Work Done %
                target: row[3] || 0,
                actualWorkDone: row[4] || 0,
                weeklyWorkDone: row[5] || "0%",
                weeklyWorkDoneOnTime: row[6] || "0%",
                totalWorkDone: row[7] || 0,
                weekPending: row[8] || 0,
                allPendingTillDate: row[9] || 0,

                plannedWorkNotDone: row[12] || 0,
                plannedWorkNotDoneOnTime: row[13] || 0,
                commitment: row[14] || 0,

                nextWeekPlannedWorkNotDone: row[16] || 0,
                nextWeekPlannedWorkNotDoneOnTime: row[17] || 0,
                nextWeekCommitment: row[18] || 0
              };
            });

          setRawParsedData(parsedData);
          setReportedByMap(reportedByMap);
        } else {
          console.error("Failed to load sheet data", result);
          setRawParsedData([]);
        }
      } catch (error) {
        console.error("Error fetching sheet data:", error);
        setRawParsedData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Re-filter data by role whenever the raw data or the logged-in user changes
  // (user is loaded asynchronously from localStorage/Master sheet in AuthContext,
  // so it may still be null on the first render of the fetch effect above).
  useEffect(() => {
    const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');
    const isHod = user && user.role === 'hod';
    const lowerName = (user?.name || "").toLowerCase().trim();
    const lowerId = (user?.id || "").toLowerCase().trim();

    // Filter data based on user permission level (Admin/Superadmin sees all, HOD sees self + reportees, Ordinary User sees self only)
    const finalData = isAdmin
      ? rawParsedData
      : isHod
      ? rawParsedData.filter(emp => {
          const empLowerName = emp.name.toLowerCase().trim();
          const empManager = reportedByMap[empLowerName] || "";
          return empLowerName === lowerName || empManager === lowerName || empManager === lowerId;
        })
      : rawParsedData.filter(emp => {
          const empLowerName = emp.name.toLowerCase().trim();
          return empLowerName === lowerName;
        });

    setSheetEmployees(finalData);
  }, [rawParsedData, reportedByMap, user]);

  useEffect(() => {
    const saved = localStorage.getItem("employeeCommitments");
    if (saved) {
      setEmployeeCommitments(JSON.parse(saved));
    }
  }, []);

  // Category counts across all sheetEmployees
  const categoryCounts = useMemo(() => {
    const counts = {
      [CATEGORY_KEYS.MIS]: 0,
      [CATEGORY_KEYS.NON_MIS]: 0,
      [CATEGORY_KEYS.OTHER]: 0,
    };
    sheetEmployees.forEach((emp) => {
      const cat = categorizeByBasis(emp.incentiveCategory);
      if (counts[cat] !== undefined) {
        counts[cat]++;
      } else {
        counts[CATEGORY_KEYS.OTHER]++;
      }
    });
    return counts;
  }, [sheetEmployees]);

  // Filter employees by the selected Category tab
  const categoryFilteredEmployees = useMemo(() => {
    return sheetEmployees.filter((emp) => {
      const cat = categorizeByBasis(emp.incentiveCategory);
      return cat === selectedCategory;
    });
  }, [sheetEmployees, selectedCategory]);

  // Scope everything below (table, KPIs, charts) to the selected Firm Name and Incentive Category within the active Category tab.
  // "" (All Firms / All Categories) keeps the combined behavior for that category.
  const firmFilteredEmployees = useMemo(() => {
    return categoryFilteredEmployees.filter((emp) => {
      const matchesFirm = filterFirmName === "" || emp.firm === filterFirmName;
      const matchesIncentive = filterIncentiveCategory === "" || emp.incentiveCategory === filterIncentiveCategory;
      return matchesFirm && matchesIncentive;
    });
  }, [categoryFilteredEmployees, filterFirmName, filterIncentiveCategory]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return firmFilteredEmployees.filter((emp) => {
      const matchesName = emp.name.toLowerCase().includes(filterName.toLowerCase());
      const matchesDesignation = filterDepartment === "" || emp.designation === filterDepartment;
      const matchesDept = filterDeptName === "" || emp.department === filterDeptName;
      return matchesName && matchesDesignation && matchesDept;
    });
  }, [firmFilteredEmployees, filterName, filterDepartment, filterDeptName]);

  // Get unique designations
  const uniqueDesignations = useMemo(() => [
    ...new Set(categoryFilteredEmployees.map((emp) => emp.designation).filter(Boolean)),
  ], [categoryFilteredEmployees]);

  // Get unique departments
  const uniqueDepartments = useMemo(() => [
    ...new Set(categoryFilteredEmployees.map((emp) => emp.department).filter(Boolean)),
  ], [categoryFilteredEmployees]);

  // Get unique firm names (from Data sheet Column W and mapped employees)
  const uniqueFirms = useMemo(() => {
    const fromEmployees = categoryFilteredEmployees.map((emp) => emp.firm).filter(Boolean);
    const fromDataSheet = dataSheetRows.map((row) => (row[22] ? String(row[22]).trim() : "")).filter(Boolean);
    return [...new Set([...fromEmployees, ...fromDataSheet])].sort();
  }, [categoryFilteredEmployees, dataSheetRows]);

  // Get unique incentive categories
  const uniqueIncentiveCategories = useMemo(() => [
    ...new Set(categoryFilteredEmployees.map((emp) => emp.incentiveCategory).filter(Boolean)),
  ], [categoryFilteredEmployees]);

  // Statistics - Memoized
  const {
    topScorers,
    topBestPerformers
  } = useMemo(() => {
    let topScorersList = [];

    if (firmFilteredEmployees.length > 0) {
      const latestDateStr = firmFilteredEmployees.reduce((latest, emp) => {
        if (!emp.endDate) return latest;
        const currentEnd = new Date(emp.endDate);
        if (isNaN(currentEnd)) return latest;
        if (!latest || currentEnd > new Date(latest)) return emp.endDate;
        return latest;
      }, "");

      topScorersList = firmFilteredEmployees
        .filter(emp => emp.endDate === latestDateStr)
        .map(emp => ({
          name: emp.name,
          workDone: parseFloat(emp.actualWorkDone) || 0,  // Column E (index 4)
          totalTasks: parseFloat(emp.target) || 0,        // Column D (index 3)
          donePct: parseFloat(String(emp.weeklyWorkDone || "0").replace('%', '').trim()) || 0, // Column F (index 5)
          onTimePct: parseFloat(String(emp.weeklyWorkDoneOnTime || "0").replace('%', '').trim()) || 0, // Column G (index 6)
          allPending: parseFloat(emp.allPendingTillDate) || 0 // Column J (index 9)
        }))
        .filter(emp => emp.totalTasks > 0) // Exclude if 0 tasks in Column D
        .sort((a, b) => {
          // 1. Primary: Lowest Weekly Done % (Column F)
          if (a.donePct !== b.donePct) {
            return a.donePct - b.donePct;
          }
          // 2. Secondary: Lowest actual task done (Column E)
          if (a.workDone !== b.workDone) {
            return a.workDone - b.workDone;
          }
          // 3. Tertiary (Tie on F & E): Lowest Weekly Done On Time % (Column G)
          if (a.onTimePct !== b.onTimePct) {
            return a.onTimePct - b.onTimePct;
          }
          // 4. Quaternary: Highest All Pending Till Date (Column J)
          if (b.allPending !== a.allPending) {
            return b.allPending - a.allPending; // Higher is worse
          }
          // 5. Quinary: Higher total tasks/target (Column D) makes it worse for the same low performance
          return b.totalTasks - a.totalTasks;
        })
        .slice(0, 5);
    }

    // --- Top 5 Best Performers: most tasks done (Column E), sorted descending ---
    let topBestList = [];
    if (firmFilteredEmployees.length > 0) {
      const latestDateStr = firmFilteredEmployees.reduce((latest, emp) => {
        if (!emp.endDate) return latest;
        const currentEnd = new Date(emp.endDate);
        if (isNaN(currentEnd)) return latest;
        if (!latest || currentEnd > new Date(latest)) return emp.endDate;
        return latest;
      }, "");

      topBestList = firmFilteredEmployees
        .filter(emp => emp.endDate === latestDateStr)
        .map(emp => ({
          name: emp.name,
          workDone: parseFloat(emp.actualWorkDone) || 0,  // Column E (index 4)
          totalTasks: parseFloat(emp.target) || 0,        // Column D (index 3)
          donePct: parseFloat(String(emp.weeklyWorkDone || "0").replace('%', '').trim()) || 0, // Column F (index 5)
          onTimePct: parseFloat(String(emp.weeklyWorkDoneOnTime || "0").replace('%', '').trim()) || 0, // Column G (index 6)
          allPending: parseFloat(emp.allPendingTillDate) || 0 // Column J (index 9)
        }))
        .sort((a, b) => {
          // 1. Primary: Highest Weekly Done % (Column F)
          if (b.donePct !== a.donePct) {
            return b.donePct - a.donePct;
          }
          // 2. Secondary: Highest number of task done (Column E)
          if (b.workDone !== a.workDone) {
            return b.workDone - a.workDone;
          }
          // 3. Tertiary: Highest Weekly Done On Time % (Column G)
          if (b.onTimePct !== a.onTimePct) {
            return b.onTimePct - a.onTimePct;
          }
          // 4. Quaternary: Lowest All Pending Till Date (Column J)
          if (a.allPending !== b.allPending) {
            return a.allPending - b.allPending; // Lower is better
          }
          // 5. Quinary: Higher target (Column D)
          return b.totalTasks - a.totalTasks;
        })
        .slice(0, 5);
    }

    return {
      topScorers: topScorersList.length > 0 ? topScorersList : [],
      topBestPerformers: topBestList.length > 0 ? topBestList : []
    };
  }, [firmFilteredEmployees, columnLabels]);

  // Top Scorer of each Department for the Celebration Reel Ticker
  const departmentTopPerformers = useMemo(() => {
    const list = firmFilteredEmployees.length > 0 ? firmFilteredEmployees : categoryFilteredEmployees;
    if (!list || list.length === 0) return [];

    const deptMap = {};
    list.forEach(emp => {
      const dept = (emp.department || "General").trim();
      if (!deptMap[dept]) deptMap[dept] = [];
      deptMap[dept].push(emp);
    });

    const winners = [];
    Object.entries(deptMap).forEach(([dept, emps]) => {
      // Find top scorer in this department based on highest actualWorkDone / completion
      const sorted = [...emps].sort((a, b) => {
        const aDone = parseFloat(a.actualWorkDone) || 0;
        const bDone = parseFloat(b.actualWorkDone) || 0;
        if (bDone !== aDone) return bDone - aDone;

        const aPct = parseFloat(String(a.weeklyWorkDone || "0").replace('%', '').trim()) || 0;
        const bPct = parseFloat(String(b.weeklyWorkDone || "0").replace('%', '').trim()) || 0;
        if (bPct !== aPct) return bPct - aPct;

        const aTarget = parseFloat(a.target) || 0;
        const bTarget = parseFloat(b.target) || 0;
        return bTarget - aTarget;
      });

      if (sorted.length > 0) {
        const top = sorted[0];
        winners.push({
          department: dept,
          name: top.name,
          image: top.image,
          actualWorkDone: parseFloat(top.actualWorkDone) || 0,
          target: parseFloat(top.target) || 0,
          weeklyWorkDone: top.weeklyWorkDone || "0%",
          allPending: top.allPendingTillDate || 0
        });
      }
    });

    return winners.sort((a, b) => a.department.localeCompare(b.department));
  }, [firmFilteredEmployees, categoryFilteredEmployees]);

  const topScorersData = useMemo(() => topScorers.map((emp) => {
    const val = emp.donePct ?? emp.score ?? 0;
    return isNaN(val) ? 0 : val;
  }), [topScorers]);
  const topScorersLabels = useMemo(() => topScorers.map((emp) => emp.name), [topScorers]);
  const topBestData = useMemo(() => topBestPerformers.map(emp => {
    const val = emp.workDone ?? emp.score ?? 0;
    return isNaN(val) ? 0 : val;
  }), [topBestPerformers]);
  const topBestLabels = useMemo(() => topBestPerformers.map(emp => emp.name), [topBestPerformers]);
  const topBestTotalData = useMemo(() => topBestPerformers.map(emp => {
    const val = emp.totalTasks ?? 0;
    return isNaN(val) ? 0 : val;
  }), [topBestPerformers]);
  // Pending Tasks by User — Column I (weekPending) sorted desc, Column D (target) as total
  const sortedPendingList = useMemo(() => {
    return [...firmFilteredEmployees]
      .map(emp => ({
        name: emp.name,
        pending: parseFloat(emp.weekPending) || 0,
        total: parseFloat(emp.target) || 0
      }))
      .filter(emp => emp.pending > 0)
      .sort((a, b) => b.pending - a.pending)
      .slice(0, 5);
  }, [firmFilteredEmployees]);

  const pendingTasksData = useMemo(() => sortedPendingList.map(emp => emp.pending), [sortedPendingList]);
  const pendingTasksLabels = useMemo(() => sortedPendingList.map(emp => emp.name), [sortedPendingList]);
  const pendingTasksTotalData = useMemo(() => sortedPendingList.map(emp => emp.total), [sortedPendingList]);
  const departmentScoresData = useMemo(() => departmentScores.map((dept) => dept.workNotDonePct), [departmentScores]);
  const departmentScoresLabels = useMemo(() => departmentScores.map((dept) => dept.name), [departmentScores]);
  const departmentScoresNotDoneOnTime = useMemo(() => departmentScores.map((dept) => dept.notDoneOnTimePct), [departmentScores]);
  const departmentScoresPending = useMemo(() => departmentScores.map((dept) => dept.pendingWorks), [departmentScores]);

  // Department Workload — Target (work assigned) vs Actual (work done), summed per department
  const departmentWorkload = useMemo(() => {
    const byDept = {};
    firmFilteredEmployees.forEach((emp) => {
      const dept = emp.department?.trim() || "Unassigned";
      const target = parseFloat(emp.target) || 0;
      const actual = parseFloat(emp.actualWorkDone) || 0;
      if (!byDept[dept]) byDept[dept] = { department: dept, target: 0, actual: 0 };
      byDept[dept].target += target;
      byDept[dept].actual += actual;
    });
    return Object.values(byDept)
      .filter((d) => d.target > 0 || d.actual > 0)
      .sort((a, b) => b.target - a.target);
  }, [firmFilteredEmployees]);

  const departmentWorkloadLabels = useMemo(() => departmentWorkload.map((d) => d.department), [departmentWorkload]);
  const departmentWorkloadTarget = useMemo(() => departmentWorkload.map((d) => d.target), [departmentWorkload]);
  const departmentWorkloadActual = useMemo(() => departmentWorkload.map((d) => d.actual), [departmentWorkload]);

  // Top-level KPI summary — totals across every visible employee
  const dashboardStats = useMemo(() => {
    const totalEmployees = firmFilteredEmployees.length;
    const totalTarget = firmFilteredEmployees.reduce((sum, emp) => sum + (parseFloat(emp.target) || 0), 0);
    const totalActual = firmFilteredEmployees.reduce((sum, emp) => sum + (parseFloat(emp.actualWorkDone) || 0), 0);
    const totalPending = firmFilteredEmployees.reduce((sum, emp) => sum + (parseFloat(emp.allPendingTillDate) || 0), 0);
    const completionPct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
    return { totalEmployees, totalTarget, totalActual, totalPending, completionPct };
  }, [firmFilteredEmployees]);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map((emp) => emp.id));
    }
    setSelectAll(!selectAll);
  };

  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployees((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleCommitmentChange = (employeeId, field, value) => {
    if (value === "") {
      setEmployeeCommitments((prev) => ({
        ...prev,
        [employeeId]: {
          ...prev[employeeId],
          [field]: "",
        },
      }));
      return;
    }

    if (field === "commitment") {
      setEmployeeCommitments((prev) => ({
        ...prev,
        [employeeId]: {
          ...prev[employeeId],
          [field]: value,
        },
      }));
    } else {
      const num = parseInt(value);
      if (!isNaN(num)) {
        setEmployeeCommitments((prev) => ({
          ...prev,
          [employeeId]: {
            ...prev[employeeId],
            [field]: num,
          },
        }));
      }
    }
  };

  const handleRowClick = (employee) => {
    const personName = String(employee.name).trim();
    const matchingRows = dataSheetRows.filter(row => {
      const dataName = row[4] ? String(row[4]).trim() : "";
      return dataName === personName;
    });

    const tasks = matchingRows.map(row => ({
      fmsName: row[2] || "",
      taskName: row[3] || "",
      nameColRef: row[9] || "",
      taskNameColRef: row[26] || "",
      department: row[0] || "",
      sheetId: row[5] || "",
      scriptUrl: row[25] || "",
      plannedSheetRef: row[7] || "",
      actualSheetRef: row[8] || "",
      target: row[10] || 0,
      extraDone: row[17] || 0,
      actualAchievement: row[18] || 0,
      totalAchievement: (() => {
        const target = parseFloat(row[10]) || 0;
        const achievement = parseFloat(row[11]) || 0;
        // Achievement can never exceed the assigned target
        return target > 0 ? Math.min(achievement, target) : achievement;
      })(),
      workNotDone: row[12] || 0,
      workNotDoneOnTime: row[13] || 0,
      allPendingTillDate: row[14] || 0,
      delayColRef: row[27] || "",
      // fromDate/toDate: individual rows are empty; use global date range from header row (Col V/W)
      fromDate: (row[21] && String(row[21]).trim()) || dataSheetDateRange.fromDate, // Column V (falls back to header value)
      toDate: (row[22] && String(row[22]).trim()) || dataSheetDateRange.toDate       // Column W (falls back to header value)
    }));

    setSelectedUserDetails({ ...employee, tasks });
  };

  // Helper: Parse sheet reference like "FMS 1!O7:O"
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

  const handleDrillDown = async (task, type, value, event) => {
    event.stopPropagation();
    if (value === 0) return;

    const scriptUrl = String(task.scriptUrl || "").trim();
    if (!scriptUrl) {
      console.error("No App Script URL found in Data sheet Column Z for task:", task.taskName);
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
      type,
      title: `Total Achievement Details`,
      rows: [],
      loading: true
    });

    try {
      const employeeName = String(selectedUserDetails?.name || "").trim();

      const sheetDataCache = {};
      const sheetsToFetch = new Set();
      if (plannedParsed?.sheetName) sheetsToFetch.add(plannedParsed.sheetName);
      if (actualParsed?.sheetName) sheetsToFetch.add(actualParsed.sheetName);
      if (nameParsed?.sheetName) sheetsToFetch.add(nameParsed.sheetName);
      if (taskNameParsed?.sheetName) sheetsToFetch.add(taskNameParsed.sheetName);
      if (delayParsed?.sheetName) sheetsToFetch.add(delayParsed.sheetName);

      const fetchPromises = [...sheetsToFetch].map(async (name) => {
        // Skip department-specific scriptUrl — it's CORS-blocked from localhost.
        // Always use the global VITE_APPS_SCRIPT_URL with spreadsheetId directly.
        const urlsToTry = [import.meta.env.VITE_APPS_SCRIPT_URL]
          .map(u => String(u || "").trim())
          .filter(u => u.startsWith("http"));
        
        let success = false;
        for (const url of urlsToTry) {
          try {
            const separator = url.includes('?') ? '&' : '?';
            let fetchUrl = `${url}${separator}sheet=${encodeURIComponent(name)}`;
            if (task.sheetId) {
              fetchUrl += `&spreadsheetId=${encodeURIComponent(task.sheetId)}`;
            }
            
            const res = await fetch(fetchUrl);
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);
            const result = await res.json();
            if (result.success && Array.isArray(result.data)) {
              sheetDataCache[name] = result.data;
              success = true;
              break;
            }
          } catch (err) {
            console.error(`Failed to fetch drill-down sheet ${name} using url ${url}:`, err);
          }
        }
        if (!success) {
          throw new Error(`Failed to fetch sheet ${name} from all attempted URLs`);
        }
      });
      await Promise.all(fetchPromises);

      const formatDateValue = (val) => {
        if (val === undefined || val === null || val === "") return "";
        const str = String(val);
        const d = new Date(str);
        if (!isNaN(d.getTime()) && (str.includes("T") || str.includes("-") || str.includes("/"))) {
          const dd = String(d.getDate()).padStart(2, "0");
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const yyyy = d.getFullYear();
          const hh = String(d.getHours()).padStart(2, "0");
          const min = String(d.getMinutes()).padStart(2, "0");
          const ss = String(d.getSeconds()).padStart(2, "0");
          return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
        }
        return str;
      };

      const formatDurationValue = (val) => {
        if (val === undefined || val === null || val === "") return "";
        const str = String(val).toLowerCase();

        // Handle ISO Date strings (often used for durations in Sheet JSON)
        const d = new Date(val);
        if (!isNaN(d.getTime()) && (String(val).includes("T") || String(val).includes("-"))) {
          // Check if it's near the spreadsheet epoch (1899/1900)
          const year = d.getUTCFullYear();
          if (year <= 1900) {
            // Spreadsheet epoch is usually Dec 30, 1899
            const epoch = new Date(Date.UTC(1899, 11, 30));
            const diffMs = d.getTime() - epoch.getTime();
            const totalSeconds = Math.floor(diffMs / 1000);

            if (totalSeconds >= 0) {
              const h = Math.floor(totalSeconds / 3600);
              const m = Math.floor((totalSeconds % 3600) / 60);
              const s = totalSeconds % 60;
              return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
            }
          }
          // For other dates, just show the time part as a fallback
          const hh = String(d.getHours()).padStart(2, "0");
          const mm = String(d.getMinutes()).padStart(2, "0");
          const ss = String(d.getSeconds()).padStart(2, "0");
          return `${hh}:${mm}:${ss}`;
        }

        // Handle "X day Y hr Z min" format
        if (str.includes("day") || str.includes("hour") || str.includes("hr") || str.includes("min")) {
          let days = 0, hours = 0, minutes = 0, seconds = 0;
          const dayMatch = str.match(/(\d+)\s*day/);
          const hrMatch = str.match(/(\d+)\s*(hour|hr)/);
          const minMatch = str.match(/(\d+)\s*min/);
          const secMatch = str.match(/(\d+)\s*sec/);

          if (dayMatch) days = parseInt(dayMatch[1]);
          if (hrMatch) hours = parseInt(hrMatch[1]);
          if (minMatch) minutes = parseInt(minMatch[1]);
          if (secMatch) seconds = parseInt(secMatch[1]);

          const totalHours = (days * 24) + hours;
          return `${String(totalHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        }

        // Handle numeric durations (fractions of a day)
        if (!isNaN(val) && !isNaN(parseFloat(val))) {
          const totalSeconds = Math.round(parseFloat(val) * 24 * 60 * 60);
          const h = Math.floor(totalSeconds / 3600);
          const m = Math.floor((totalSeconds % 3600) / 60);
          const s = totalSeconds % 60;
          return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        }

        return String(val);
      };

      let matchingRowIndices = null;

      if (nameParsed && nameParsed.sheetName && nameParsed.colIndex >= 0) {
        const nameSheetRows = sheetDataCache[nameParsed.sheetName] || [];
        const nameRowsFromStart = nameParsed.startRowIndex > 0
          ? nameSheetRows.slice(nameParsed.startRowIndex)
          : nameSheetRows;

        matchingRowIndices = [];
        nameRowsFromStart.forEach((row, idx) => {
          const nameInSheet = row[nameParsed.colIndex] ? String(row[nameParsed.colIndex]).trim() : "";
          if (nameInSheet === employeeName) {
            matchingRowIndices.push(idx);
          }
        });
      }

      const getColumnValues = (parsed, formatter = formatDateValue) => {
        if (!parsed || !parsed.sheetName || parsed.colIndex < 0) return [];
        const allRows = sheetDataCache[parsed.sheetName] || [];
        const rowsFromStart = parsed.startRowIndex > 0 ? allRows.slice(parsed.startRowIndex) : allRows;

        if (matchingRowIndices !== null) {
          return matchingRowIndices.map(idx =>
            rowsFromStart[idx] !== undefined ? formatter(rowsFromStart[idx][parsed.colIndex]) : ""
          );
        } else {
          return rowsFromStart.map(row => formatter(row[parsed.colIndex]));
        }
      };

      const plannedValues = getColumnValues(plannedParsed);
      const actualValues = getColumnValues(actualParsed);
      const taskNameValues = getColumnValues(taskNameParsed, (val) => (val === undefined || val === null) ? "" : String(val));
      const delayValues = getColumnValues(delayParsed, formatDurationValue);

      const maxLen = Math.max(plannedValues.length, actualValues.length, taskNameValues.length);
      const rows = [];
      
      const parseFilterDate = (val) => {
        if (val === null || val === undefined || val === "") return null;
        
        // Handle Google Sheets numeric serial date (e.g., 46200)
        const numVal = Number(val);
        if (!isNaN(numVal) && numVal > 1000 && numVal < 100000) {
          // Google Sheets epoch: Dec 30, 1899
          const epoch = new Date(Date.UTC(1899, 11, 30));
          return new Date(epoch.getTime() + numVal * 24 * 60 * 60 * 1000);
        }
        
        const str = String(val).trim();
        
        // ISO format: 2026-05-19 or 2026-05-19T... 
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
          const isoDatePart = str.split('T')[0].split(' ')[0];
          const parts = isoDatePart.split('-');
          if (parts.length >= 3) {
            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          }
        }
        
        // dd/mm/yyyy or dd-mm-yyyy (with optional time)
        const datePart = str.split(' ')[0];
        const parts = datePart.split(/[-/]/);
        if (parts.length === 3) {
          if (parts[2].length === 4) {
            // dd/mm/yyyy
            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          }
          if (parts[0].length === 4) {
            // yyyy/mm/dd
            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          }
        }
        
        const d = new Date(str);
        return isNaN(d.getTime()) ? null : d;
      };

      console.log("[DrillDown Filter] fromDate raw:", task.fromDate, "| toDate raw:", task.toDate);
      const filterFrom = parseFilterDate(task.fromDate);
      const filterTo = parseFilterDate(task.toDate);
      if (filterTo) filterTo.setHours(23, 59, 59, 999);
      console.log("[DrillDown Filter] filterFrom:", filterFrom, "| filterTo:", filterTo);

      for (let i = 0; i < maxLen; i++) {
        const plannedVal = plannedValues[i] || "";
        const actualVal = actualValues[i] || "";
        const delayVal = delayValues[i] || "";
        
        // Include all rows that have at least a planned date
        if (plannedVal) {
          let inRange = true;
          const pDate = parseFilterDate(plannedVal);
          
          if (pDate) {
            if (filterFrom && pDate < filterFrom) inRange = false;
            if (filterTo && pDate > filterTo) inRange = false;
          }

          if (inRange) {
            rows.push({
              taskName: taskNameValues[i] || "",
              planned: plannedVal,
              actual: actualVal,
              delay: delayVal
            });
          }
        }
      }

      setActiveDrillDown({
        taskId: task.taskName,
        type,
        title: `Total Achievement Details`,
        rows,
        loading: false
      });
    } catch (error) {
      console.error("Error fetching drill-down data:", error);
      setActiveDrillDown({
        taskId: task.taskName,
        type,
        title: `Total Achievement Details`,
        rows: [],
        loading: false,
        error: error.message
      });
    } finally {
      setDrillDownLoading(false);
    }
  };

  const handleWhatsAppSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("EXECUTION START: handleWhatsAppSubmit");
    if (whatsappSubmitting || mainSubmitting) return;
    
    if (selectedEmployees.length === 0) {
      alert("Please select at least one person.");
      return;
    }

    setWhatsappSubmitting(true);
    try {
      const scriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
      const targetSpreadsheetId = "1qlSZ41zJ2vh_7o8LxQJgoWx7c2pEOnf41wmiuL1iup4";
      const whatsappLinks = [];

      for (const id of selectedEmployees) {
        const emp = sheetEmployees.find(e => e.id === id);
        const inputs = editableData[id] || {};

        const row = [
          "", // Column A
          emp.name,
          emp.target,
          emp.actualWorkDone,
          emp.weeklyWorkDone,
          emp.weeklyWorkDoneOnTime,
          emp.totalWorkDone,
          emp.weekPending,
          emp.allPendingTillDate,
          emp.plannedWorkNotDone,
          emp.plannedWorkNotDoneOnTime,
          emp.commitment,
          inputs.nextWeekPlannedNotDone || emp.nextWeekPlannedWorkNotDone || 0,
          inputs.nextWeekPlannedNotDoneOnTime || emp.nextWeekPlannedWorkNotDoneOnTime || 0,
          inputs.nextWeekCommitment || emp.nextWeekCommitment || 0
        ];

        const payload = {
          action: "insert",
          spreadsheetId: targetSpreadsheetId,
          sheetName: "For Whatsapp",
          rowData: JSON.stringify(row)
        };

        const response = await fetch(scriptUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(payload)
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        try {
          const result = await response.json();
          if (result && !result.success) throw new Error(result.error || "Failed to submit");
        } catch (e) {
          console.warn("JSON parse failed (CORS), assuming success.");
        }

        const message = `📊 *MIS Weekly Performance Report*

👋 Hello ${emp.name},

Here is your performance summary:

📌 Target: ${emp.target}  
✅ Actual Work Done: ${emp.actualWorkDone}  
📈 % Weekly Not Done: ${emp.weeklyWorkDone}%  
⏱ Weekly On Time Not Done %: ${emp.weeklyWorkDoneOnTime}%  

📊 Total Work Done: ${emp.totalWorkDone}  
📉 Week Pending: ${emp.weekPending}  
🚨 All Pending Till Date: ${emp.allPendingTillDate}  

Please review your performance and ensure timely completion of pending tasks.

Best regards,  
Passary Refractories.`;

        const phone = emp.email || "";
        const cleanPhone = phone.replace(/\D/g, "");
        if (cleanPhone) {
          whatsappLinks.push(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`);
        }
      }

      alert("Data submitted to WhatsApp sheet successfully! ✅");
      whatsappLinks.forEach(link => window.open(link, "_blank"));

    } catch (error) {
      console.error("WhatsApp Error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setWhatsappSubmitting(false);
      console.log("EXECUTION END: handleWhatsAppSubmit");
    }
  };

  const handleMainSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("EXECUTION START: handleMainSubmit");
    if (whatsappSubmitting || mainSubmitting) return;

    if (selectedEmployees.length === 0) {
      alert("Please select at least one person.");
      return;
    }

    setMainSubmitting(true);
    try {
      const scriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;

      for (const id of selectedEmployees) {
        const emp = sheetEmployees.find(e => e.id === id);
        const inputs = editableData[id] || {};

        const row = [
          emp.name,
          emp.startDate,
          emp.endDate,
          inputs.nextWeekPlannedNotDone || "",
          inputs.nextWeekPlannedNotDoneOnTime || "",
          inputs.nextWeekCommitment || ""
        ];

        const existing = archivedMap[emp.name];
        const payload = existing
          ? { action: "update", sheetName: "Archived", rowIndex: existing.rowIndex, rowData: JSON.stringify(row) }
          : { action: "insert", sheetName: "Archived", rowData: JSON.stringify(row) };

        const response = await fetch(scriptUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(payload)
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || "Failed to save row");
      }

      alert("Saved successfully ✅");
      setSelectedEmployees([]);
      setEditableData({});
      setSelectAll(false);
    } catch (error) {
      console.error("Main Submit Error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setMainSubmitting(false);
      console.log("EXECUTION END: handleMainSubmit");
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6 p-2 md:p-4">
      {/* Header */}
      <DashboardHeader
        user={user}
        ALL_COLUMNS={ALL_COLUMNS}
        visibleColumns={visibleColumns}
        filteredEmployees={filteredEmployees}
        employeeCommitments={employeeCommitments}
        topWorstPerformers={topScorers}
        topBestPerformers={topBestPerformers}
        pendingTasks={sortedPendingList}
        departmentScores={departmentScores}
        dataSheetRows={dataSheetRows}
        reportDateRange={reportDateRange}
      />

      {/* Category Tabs: MIS Category Report | Non MIS Category Report | Other Category Report */}
      <CategoryTabs
        activeCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        counts={categoryCounts}
      />

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatsCard
          title="Total People"
          value={loading ? '—' : dashboardStats.totalEmployees}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Work Assigned"
          value={loading ? '—' : dashboardStats.totalTarget}
          icon={Target}
          color="purple"
        />
        <StatsCard
          title="Work Done"
          value={loading ? '—' : dashboardStats.totalActual}
          icon={CheckSquare}
          color="green"
        />
        <StatsCard
          title="Completion Rate"
          value={loading ? '—' : `${dashboardStats.completionPct}%`}
          icon={TrendingUp}
          color={dashboardStats.completionPct >= 75 ? 'green' : dashboardStats.completionPct >= 50 ? 'amber' : 'orange'}
        />
      </div>

      {/* Employee List */}
      <EmployeeListSection
        user={user}
        ALL_COLUMNS={ALL_COLUMNS}
        visibleColumns={visibleColumns}
        showColumnFilter={showColumnFilter}
        setShowColumnFilter={setShowColumnFilter}
        toggleColumn={toggleColumn}
        toggleAllColumns={toggleAllColumns}
        columnLabels={columnLabels}
        filterName={filterName}
        setFilterName={setFilterName}
        filterDepartment={filterDepartment}
        setFilterDepartment={setFilterDepartment}
        uniqueDesignations={uniqueDesignations}
        filterDeptName={filterDeptName}
        setFilterDeptName={setFilterDeptName}
        uniqueDepartments={uniqueDepartments}
        filterFirmName={filterFirmName}
        setFilterFirmName={setFilterFirmName}
        uniqueFirms={uniqueFirms}
        filterIncentiveCategory={filterIncentiveCategory}
        setFilterIncentiveCategory={setFilterIncentiveCategory}
        uniqueIncentiveCategories={uniqueIncentiveCategories}
        onMainSubmit={handleMainSubmit}
        onWhatsAppSubmit={handleWhatsAppSubmit}
        selectedEmployees={selectedEmployees}
        mainSubmitting={mainSubmitting}
        whatsappSubmitting={whatsappSubmitting}
        loading={loading}
        filteredEmployees={filteredEmployees}
        selectAll={selectAll}
        handleSelectAll={handleSelectAll}
        handleCheckboxChange={handleCheckboxChange}
        handleEmployeeSelect={handleEmployeeSelect}
        handleRowClick={handleRowClick}
        editableData={editableData}
        handleInputChange={handleInputChange}
        expandedEmployee={expandedEmployee}
        setExpandedEmployee={setExpandedEmployee}
        employeeCommitments={employeeCommitments}
        handleCommitmentChange={handleCommitmentChange}
      />

      {/* Modals (User Details + Drill Down) */}
      <UserDetailsModal
        selectedUserDetails={selectedUserDetails}
        setSelectedUserDetails={setSelectedUserDetails}
        activeDrillDown={activeDrillDown}
        setActiveDrillDown={setActiveDrillDown}
        handleDrillDown={handleDrillDown}
      />

      {/* Charts */}
      <ChartsGrid
        user={user}
        loading={loading}
        topScorersData={topScorersData}
        topScorersLabels={topScorersLabels}
        pendingTasksData={pendingTasksData}
        pendingTasksLabels={pendingTasksLabels}
        pendingTasksTotalData={pendingTasksTotalData}
        topBestData={topBestData}
        topBestLabels={topBestLabels}
        topBestTotalData={topBestTotalData}
      />

      {/* Department Workload (Target vs Actual) - Admin Only */}
      {(user?.role === 'admin' || user?.role === 'superadmin') && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 lg:p-8 mt-6">
          <h2 className="text-sm md:text-base font-bold text-gray-800 flex items-center gap-2 mb-6">
            <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
            Department Workload
          </h2>
          <div className="h-[320px] md:h-[380px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="text-sm font-medium text-gray-500">Loading data...</span>
              </div>
            ) : departmentWorkload.length > 0 ? (
              <DepartmentWorkloadChart
                labels={departmentWorkloadLabels}
                targetData={departmentWorkloadTarget}
                actualData={departmentWorkloadActual}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm italic">No department data available</div>
            )}
          </div>
        </div>
      )}

      {/* Department Scores - Admin Only */}
      {(user?.role === 'admin' || user?.role === 'superadmin') && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 lg:p-8 mt-6">
          <h2 className="text-sm md:text-base font-bold text-gray-800 flex items-center gap-2 mb-6">
            <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
            Department Scores
          </h2>
          <div className="h-[400px] md:h-[500px]">
            <DepartmentScoreChart
              labels={departmentScoresLabels}
              pendingData={departmentScoresPending}
              notDoneData={departmentScoresData}
              notDoneOnTimeData={departmentScoresNotDoneOnTime}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
