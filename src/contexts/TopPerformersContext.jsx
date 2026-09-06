import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getDisplayableImageUrl } from '../utils/imageUtils';

const TopPerformersContext = createContext({
  topPerformers: [],
  loading: true,
  refreshTopPerformers: () => {}
});

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

export const TopPerformersProvider = ({ children }) => {
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPerformers = async () => {
    try {
      setLoading(true);
      const scriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
      if (!scriptUrl) {
        setLoading(false);
        return;
      }

      const [recordsRes, masterRes, forRecordsRes] = await Promise.all([
        fetch(`${scriptUrl}?sheet=Records`),
        fetch(`${scriptUrl}?sheet=Master`),
        fetch(`${scriptUrl}?sheet=For Records`)
      ]);

      const recordsResult = await recordsRes.json();
      const masterResult = await masterRes.json();
      const forRecordsResult = await forRecordsRes.json();

      // Master maps
      const imageMap = {};
      const designationMap = {};
      const departmentMap = {};

      if (masterResult.success && Array.isArray(masterResult.data)) {
        masterResult.data.slice(1).forEach(row => {
          const name = row[0] ? String(row[0]).trim().toLowerCase() : '';
          const dept = row[2] ? String(row[2]).trim() : '';
          const desig = row[3] ? String(row[3]).trim() : '';
          const img = row[4];
          if (name) {
            if (dept) departmentMap[name] = dept;
            if (desig) designationMap[name] = desig;
            if (img) imageMap[name] = img;
          }
        });
      }

      // Weekly schedule logic:
      // 0 = Sunday, 1 = Monday -> Review meeting period: Show completed review week from Records (e.g. 30-Aug to 05-Sep)
      // 2 = Tuesday, 3 = Wednesday, ..., 6 = Saturday -> Ongoing active week: Show live work in progress from For Records (e.g. 6-Sep to 12-Sep)
      const currentDay = new Date().getDay();
      const isReviewPeriod = currentDay === 0 || currentDay === 1;

      let dataRows = [];

      if (isReviewPeriod) {
        // A. Sunday & Monday: Load latest submitted week from Records
        if (recordsResult.success && Array.isArray(recordsResult.data) && recordsResult.data.length > 1) {
          const rows = recordsResult.data.slice(1).filter(row => row[2] && String(row[2]).trim() !== '');
          const uniqueDates = [...new Set(rows.map(r => r[0]))].filter(Boolean);
          uniqueDates.sort((a, b) => normalizeDate(b).localeCompare(normalizeDate(a)));
          const latestDate = uniqueDates[0];

          if (latestDate) {
            dataRows = rows.filter(r => r[0] === latestDate);
          } else {
            dataRows = rows;
          }
        }
        // Fallback to For Records if Records is empty
        if (dataRows.length === 0 && forRecordsResult.success && Array.isArray(forRecordsResult.data)) {
          dataRows = forRecordsResult.data.slice(2).filter(row => row[2] && String(row[2]).trim() !== '');
        }
      } else {
        // B. Tuesday to Saturday: Load live running active week from For Records
        if (forRecordsResult.success && Array.isArray(forRecordsResult.data)) {
          dataRows = forRecordsResult.data.slice(2).filter(row => row[2] && String(row[2]).trim() !== '');
        }
        // Fallback to Records if For Records is empty
        if (dataRows.length === 0 && recordsResult.success && Array.isArray(recordsResult.data) && recordsResult.data.length > 1) {
          const rows = recordsResult.data.slice(1).filter(row => row[2] && String(row[2]).trim() !== '');
          const uniqueDates = [...new Set(rows.map(r => r[0]))].filter(Boolean);
          uniqueDates.sort((a, b) => normalizeDate(b).localeCompare(normalizeDate(a)));
          const latestDate = uniqueDates[0];
          dataRows = latestDate ? rows.filter(r => r[0] === latestDate) : rows;
        }
      }

      if (dataRows.length > 0) {
        const employees = dataRows.map((row, index) => {
          const empName = String(row[2]).trim();
          const normalized = empName.toLowerCase();
          const rawImg = imageMap[normalized];
          let finalImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(empName)}&background=0D8ABC&color=fff&size=128`;
          if (rawImg) {
            const processed = getDisplayableImageUrl(rawImg);
            if (processed) finalImg = processed;
          }

          const actualDone = parseFloat(row[4]) || 0;
          const totalDone = parseFloat(row[7]) || 0;
          const target = parseFloat(row[3]) || 0;
          const weeklyDone = row[5] || '0%';

          return {
            id: `emp-${index}`,
            name: empName,
            department: departmentMap[normalized] || 'General',
            designation: designationMap[normalized] || '',
            image: finalImg,
            actualWorkDone: actualDone,
            totalWorkDone: totalDone,
            target: target,
            weeklyWorkDone: weeklyDone
          };
        });

        // Group by department and find top performer per department
        const deptMap = {};
        employees.forEach(emp => {
          const dept = emp.department || 'General';
          if (!deptMap[dept]) deptMap[dept] = [];
          deptMap[dept].push(emp);
        });

        const winners = [];
        Object.entries(deptMap).forEach(([dept, emps]) => {
          const sorted = [...emps].sort((a, b) => {
            if (b.actualWorkDone !== a.actualWorkDone) {
              return b.actualWorkDone - a.actualWorkDone;
            }
            return (b.totalWorkDone || 0) - (a.totalWorkDone || 0);
          });
          if (sorted.length > 0) {
            winners.push(sorted[0]);
          }
        });

        // Sort winners by actual work done descending
        winners.sort((a, b) => (b.actualWorkDone || 0) - (a.actualWorkDone || 0));
        setTopPerformers(winners);
      }
    } catch (err) {
      console.error('Error in TopPerformersContext:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformers();
  }, []);

  const value = useMemo(() => ({
    topPerformers,
    loading,
    refreshTopPerformers: fetchPerformers
  }), [topPerformers, loading]);

  return (
    <TopPerformersContext.Provider value={value}>
      {children}
    </TopPerformersContext.Provider>
  );
};

export const useTopPerformers = () => useContext(TopPerformersContext);
export default TopPerformersContext;
