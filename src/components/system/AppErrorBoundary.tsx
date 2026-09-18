/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

type ComponentBaseType = new (props: Props) => {
  props: Props;
  state: State;
  setState(
    updater: Partial<State> | ((prevState: State) => Partial<State>),
    callback?: () => void
  ): void;
  componentDidCatch?(error: Error, errorInfo: ErrorInfo): void;
  render(): ReactNode;
};

const ComponentBase = React.Component as unknown as ComponentBaseType;

/**
 * Enterprise Glass Morphism Error Boundary.
 * Catches render-time React exceptions, prevents the entire UI tree from unmounting into a black screen,
 * and provides graceful recovery workflows.
 */
export class AppErrorBoundary extends ComponentBase {
  public override state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // Diagnostic logging with platform prefix
    console.error('[AppErrorBoundary] Uncaught component render exception:', error);
    console.error('[AppErrorBoundary] Component stack trace:', errorInfo.componentStack);
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
    });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    this.handleReset();
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  private handleCopyError = (): void => {
    const errorText = `${this.state.error?.toString()}\n\nComponent Stack:${this.state.errorInfo?.componentStack || 'N/A'}`;
    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full bg-[var(--bg-deep)] text-[var(--text-primary)] flex items-center justify-center p-6 relative overflow-hidden font-sans">
          {/* Subtle background ambient glows */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent-rose-dim)] rounded-full blur-3xl pointer-events-none opacity-20" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent-blue-dim)] rounded-full blur-3xl pointer-events-none opacity-15" />

          <div className="relative z-10 w-full max-w-xl bg-[var(--glass-bg)] backdrop-blur-2xl border border-[var(--glass-border)] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Header Icon & Title */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-rose-dim)] border border-[rgba(244,63,94,0.3)] flex items-center justify-center text-[var(--accent-rose)] shrink-0 shadow-[0_0_24px_rgba(244,63,94,0.2)]">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-[var(--accent-rose-dim)] text-[var(--accent-rose)] border border-[rgba(244,63,94,0.2)]">
                    System Safeguard Active
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight mt-1.5">
                  Rendering Exception Intercepted
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  An unexpected error interrupted view rendering. The application state has been preserved to avoid a blank screen.
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="p-3.5 rounded-xl bg-[var(--glass-bg-active)] border border-[var(--glass-border)] font-mono text-xs text-[var(--accent-rose)] break-all">
              {this.state.error?.message || 'Unknown runtime render exception'}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={this.handleReset}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Retry / Reload View
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={this.handleGoHome}
                leftIcon={<Home className="w-4 h-4" />}
              >
                Return to Dashboard
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={this.handleReload}
              >
                Hard Browser Reload
              </Button>
            </div>

            {/* Expandable Technical Details */}
            <div className="pt-2 border-t border-[var(--glass-border)]">
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="flex items-center justify-between w-full text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors py-1 cursor-pointer"
              >
                <span>Technical Diagnostics (Component Stack)</span>
                {this.state.showDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {this.state.showDetails && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      Component Stack Trace
                    </span>
                    <button
                      type="button"
                      onClick={this.handleCopyError}
                      className="flex items-center gap-1 text-[11px] text-[var(--accent-blue)] hover:underline cursor-pointer"
                    >
                      {this.state.copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
                          <span className="text-[var(--accent-emerald)]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Diagnostic Data</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 bg-[rgba(0,0,0,0.4)] rounded-xl border border-[var(--glass-border)] text-[11px] font-mono text-[var(--text-secondary)] max-h-48 overflow-y-auto whitespace-pre-wrap select-all">
                    {this.state.errorInfo?.componentStack || 'No component stack recorded.'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
