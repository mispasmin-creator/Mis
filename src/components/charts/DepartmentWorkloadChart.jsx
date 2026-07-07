import React, { useMemo } from 'react';

// Target (work assigned) vs Actual (work done), grouped by department.
const TARGET_COLOR = '#2a78d6';
const ACTUAL_COLOR = '#008300';

const DepartmentWorkloadChart = ({ labels, targetData, actualData }) => {
  const maxValue = useMemo(
    () => Math.max(...targetData, ...actualData, 1),
    [targetData, actualData]
  );

  return (
    <div className="w-full h-full flex flex-col">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-6 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: TARGET_COLOR }} />
          <span className="text-gray-600 font-medium">Work Assigned (Target)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: ACTUAL_COLOR }} />
          <span className="text-gray-600 font-medium">Work Done (Actual)</span>
        </div>
      </div>

      {/* Scrollable bars */}
      <div className="flex-1 overflow-x-auto custom-scrollbar">
        <div
          className="h-full flex items-end gap-6 md:gap-10 px-2 min-w-max"
          style={{ minWidth: Math.max(labels.length * 90, 100) + 'px' }}
        >
          {labels.map((label, idx) => {
            const target = targetData[idx] || 0;
            const actual = actualData[idx] || 0;
            const pct = target > 0 ? Math.round((actual / target) * 100) : 0;
            const targetH = Math.max(0, Math.min(100, (target / maxValue) * 100));
            const actualH = Math.max(0, Math.min(100, (actual / maxValue) * 100));

            return (
              <div key={label} className="flex flex-col items-center h-full flex-shrink-0 w-[72px] md:w-[90px]">
                <div className="flex-1 w-full flex items-end justify-center gap-1">
                  {/* Target bar */}
                  <div
                    className="w-4 md:w-6 rounded-t-[4px] relative"
                    style={{ height: `${targetH}%`, backgroundColor: TARGET_COLOR }}
                    title={`${label} — Assigned: ${target}`}
                  >
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-gray-700 whitespace-nowrap">
                      {target}
                    </span>
                  </div>
                  {/* Actual bar */}
                  <div
                    className="w-4 md:w-6 rounded-t-[4px] relative"
                    style={{ height: `${actualH}%`, backgroundColor: ACTUAL_COLOR }}
                    title={`${label} — Done: ${actual}`}
                  >
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-gray-700 whitespace-nowrap">
                      {actual}
                    </span>
                  </div>
                </div>

                <div className="mt-3 w-full text-center">
                  <p className="text-xs font-bold text-gray-800 leading-tight break-words">{label}</p>
                  <p className={`text-[10px] font-semibold mt-0.5 ${pct >= 100 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {pct}% done
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DepartmentWorkloadChart;
