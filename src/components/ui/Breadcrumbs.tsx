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
      className={`flex items-center gap-1.5 text-xs text-[var(--text-secondary)] ${className}`}
    >
      <button
        onClick={onHomeClick}
        className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors p-1 rounded hover:bg-[var(--glass-bg)]"
        title="Dashboard Home"
      >
        <Home className="w-3.5 h-3.5" />
      </button>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={item.id}>
            <ChevronRight className="w-3 h-3 text-[var(--text-tertiary)] opacity-60 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-[var(--text-primary)] truncate">
                {item.label}
              </span>
            ) : (
              <button
                onClick={item.onClick}
                className="hover:text-[var(--text-primary)] text-[var(--text-secondary)] transition-colors truncate"
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
