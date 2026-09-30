import React from 'react';
import { SearchX, ArrowLeft, Home, FileQuestion } from 'lucide-react';
import { Button } from '../ui/Button';
import { BrandLogo } from '../ui/BrandLogo';

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
  title = 'Route Not Found',
  description,
  resourceName,
  resourceId,
  onBack,
  onGoHome,
  className = '',
}) => {
  const defaultDescription = resourceName && resourceId
    ? `The requested ${resourceName} with identifier "${resourceId}" does not exist, has been de-provisioned, or cannot be accessed.`
    : description || 'The requested URL or operational resource could not be found within WORLD SMS SERVICE. Please check the address or return to the platform dashboard.';

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
        {/* Subtle ambient brand glow */}
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-[var(--brand-primary-glow)] rounded-full blur-3xl pointer-events-none opacity-20" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-[var(--brand-secondary-soft)] rounded-full blur-3xl pointer-events-none opacity-20" />

        {/* Brand Mark and Indicator */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-4">
            <BrandLogo variant="compact" size="sm" />
          </div>
          <div className="w-16 h-16 rounded-2xl bg-[var(--brand-primary-soft)] border border-[var(--brand-border)] flex items-center justify-center text-[var(--brand-primary)] shadow-[0_0_24px_var(--brand-primary-glow)]">
            {resourceId ? <SearchX className="w-8 h-8" /> : <FileQuestion className="w-8 h-8" />}
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] border border-[var(--brand-border)]">
            404 • Unrouted Traffic
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

