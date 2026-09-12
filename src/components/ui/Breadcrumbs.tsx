import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  id: string;
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
      className={`flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 ${className}`}
    >
      <button
        onClick={onHomeClick}
        className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
        title="Dashboard Home"
      >
        <Home className="w-3.5 h-3.5" />
      </button>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={item.id}>
            <ChevronRight className="w-3 h-3 text-slate-400 opacity-60 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                {item.label}
              </span>
            ) : (
              <button
                onClick={item.onClick}
                className="hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors truncate"
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
