/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Centralized formatting helpers for the SMS Management Platform.
 * Ensures consistent and crash-safe presentation of currency, counts, percentages, and timestamps across all modules.
 */

/**
 * Format a number as currency (e.g. $292.50, $0.0045 for sub-cent precision)
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = 'USD',
  allowSubCent: boolean = true
): string {
  if (amount === null || amount === undefined || amount === '') {
    return '$0.00';
  }

  const num = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(num)) {
    return '$0.00';
  }

  // Detect sub-cent pricing (e.g. per-SMS wholesale cost $0.0045)
  const isSubCent = allowSubCent && Math.abs(num) > 0 && Math.abs(num) < 0.01;
  const fractionDigits = isSubCent ? 4 : 2;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(num);
  } catch {
    return `$${num.toFixed(fractionDigits)}`;
  }
}

/**
 * Format an integer or message volume count with thousands separators (e.g. 1,250)
 */
export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '0';
  }

  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) {
    return '0';
  }

  try {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  } catch {
    return String(Math.round(num));
  }
}

/**
 * Format a decimal or ratio as percentage (e.g. 12.5% or 99.2%)
 */
export function formatPercent(
  value: number | string | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined || value === '') {
    return '0.0%';
  }

  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) {
    return '0.0%';
  }

  return `${num.toFixed(decimals)}%`;
}

/**
 * Convert ISO date string to relative human-readable time (e.g. "2m ago", "Just now")
 */
export function formatRelativeTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';

  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';

    const now = Date.now();
    const diffMs = now - date.getTime();
    if (isNaN(diffMs)) return '';

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 45) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return '';
  }
}

/**
 * Format date to standard localized string
 */
export function formatDate(
  dateInput: string | Date | null | undefined,
  includeTime: boolean = false
): string {
  if (!dateInput) return '';

  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      ...(includeTime
        ? {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }
        : {}),
    };

    return date.toLocaleDateString('en-US', options);
  } catch {
    return '';
  }
}
