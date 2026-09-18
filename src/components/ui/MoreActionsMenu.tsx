/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, AlertTriangle, X } from 'lucide-react';

export interface ActionMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  isDangerous?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
}

export interface MoreActionsMenuProps {
  items: ActionMenuItem[];
  ariaLabel?: string;
  align?: 'left' | 'right';
  className?: string;
}

export const MoreActionsMenu: React.FC<MoreActionsMenuProps> = ({
  items,
  ariaLabel = 'Row actions menu',
  align = 'right',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmItem, setConfirmItem] = useState<ActionMenuItem | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmItem) {
          setConfirmItem(null);
        } else if (isOpen) {
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, confirmItem]);

  const standardItems = items.filter((item) => !item.isDangerous);
  const dangerousItems = items.filter((item) => item.isDangerous);

  const handleItemClick = (item: ActionMenuItem) => {
    if (item.disabled) return;

    if (item.isDangerous) {
      setIsOpen(false);
      setConfirmItem(item);
    } else {
      setIsOpen(false);
      item.onClick();
    }
  };

  const handleConfirmAction = () => {
    if (confirmItem) {
      const action = confirmItem.onClick;
      setConfirmItem(null);
      action();
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] border border-transparent hover:border-[var(--glass-border)] transition-all cursor-pointer focus-visible:ring-1 focus-visible:ring-[var(--accent-blue)]"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-30 mt-1 w-48 rounded-xl bg-[var(--bg-surface)] border border-[var(--glass-border)] shadow-xl shadow-black/40 py-1.5 backdrop-blur-xl focus:outline-none animate-in fade-in zoom-in-95 duration-100 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          role="menu"
          aria-orientation="vertical"
        >
          {/* Standard Actions */}
          {standardItems.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={item.disabled}
              onClick={(e) => {
                e.stopPropagation();
                handleItemClick(item);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors text-left ${
                item.disabled
                  ? 'text-[var(--text-disabled)] cursor-not-allowed opacity-50'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg-active)] cursor-pointer'
              }`}
              role="menuitem"
            >
              {item.icon && <span className="w-3.5 h-3.5 shrink-0 opacity-75">{item.icon}</span>}
              <span className="truncate">{item.label}</span>
            </button>
          ))}

          {/* Separator for Dangerous Actions */}
          {dangerousItems.length > 0 && standardItems.length > 0 && (
            <div className="my-1 border-t border-[var(--glass-border)]" />
          )}

          {/* Dangerous / Destructive Actions */}
          {dangerousItems.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={item.disabled}
              onClick={(e) => {
                e.stopPropagation();
                handleItemClick(item);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors text-left ${
                item.disabled
                  ? 'text-[var(--text-disabled)] cursor-not-allowed opacity-50'
                  : 'text-[var(--accent-rose)] hover:text-white hover:bg-[var(--accent-rose-dim)] cursor-pointer'
              }`}
              role="menuitem"
            >
              {item.icon && <span className="w-3.5 h-3.5 shrink-0 text-[var(--accent-rose)]">{item.icon}</span>}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Dangerous Action Confirmation Dialog */}
      {confirmItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-[var(--bg-surface)] border border-[rgba(244,63,94,0.3)] p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[var(--accent-rose-dim)] text-[var(--accent-rose)] shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  {confirmItem.confirmTitle || `Confirm ${confirmItem.label}`}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {confirmItem.confirmMessage ||
                    `Are you sure you want to proceed with this action? This operation may impact platform routing or allocations.`}
                </p>
              </div>
              <button
                onClick={() => setConfirmItem(null)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmItem(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] border border-[var(--glass-border)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-white bg-[var(--accent-rose)] hover:bg-[var(--accent-rose)]/90 shadow-md shadow-[rgba(244,63,94,0.25)] cursor-pointer"
              >
                Confirm {confirmItem.label}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
