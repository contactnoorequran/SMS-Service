/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Hash,
  X,
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
  List,
} from 'lucide-react';
import { Button } from '../../ui/Button';

interface BulkImportNumbersModalProps {
  isOpen: boolean;
  onClose: () => void;
  ranges?: Array<{ id: string; name: string }>;
  onImport: (data: {
    rangeId: string;
    mode: 'serial' | 'paste' | 'file';
    startNumber?: string;
    quantity?: number;
    pastedNumbers?: string;
    file?: File;
  }) => Promise<void>;
}

export const BulkImportNumbersModal: React.FC<BulkImportNumbersModalProps> = ({
  isOpen,
  onClose,
  ranges = [],
  onImport,
}) => {
  const [targetRange, setTargetRange] = useState('');
  const [activeTab, setActiveTab] = useState<'serial' | 'paste' | 'file'>('serial');
  const [startNumber, setStartNumber] = useState('');
  const [quantity, setQuantity] = useState('1000');
  const [pastedList, setPastedList] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRange) {
      setError('Please select a target range');
      return;
    }
    if (activeTab === 'serial' && (!startNumber || !quantity)) {
      setError('Please provide start number and quantity');
      return;
    }
    if (activeTab === 'paste' && !pastedList.trim()) {
      setError('Please paste at least one phone number');
      return;
    }
    if (activeTab === 'file' && !selectedFile) {
      setError('Please choose a file to upload');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onImport({
        rangeId: targetRange,
        mode: activeTab,
        startNumber: activeTab === 'serial' ? startNumber : undefined,
        quantity: activeTab === 'serial' ? parseInt(quantity, 10) : undefined,
        pastedNumbers: activeTab === 'paste' ? pastedList : undefined,
        file: activeTab === 'file' ? selectedFile || undefined : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to import numbers');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Modal Header matching Screenshot 2 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-emerald-dim)] border border-[rgba(16,185,129,0.3)] text-[var(--accent-emerald)] flex items-center justify-center">
              <Hash className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Bulk Import / Generate Numbers
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--glass-bg-hover)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          <p className="text-xs text-[var(--text-secondary)]">
            Add numbers using serial generation, a pasted list, or a file upload.
          </p>

          {error && (
            <div className="p-3 rounded-xl bg-[var(--accent-rose-dim)] border border-[rgba(244,63,94,0.3)] text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[var(--accent-rose)]" />
              <span>{error}</span>
            </div>
          )}

          {/* Target Range * */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">
              Target Range <span className="text-[var(--accent-rose)]">*</span>
            </label>
            <select
              value={targetRange}
              onChange={(e) => setTargetRange(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] cursor-pointer"
            >
              <option value="">Type at least 1 character to search by range name...</option>
              {ranges.length > 0 ? (
                ranges.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="range-1">test-for-test (Alaa0)</option>
                  <option value="range-2">Alaa Test (UK)</option>
                </>
              )}
            </select>
          </div>

          {/* 3 Mode Tabs matching Screenshot 2 */}
          <div className="flex items-center gap-4 border-b border-[var(--glass-border)] pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('serial')}
              className={`flex items-center gap-2 pb-2 text-xs font-semibold cursor-pointer transition-all border-b-2 ${
                activeTab === 'serial'
                  ? 'border-[var(--accent-emerald)] text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="font-mono">123</span> Serial Generator
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`flex items-center gap-2 pb-2 text-xs font-semibold cursor-pointer transition-all border-b-2 ${
                activeTab === 'paste'
                  ? 'border-[var(--accent-emerald)] text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Paste List
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`flex items-center gap-2 pb-2 text-xs font-semibold cursor-pointer transition-all border-b-2 ${
                activeTab === 'file'
                  ? 'border-[var(--accent-emerald)] text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Upload File
            </button>
          </div>

          {/* Tab 1: Serial Generator */}
          {activeTab === 'serial' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  Start Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 445555590000"
                  value={startNumber}
                  onChange={(e) => setStartNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  placeholder="1000"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Paste List */}
          {activeTab === 'paste' && (
            <div className="space-y-2 pt-2">
              <label className="text-[11px] font-semibold text-[var(--text-secondary)]">
                Paste Phone Numbers (one per line)
              </label>
              <textarea
                rows={5}
                placeholder="445555590001&#10;445555590002&#10;445555590003"
                value={pastedList}
                onChange={(e) => setPastedList(e.target.value)}
                className="w-full p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-xs font-mono text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--brand-primary)]"
              />
            </div>
          )}

          {/* Tab 3: Upload File */}
          {activeTab === 'file' && (
            <div className="space-y-2 pt-2">
              <label className="text-[11px] font-semibold text-[var(--text-secondary)]">
                Choose CSV or TXT File
              </label>
              <div className="border-2 border-dashed border-[var(--glass-border)] bg-[var(--input-bg-subtle)] rounded-xl p-6 text-center hover:border-[var(--brand-primary)] transition-colors">
                <Upload className="w-8 h-8 text-[var(--accent-emerald)] mx-auto mb-2" />
                <p className="text-xs text-[var(--text-secondary)] mb-2">
                  {selectedFile ? selectedFile.name : 'Select a .csv or .txt file containing numbers'}
                </p>
                <input
                  type="file"
                  accept=".csv,.txt"
                  id="bulk-file-input"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="bulk-file-input"
                  className="inline-block px-3 py-1.5 rounded-lg bg-[var(--accent-emerald-dim)] text-emerald-700 dark:text-teal-400 hover:bg-[var(--accent-emerald)] hover:text-white text-xs font-semibold cursor-pointer border border-[rgba(16,185,129,0.3)] transition-colors"
                >
                  Browse Files
                </label>
              </div>
            </div>
          )}

          {/* Footer buttons matching Screenshot 2 */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--glass-border)]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="bg-teal-600 hover:bg-teal-500 text-white"
            >
              Import
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
