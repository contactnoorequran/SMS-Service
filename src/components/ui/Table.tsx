import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

export interface TableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  emptySubtext?: string;
  className?: string;
  id?: string;
  onRowClick?: (item: T) => void;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  sortKey,
  sortDirection,
  onSort,
  isLoading = false,
  emptyMessage = 'No records found',
  emptySubtext = 'Try adjusting your filters or search query.',
  className = '',
  id,
  onRowClick,
}: TableProps<T>) {
  return (
    <div id={id} className={`w-full overflow-hidden border border-[var(--glass-border)] rounded-xl bg-[var(--glass-bg)] backdrop-blur-md ${className}`}>
      <div className="overflow-x-auto min-w-full table-scroll-container">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[rgba(255,255,255,0.03)] border-b border-[var(--glass-border)] text-[var(--text-secondary)] uppercase tracking-wider font-semibold text-[11px]">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={
                      isSorted
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : col.sortable
                        ? 'none'
                        : undefined
                    }
                    tabIndex={col.sortable ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (col.sortable && onSort && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onSort(col.key);
                      }
                    }}
                    onClick={() => col.sortable && onSort && onSort(col.key)}
                    className={`px-4 py-3.5 select-none ${col.className || ''} ${
                      col.sortable
                        ? 'cursor-pointer hover:text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:bg-[var(--glass-bg-hover)]'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-[var(--text-tertiary)]">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--glass-border)]">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, rIdx) => (
                <tr key={`loading-row-${rIdx}`}>
                  {columns.map((col) => (
                    <td key={`loading-col-${col.key}`} className="px-4 py-3.5">
                      <div className="h-4 glass-skeleton w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{emptyMessage}</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">{emptySubtext}</p>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={keyExtractor(item, index)}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`transition-colors hover:bg-[var(--glass-bg-hover)] ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td key={`${col.key}-${keyExtractor(item, index)}`} className={`px-4 py-3.5 text-[var(--text-secondary)] ${col.className || ''}`}>
                      {col.render ? col.render(item, index) : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
