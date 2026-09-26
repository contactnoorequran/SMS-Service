import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  id?: string;
  label: string;
  onClick?: () => void;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onHomeClick?: () => void;
  className?: string;
  id?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  onHomeClick,
  className = '',
  id,
}) => {
  return (
    <nav
      id={id}
      aria-label="Breadcrumb"
      className={`flex items-center gap-1.5 text-xs text-[var(--text-secondary)] whitespace-nowrap min-w-0 overflow-hidden ${className}`}
    >
      {onHomeClick && (
        <>
          <button
            type="button"
            onClick={onHomeClick}
            className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors p-1 rounded hover:bg-[var(--glass-bg)] shrink-0 cursor-pointer"
            title="Dashboard Home"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
          {items.length > 0 && (
            <ChevronRight className="w-3 h-3 text-[var(--text-tertiary)] opacity-60 shrink-0" />
          )}
        </>
      )}

      <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const key = item.id || `${item.label}-${index}`;
          return (
            <React.Fragment key={key}>
              {index > 0 && (
                <ChevronRight className="w-3 h-3 text-[var(--text-tertiary)] opacity-60 shrink-0" />
              )}
              {isLast ? (
                <span className="font-semibold text-[var(--text-primary)] truncate max-w-[140px] sm:max-w-[200px] md:max-w-[300px]">
                  {item.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  disabled={!item.onClick}
                  className={`transition-colors truncate max-w-[100px] sm:max-w-[150px] ${
                    item.onClick
                      ? 'hover:text-[var(--text-primary)] text-[var(--text-secondary)] cursor-pointer'
                      : 'text-[var(--text-tertiary)] cursor-default'
                  }`}
                >
                  {item.label}
                </button>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};

