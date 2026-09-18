/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SearchX, ArrowLeft, Home, FileQuestion } from 'lucide-react';
import { Button } from '../ui/Button';

interface NotFoundStateProps {
  title?: string;
  description?: string;
  resourceName?: string;
  resourceId?: string;
  onBack?: () => void;
  onGoHome?: () => void;
  className?: string;
}

/**
 * Reusable Glass Morphism Not Found view.
 * Handles both invalid routes (e.g. /xyz) and missing deep-link entities (e.g. /clients/invalid).
 */
export const NotFoundState: React.FC<NotFoundStateProps> = ({
  title = 'Resource Not Found',
  description,
  resourceName,
  resourceId,
  onBack,
  onGoHome,
  className = '',
}) => {
  const defaultDescription = resourceName && resourceId
    ? `The requested ${resourceName} with identifier "${resourceId}" does not exist, has been de-provisioned, or cannot be accessed.`
    : description || 'The requested URL or operational resource could not be found. Please check the address or return to the operations overview.';

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      handleGoHome();
    }
  };

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className={`w-full flex items-center justify-center p-6 ${className}`}>
      <div className="w-full max-w-lg bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-2xl p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
        {/* Subtle ambient glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--accent-blue-dim)] rounded-full blur-2xl pointer-events-none opacity-20" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[var(--accent-amber-dim)] rounded-full blur-2xl pointer-events-none opacity-20" />

        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--glass-bg-active)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--accent-amber)] shadow-[0_0_24px_rgba(245,158,11,0.15)] relative z-10">
          {resourceId ? <SearchX className="w-8 h-8" /> : <FileQuestion className="w-8 h-8" />}
        </div>

        {/* Text */}
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-[var(--accent-amber-dim)] text-[var(--accent-amber)] border border-[rgba(245,158,11,0.25)]">
            404 • Not Found
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto">
            {defaultDescription}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 relative z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Go Back
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleGoHome}
            leftIcon={<Home className="w-4 h-4" />}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
