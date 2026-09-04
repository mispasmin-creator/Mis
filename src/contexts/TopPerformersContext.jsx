import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getDisplayableImageUrl } from '../utils/imageUtils';

const TopPerformersContext = createContext({
  topPerformers: [],
  loading: true,
  refreshTopPerformers: () => {}
});

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

      const [recordsRes, masterRes] = await Promise.all([
        fetch(`${scriptUrl}?sheet=For Records`),
        fetch(`${scriptUrl}?sheet=Master`)
      ]);

      const recordsResult = await recordsRes.json();
      const masterResult = await masterRes.json();

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

      // For Records parsing
      if (recordsResult.success && Array.isArray(recordsResult.data)) {
        const dataRows = recordsResult.data.slice(2).filter(row => row[2] && String(row[2]).trim() !== '');

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
