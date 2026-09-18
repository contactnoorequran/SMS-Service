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
      // Send simulation request to real messaging inbound endpoint
      const res = await fetch('/api/messages/inbound', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiClient.getToken() || ''}`,
        },
        body: JSON.stringify({
          sender,
          destination,
          text: messageText,
          providerSlug,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: Failed to dispatch inbound SMS`);
      }

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
                ? 'bg-[var(--accent-emerald-dim)] border-emerald-200 border-emerald-800 text-emerald-800 text-emerald-200'
                : 'bg-[var(--accent-rose-dim)] border-rose-200 border-rose-800 text-rose-800 text-rose-200'
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)] shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <p>{result.message}</p>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            Carrier Gateway Source
          </label>
          <select
            value={providerSlug}
            onChange={(e) => setProviderSlug(e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)]"
          >
            <option value="telco-direct-global">TelcoDirect Global Carrier (HTTP/REST Webhook)</option>
            <option value="nexus-smpp-hub">Nexus SMPP Hub (SMPP Short Message Peer-to-Peer)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Sender Address (CLI)
            </label>
            <input
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="+12025550189"
              required
              className="w-full text-xs font-mono p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Destination DID Number
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="+12025550110"
              required
              className="w-full text-xs font-mono p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            SMS Message Payload
          </label>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={3}
            required
            className="w-full text-xs p-2.5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] font-mono"
          />
          <span className="text-[11px] text-[var(--text-tertiary)]">
            Length: {messageText.length} chars (1 SMS Segment)
          </span>
        </div>

        <div className="pt-3 border-t border-[var(--glass-border)] flex items-center justify-end gap-2.5">
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
