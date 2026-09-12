import React from 'react';
import { Search, X, Filter } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterSelectConfig {
  key: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

export interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterSelectConfig[];
  onClearFilters?: () => void;
  totalFiltered?: number;
  totalCount?: number;
  extraActions?: React.ReactNode;
  className?: string;
  id?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters = [],
  onClearFilters,
  totalFiltered,
  totalCount,
  extraActions,
  className = '',
  id,
}) => {
  const hasActiveFilters = searchValue.trim().length > 0 || filters.some((f) => f.value !== '' && f.value !== 'ALL');

  return (
    <div
      id={id}
      className={`p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2.5 min-w-[240px]">
        {/* Search Field */}
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        {filters.map((filter) => (
          <div key={filter.key} className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">{filter.label}:</span>
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer"
            >
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Clear Filters button */}
        {hasActiveFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {totalCount !== undefined && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {totalFiltered !== undefined && totalFiltered !== totalCount ? (
              <span>
                <strong className="text-blue-600 dark:text-blue-400">{totalFiltered}</strong> of {totalCount}
              </span>
            ) : (
              <span>{totalCount} total</span>
            )}
          </div>
        )}
        {extraActions}
      </div>
    </div>
  );
};
