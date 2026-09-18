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
      className={`glass-skeleton ${variantClass} ${className}`}
      style={{ width, height }}
    />
  );
};

export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" className="w-24" />
          <Skeleton variant="rectangular" className="h-8 w-32" />
        </div>
        <Skeleton variant="rectangular" className="w-10 h-10 rounded-lg" />
      </div>
      <div className="mt-4 pt-3 border-t border-[var(--glass-border)] flex justify-between">
        <Skeleton variant="text" className="w-20" />
        <Skeleton variant="text" className="w-16" />
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 260 }) => {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton variant="text" className="w-40 h-5" />
          <Skeleton variant="text" className="w-60 h-3" />
        </div>
        <Skeleton variant="rectangular" className="w-24 h-8 rounded-lg" />
      </div>
      <div
        className="w-full bg-[rgba(255,255,255,0.02)] rounded-xl flex items-end gap-3 p-4"
        style={{ height }}
      >
        <div className="h-1/3 w-full glass-skeleton rounded-t" />
        <div className="h-2/3 w-full glass-skeleton rounded-t" />
        <div className="h-1/2 w-full glass-skeleton rounded-t" />
        <div className="h-4/5 w-full glass-skeleton rounded-t" />
        <div className="h-3/5 w-full glass-skeleton rounded-t" />
        <div className="h-full w-full glass-skeleton rounded-t" />
      </div>
    </div>
  );
};
