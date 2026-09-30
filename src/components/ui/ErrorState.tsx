import React, { useState } from 'react';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './Button';
import { AppIcon, AppIconName } from './AppIcon';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | string | null;
  iconName?: AppIconName;
  onRetry?: () => void;
  className?: string;
  id?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while communicating with backend services.',
  error,
  iconName = 'security-infrastructure',
  onRetry,
  className = '',
  id,
}) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const errorString = error instanceof Error ? error.stack || error.message : typeof error === 'string' ? error : null;

  return (
    <div
      id={id}
      className={`p-6 bg-[var(--accent-rose-dim)] border border-[rgba(244,63,94,0.2)] rounded-2xl text-center flex flex-col items-center justify-center glass-card relative overflow-hidden ${className}`}
    >
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[rgba(244,63,94,0.15)] text-[var(--accent-rose)] border border-[rgba(244,63,94,0.25)] mb-3">
        <span>Telecom Diagnostic</span>
      </div>

      <div className="w-11 h-11 rounded-xl icon-box-rose flex items-center justify-center mb-3">
        <AppIcon name={iconName} size={22} className="text-[var(--accent-rose)]" />
      </div>

      <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
        {title}
      </h4>

      <p className="text-xs text-[var(--text-secondary)] max-w-md mb-4 leading-relaxed">
        {message}
      </p>

      <div className="flex items-center gap-3">
        {onRetry && (
          <Button
            variant="danger"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Try Again
          </Button>
        )}

        {errorString && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs text-[var(--accent-rose)] hover:underline font-medium cursor-pointer"
            aria-expanded={showDetails}
          >
            <span>{showDetails ? 'Hide details' : 'Show details'}</span>
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {showDetails && errorString && (
        <pre className="mt-4 p-3 bg-[rgba(0,0,0,0.5)] text-[var(--accent-rose)] text-[11px] font-mono rounded-lg text-left w-full max-w-xl overflow-x-auto border border-[rgba(244,63,94,0.2)]">
          {errorString}
        </pre>
      )}
    </div>
  );
};

