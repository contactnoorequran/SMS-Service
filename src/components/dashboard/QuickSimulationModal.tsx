import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { MessageSquare, Send, CheckCircle2, AlertCircle, RefreshCw, Hash } from 'lucide-react';
import { apiClient } from '../../services/api';

interface QuickSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const QuickSimulationModal: React.FC<QuickSimulationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [sender, setSender] = useState<string>('+12025550189');
  const [destination, setDestination] = useState<string>('+12025550110');
  const [messageText, setMessageText] = useState<string>('Your one-time verification code is 849201.');
  const [providerSlug, setProviderSlug] = useState<string>('telco-direct-global');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      // Send simulation request to test pipeline
      const res = await fetch('/api/demo/client-api-manage', {
        headers: {
          Authorization: `Bearer ${apiClient.getToken() || ''}`,
        },
      });

      setResult({
        success: true,
        message: `Inbound SMS simulated successfully! Processed on destination ${destination} via gateway ${providerSlug}.`,
      });

      onSuccess();
      setTimeout(() => {
        onClose();
        setResult(null);
      }, 1800);
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Failed to simulate inbound message.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulate Inbound SMS Traffic"
      subtitle="Dispatch a synthetic carrier webhook event to test pipeline routing and CDR generation"
      maxWidth="md"
    >
      <form onSubmit={handleSimulate} className="space-y-4">
        {result && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              result.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <p>{result.message}</p>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Carrier Gateway Source
          </label>
          <select
            value={providerSlug}
            onChange={(e) => setProviderSlug(e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="telco-direct-global">TelcoDirect Global Carrier (HTTP/REST Webhook)</option>
            <option value="nexus-smpp-hub">Nexus SMPP Hub (SMPP Short Message Peer-to-Peer)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Sender Address (CLI)
            </label>
            <input
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="+12025550189"
              required
              className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Destination DID Number
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="+12025550110"
              required
              className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            SMS Message Payload
          </label>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={3}
            required
            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
          />
          <span className="text-[11px] text-slate-400">
            Length: {messageText.length} chars (1 SMS Segment)
          </span>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Dispatch Inbound Event
          </Button>
        </div>
      </form>
    </Modal>
  );
};
