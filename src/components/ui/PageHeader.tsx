/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs';
import { Button } from './Button';

export interface PageHeaderAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  id?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
  disabled?: boolean;
}

export interface PageHeaderProps {
  title: string;
  description: string;
  breadcrumbs?: BreadcrumbItem[];
  primaryAction?: PageHeaderAction;
  secondaryActions?: React.ReactNode;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  primaryAction,
  secondaryActions,
  badge,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Breadcrumbs Navigation */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} />
      )}

      {/* Main Header Container */}
      <div className="p-6 glass-card border-[var(--glass-border)] relative overflow-hidden">
        {/* Subtle Ambient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(59,130,246,0.03)] via-transparent to-[rgba(139,92,246,0.02)] pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                {title}
              </h1>
              {badge && <div>{badge}</div>}
            </div>
            <p className="text-xs text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              {description}
            </p>
          </div>

          {/* Contextual Actions */}
          {(primaryAction || secondaryActions) && (
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {secondaryActions}
              {primaryAction && (
                <Button
                  id={primaryAction.id || `btn-action-${title.toLowerCase().replace(/\s+/g, '-')}`}
                  variant={primaryAction.variant || 'primary'}
                  size="sm"
                  onClick={primaryAction.onClick}
                  isLoading={primaryAction.isLoading}
                  disabled={primaryAction.disabled}
                  leftIcon={primaryAction.icon}
                >
                  {primaryAction.label}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Optional Slot for Tabs or Filters directly under the header */}
        {children && <div className="relative mt-5 pt-4 border-t border-[var(--glass-border)]">{children}</div>}
      </div>
    </div>
  );
};
