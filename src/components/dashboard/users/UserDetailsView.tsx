import React from 'react';
import { UserItem, UserStatus } from '../../../types/users';
import { PERMISSION_GROUPS } from '../../../services/users';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { formatRelativeTime, formatDate } from '../../../utils/formatters';
import {
  ArrowLeft,
  Shield,
  Clock,
  Calendar,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ChevronRight,
} from 'lucide-react';

interface UserDetailsViewProps {
  user: UserItem;
  onBack: () => void;
  onRequestStatusChange: (user: UserItem, targetStatus: UserStatus) => void;
}

export const UserDetailsView: React.FC<UserDetailsViewProps> = ({
  user,
  onBack,
  onRequestStatusChange,
}) => {
  const getStatusBadgeVariant = (s: UserStatus) => {
    switch (s) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'SUSPENDED':
      case 'DISABLED':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'info';
      case 'MANAGER':
        return 'success';
      case 'AGENT':
        return 'purple';
      default:
        return 'neutral';
    }
  };

  const isUserGranted = (permCode: string) => {
    if (user?.role?.name === 'SUPER_ADMIN') return true;
    const perms = Array.isArray(user?.permissions) ? user.permissions : [];
    if (perms.includes('*')) return true;
    return perms.includes(permCode);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 glass-card border-[rgba(59,130,246,0.15)]">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] mb-1.5">
            <button
              type="button"
              onClick={onBack}
              className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              Platform
            </button>
            <ChevronRight className="w-3 h-3 opacity-60" />
            <button
              type="button"
              onClick={onBack}
              className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              Users
            </button>
            <ChevronRight className="w-3 h-3 opacity-60" />
            <span className="text-[var(--text-primary)] font-medium truncate max-w-[180px]">
              {user.name}
            </span>
          </nav>

          <div className="flex items-center gap-3 mt-1">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] font-bold flex items-center justify-center text-sm shrink-0 border border-[rgba(59,130,246,0.2)]">
              {user?.name?.[0] || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                  {user.name}
                </h1>
                <Badge variant={getStatusBadgeVariant(user.status)} size="sm">
                  {user.status}
                </Badge>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-mono">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back to Users
          </Button>

          {user.status === 'ACTIVE' ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onRequestStatusChange(user, 'SUSPENDED')}
            >
              Suspend Account
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onRequestStatusChange(user, 'ACTIVE')}
            >
              Activate Account
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Identity & Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Identity Card */}
        <div className="md:col-span-2 glass-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--glass-border)]">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--accent-blue)]" />
              <span>Identity & Account Specifications</span>
            </h2>
            <span className="text-[11px] font-mono text-[var(--text-tertiary)]">ID: {user.id}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
              <div className="flex items-center gap-2 text-[var(--text-tertiary)] mb-1">
                <Mail className="w-3.5 h-3.5" />
                <span>Primary Email</span>
              </div>
              <div className="font-mono font-semibold text-[var(--text-primary)] truncate">
                {user.email}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
              <div className="flex items-center gap-2 text-[var(--text-tertiary)] mb-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>Department / Tenant</span>
              </div>
              <div className="font-semibold text-[var(--text-primary)] truncate">
                {user.department || 'General Operations'}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
              <div className="flex items-center gap-2 text-[var(--text-tertiary)] mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Provisioned On</span>
              </div>
              <div className="font-mono text-[var(--text-primary)]">
                {formatDate(user.createdAt, true)}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
              <div className="flex items-center gap-2 text-[var(--text-tertiary)] mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Last Session Activity</span>
              </div>
              <div className="font-mono text-[var(--text-primary)]">
                {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : 'Never logged in'}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Role Assignment Card */}
        <div className="glass-card p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--glass-border)]">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[var(--accent-violet)]" />
                <span>Assigned RBAC Role</span>
              </h2>
            </div>

            <div className="mt-4">
              <Badge variant={getRoleBadgeVariant(user?.role?.name || '')} size="lg">
                <Shield className="w-4 h-4 mr-1.5 inline" />
                <span>{user?.role?.displayName || user?.role?.name || 'Standard User'}</span>
              </Badge>
              <p className="text-xs text-[var(--text-secondary)] mt-3 leading-relaxed">
                {user?.role?.name === 'SUPER_ADMIN'
                  ? 'Root governance role with unrestricted access to all telephony routes, financial clearing, and security audits.'
                  : user?.role?.name === 'MANAGER'
                  ? 'Operations role with oversight over carrier trunks, agent hierarchies, and number inventory.'
                  : user?.role?.name === 'AGENT'
                  ? 'Partner role managing assigned client accounts, inventory leases, and portfolio commissions.'
                  : 'Enterprise tenant account authorized to lease numbers and consume inbound SMS streams.'}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--glass-border)] text-[11px] font-mono text-[var(--text-tertiary)]">
            <span>Privilege Scope: </span>
            <strong className="text-[var(--text-primary)]">
              {user?.role?.name === 'SUPER_ADMIN' ? 'Wildcard (*)' : `${user?.permissions?.length || 0} Grants`}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. Effective Permissions Grouped by Module */}
      <div className="glass-card p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--glass-border)]">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Effective Permission Grants
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Granular capabilities authorized for this identity across operational subsystems
            </p>
          </div>
          <span className="text-xs font-mono text-[var(--text-tertiary)]">
            {user?.role?.name === 'SUPER_ADMIN' ? 'All Permissions Enabled (*)' : 'Module-Scoped Authorization'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PERMISSION_GROUPS.map((group) => {
            const grantedCount = group.permissions.filter((p) => isUserGranted(p.code)).length;
            return (
              <div
                key={group.module}
                className="p-4 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      {group.displayName}
                    </span>
                    <Badge
                      variant={grantedCount === group.permissions.length ? 'success' : grantedCount > 0 ? 'info' : 'neutral'}
                      size="sm"
                    >
                      {grantedCount} / {group.permissions.length}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] mb-3 leading-relaxed">
                    {group.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[var(--glass-border)]">
                  {group.permissions.map((p) => {
                    const hasPerm = isUserGranted(p.code);
                    return (
                      <div
                        key={p.code}
                        className="flex items-center justify-between text-[11px] font-mono py-1 px-1.5 rounded hover:bg-[var(--glass-bg-active)] transition-colors"
                      >
                        <span className={hasPerm ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-disabled)]'}>
                          {p.code}
                        </span>
                        {hasPerm ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-emerald)] shrink-0" />
                        ) : (
                          <span className="text-[10px] text-[var(--text-disabled)]">Disabled</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
