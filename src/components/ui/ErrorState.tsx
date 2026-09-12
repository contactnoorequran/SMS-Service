import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | string | null;
  onRetry?: () => void;
  className?: string;
  id?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while communicating with backend services.',
  error,
  onRetry,
  className = '',
  id,
}) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const errorString = error instanceof Error ? error.stack || error.message : typeof error === 'string' ? error : null;

  return (
    <div
      id={id}
      className={`p-6 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-center flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-11 h-11 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
        <AlertTriangle className="w-5 h-5" />
      </div>

      <h4 className="text-sm font-semibold text-rose-950 dark:text-rose-200 mb-1">
        {title}
      </h4>

      <p className="text-xs text-rose-700/80 dark:text-rose-300/70 max-w-md mb-4">
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
            className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium"
          >
            <span>{showDetails ? 'Hide details' : 'Show details'}</span>
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {showDetails && errorString && (
        <pre className="mt-4 p-3 bg-rose-950/80 text-rose-200 text-[11px] font-mono rounded-lg text-left w-full max-w-xl overflow-x-auto">
          {errorString}
        </pre>
      )}
    </div>
  );
};
