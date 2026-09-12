import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { ManagerListItem, UpdateManagerDTO } from '../../../types/manager';
import { AlertCircle } from 'lucide-react';

interface EditManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: ManagerListItem | null;
  onSubmit: (id: string, data: UpdateManagerDTO) => Promise<void>;
  departments: string[];
}

export const EditManagerModal: React.FC<EditManagerModalProps> = ({
  isOpen,
  onClose,
  manager,
  onSubmit,
  departments,
}) => {
  const [formData, setFormData] = useState<UpdateManagerDTO>({
    firstName: '',
    lastName: '',
    username: '',
    contact: '',
    department: '',
    maxAgents: 50,
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (manager) {
      setFormData({
        firstName: manager.firstName,
        lastName: manager.lastName,
        username: manager.username,
        contact: manager.contact,
        department: manager.department,
        maxAgents: manager.maxAgents,
      });
      setError(null);
    }
  }, [manager]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manager) return;
    setError(null);

    if (!formData.username || formData.username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(manager.id, formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update manager profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!manager) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Manager Profile"
      subtitle={`Update credentials and department settings for ${manager.name}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-lg flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs space-y-1">
          <div className="text-slate-500">Corporate Email (Immutable)</div>
          <div className="font-mono font-medium text-slate-800 dark:text-slate-200">{manager.email}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              First Name *
            </label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Username *
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Contact Phone *
            </label>
            <input
              type="tel"
              required
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Department *
            </label>
            <input
              type="text"
              required
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Max Agents Limit
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={formData.maxAgents}
              onChange={(e) => setFormData({ ...formData, maxAgents: parseInt(e.target.value) || 50 })}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
