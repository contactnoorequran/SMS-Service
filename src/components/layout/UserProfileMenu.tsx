import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Shield,
  LogOut,
  ChevronDown,
  KeyRound,
  Check,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth, SEED_ACCOUNTS } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

export const UserProfileMenu: React.FC = () => {
  const { user, role, logout, switchUserRole, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!user) {
    return null;
  }

  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  const getRoleBadgeVariant = (r: UserRole) => {
    switch (r) {
      case 'SUPER_ADMIN':
        return 'info';
      case 'MANAGER':
        return 'success';
      case 'AGENT':
        return 'warning';
      case 'CLIENT':
        return 'neutral';
    }
  };

  const rolesList: UserRole[] = ['SUPER_ADMIN', 'MANAGER', 'AGENT', 'CLIENT'];

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          id="btn-user-profile-menu"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 p-1.5 pl-2 pr-2.5 rounded-xl border border-[var(--glass-border)] hover:bg-[var(--glass-bg)] hover:border-[var(--glass-border-hover)] transition-all text-left"
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-[0_0_12px_var(--accent-blue-dim)]">
            {getInitials()}
          </div>

          <div className="hidden sm:block min-w-0">
            <div className="text-xs font-semibold text-[var(--text-primary)] leading-tight truncate">
              {user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.email}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] leading-tight font-medium">
              {user.role.displayName}
            </div>
          </div>

          <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)] ml-0.5" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-[var(--bg-surface)] border border-[var(--glass-border)] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-50 overflow-hidden animate-fade-in backdrop-blur-xl">
            {/* Header info */}
            <div className="p-4 border-b border-[var(--glass-border)] bg-[rgba(0,0,0,0.15)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-[0_0_16px_var(--accent-blue-dim)]">
                  {getInitials()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                    {user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Administrator'}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)] font-mono truncate">
                    {user.email}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge variant={getRoleBadgeVariant(role)} size="sm">
                      {user.role.displayName}
                    </Badge>
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-emerald)] animate-pulse-dot" title="Active session" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick RBAC Switcher */}
            <div className="p-3 border-b border-[var(--glass-border)]">
              <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[var(--accent-blue)]" />
                  <span>Switch Role (Preview)</span>
                </span>
                <span className="font-mono text-[10px] text-[var(--text-tertiary)]">RBAC</span>
              </div>

              <div className="space-y-1">
                {rolesList.map((r) => {
                  const isCurrent = role === r;
                  const account = SEED_ACCOUNTS[r];
                  return (
                    <button
                      key={r}
                      disabled={isLoading}
                      onClick={() => {
                        switchUserRole(r);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all text-left ${
                        isCurrent
                          ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] font-semibold border border-[rgba(59,130,246,0.2)]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="truncate">{account.title}</div>
                        <div className="text-[10px] text-[var(--text-tertiary)] font-normal truncate">
                          {account.email}
                        </div>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-[var(--accent-blue)] shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Permissions & Security Actions */}
            <div className="p-2 space-y-0.5 border-b border-[var(--glass-border)] text-xs">
              <button
                onClick={() => {
                  setShowPermissionsModal(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] rounded-lg transition-colors text-left"
              >
                <KeyRound className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                <span>View My Permissions ({user.permissions.length})</span>
              </button>

              <div className="flex items-center gap-2.5 px-3 py-1.5 text-[var(--text-tertiary)] text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                <span>Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleTimeString() : 'Recently'}</span>
              </div>
            </div>

            {/* Logout Action */}
            <div className="p-2">
              <button
                id="btn-logout"
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[var(--accent-rose)] hover:bg-[var(--accent-rose-dim)] rounded-lg transition-colors text-xs font-medium text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Permissions Dialog Modal */}
      <Modal
        isOpen={showPermissionsModal}
        onClose={() => setShowPermissionsModal(false)}
        title={`${user.role.displayName} Permissions`}
        subtitle={`Active security privileges associated with ${user.email}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-[var(--glass-bg)] rounded-xl border border-[var(--glass-border)] flex items-center gap-3">
            <Shield className="w-5 h-5 text-[var(--accent-blue)] shrink-0" />
            <div className="text-xs">
              <div className="font-semibold text-[var(--text-primary)]">
                Security Profile: {user.role.displayName}
              </div>
              <p className="text-[var(--text-secondary)] mt-0.5">
                Role ID: <code className="font-mono text-[11px]">{user.role.id}</code>
              </p>
            </div>
          </div>

          <div>
            <h5 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
              Granted Privileges ({user.permissions.includes('*') ? 'All Wildcard (*)' : user.permissions.length})
            </h5>
            <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-1">
              {user.permissions.map((perm) => (
                <span
                  key={perm}
                  className="px-2.5 py-1 bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] border border-[rgba(59,130,246,0.2)] rounded-md font-mono text-[11px]"
                >
                  {perm}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
