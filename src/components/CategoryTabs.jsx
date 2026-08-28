import React from 'react';
import { Layers, FileSpreadsheet, FolderGit2 } from 'lucide-react';
import { CATEGORY_LABELS, CATEGORY_KEYS } from '../utils/categorize';

const ICONS = {
  [CATEGORY_KEYS.MIS]: FileSpreadsheet,
  [CATEGORY_KEYS.NON_MIS]: Layers,
  [CATEGORY_KEYS.OTHER]: FolderGit2,
};

/**
 * Reusable Category Tabs Component for MIS, Non MIS, and Other category reports.
 * 
 * @param {Object} props
 * @param {'MIS' | 'NonMIS' | 'Other'} props.activeCategory - Currently selected category key
 * @param {Function} props.onSelectCategory - Callback when a category tab is clicked
 * @param {Object} [props.counts] - Optional record counts per category: { MIS: number, NonMIS: number, Other: number }
 * @param {string} [props.className] - Optional extra wrapper class
 */
const CategoryTabs = ({
  activeCategory = CATEGORY_KEYS.MIS,
  onSelectCategory,
  counts = null,
  className = '',
}) => {
  return (
    <div className={`w-full bg-white rounded-xl border border-gray-200 p-1.5 sm:p-2 shadow-sm ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2">
        {CATEGORY_LABELS.map(({ key, label }) => {
          const isActive = activeCategory === key;
          const Icon = ICONS[key] || Layers;
          const count = counts ? counts[key] : null;

          return (
            <button
              key={key}
              type="button"
              id={`tab-category-${key.toLowerCase()}`}
              onClick={() => onSelectCategory && onSelectCategory(key)}
              className={`flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer text-left ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 ring-2 ring-indigo-300'
                  : 'bg-gray-50/80 text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-900 border border-gray-200/60 hover:border-indigo-200'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <Icon
                  size={18}
                  className={`flex-shrink-0 transition-transform ${
                    isActive ? 'text-white scale-110' : 'text-indigo-600'
                  }`}
                />
                <span className="truncate">{label}</span>
              </div>

              {count !== null && count !== undefined && (
                <span
                  className={`ml-2 text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'bg-white text-gray-600 border border-gray-200 shadow-2xs'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryTabs;
