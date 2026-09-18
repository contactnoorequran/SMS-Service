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
      className={`p-3 glass-card flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2.5 min-w-[240px]">
        {/* Search Field */}
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="w-full pl-8 pr-8 py-1.5 text-xs glass-input"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search input"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        {filters.map((filter) => (
          <div key={filter.key} className="flex items-center gap-1.5 text-xs">
            <label htmlFor={`filter-${filter.key}`} className="text-[var(--text-tertiary)] text-[11px] font-medium hidden sm:inline">
              {filter.label}:
            </label>
            <select
              id={`filter-${filter.key}`}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              aria-label={filter.label}
              className="glass-input px-2.5 py-1.5 text-xs font-medium cursor-pointer"
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
            type="button"
            onClick={onClearFilters}
            aria-label="Reset all filters"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent-rose)] bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {totalCount !== undefined && (
          <div className="text-[11px] text-[var(--text-tertiary)] font-mono">
            {totalFiltered !== undefined && totalFiltered !== totalCount ? (
              <span>
                <strong className="text-[var(--accent-blue)]">{totalFiltered}</strong> of {totalCount}
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
