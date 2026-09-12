import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
}) => {
  const variantClass = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  }[variant];

  return (
    <div
      className={`animate-pulse bg-slate-200/80 dark:bg-slate-800 ${variantClass} ${className}`}
      style={{ width, height }}
    />
  );
};

export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" className="w-24" />
          <Skeleton variant="rectangular" className="h-8 w-32" />
        </div>
        <Skeleton variant="rectangular" className="w-10 h-10 rounded-lg" />
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
        <Skeleton variant="text" className="w-20" />
        <Skeleton variant="text" className="w-16" />
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 260 }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton variant="text" className="w-40 h-5" />
          <Skeleton variant="text" className="w-60 h-3" />
        </div>
        <Skeleton variant="rectangular" className="w-24 h-8 rounded-lg" />
      </div>
      <div
        className="w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl flex items-end gap-3 p-4"
        style={{ height }}
      >
        <div className="h-1/3 w-full bg-slate-200 dark:bg-slate-700/60 rounded-t" />
        <div className="h-2/3 w-full bg-slate-200 dark:bg-slate-700/60 rounded-t" />
        <div className="h-1/2 w-full bg-slate-200 dark:bg-slate-700/60 rounded-t" />
        <div className="h-4/5 w-full bg-slate-200 dark:bg-slate-700/60 rounded-t" />
        <div className="h-3/5 w-full bg-slate-200 dark:bg-slate-700/60 rounded-t" />
        <div className="h-full w-full bg-slate-200 dark:bg-slate-700/60 rounded-t" />
      </div>
    </div>
  );
};
