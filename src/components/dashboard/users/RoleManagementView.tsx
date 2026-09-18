import React, { useState } from 'react';
import { UsersService, ROLE_DEFINITIONS, PERMISSION_GROUPS } from '../../../services/users';
import { RoleDefinition } from '../../../types/users';
import { UserRole, PermissionCode } from '../../../types/auth';
import { Badge } from '../../ui/Badge';
import {
  Shield,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  Users,
  KeyRound,
  Layers,
} from 'lucide-react';

export const RoleManagementView: React.FC = () => {
  const roles = UsersService.fetchRolesWithPermissions();
  const groups = UsersService.fetchPermissionGroups();

  const [expandedMobileRole, setExpandedMobileRole] = useState<UserRole | null>('SUPER_ADMIN');

  const getRoleBadgeVariant = (roleName: UserRole) => {
    switch (roleName) {
      case 'SUPER_ADMIN':
        return 'info';
      case 'MANAGER':
        return 'success';
      case 'AGENT':
        return 'purple';
      case 'CLIENT':
        return 'neutral';
    }
  };

  const isRoleGranted = (role: RoleDefinition, permCode: PermissionCode): boolean => {
    if (role.name === 'SUPER_ADMIN') return true;
    return role.assignedPermissions.includes(permCode);
  };

  return (
    <div className="space-y-6">
      {/* 1. Canonical Roles Overview Row */}
      <div>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--accent-blue)]" />
              <span>Platform Role Profiles & Governance</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Hierarchical RBAC profiles enforcing role escalation boundaries and privilege isolation
            </p>
          </div>
          <span className="text-xs font-mono text-[var(--text-tertiary)]">
            {roles.length} Defined Roles
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="glass-card p-4 flex flex-col justify-between h-full border-[var(--glass-border)]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <Badge variant={getRoleBadgeVariant(role.name)} size="sm">
                    {role.displayName}
                  </Badge>
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                    Rank {role.hierarchyWeight}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed min-h-[48px]">
                  {role.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--glass-border)] grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)] block">Active Users</span>
                  <div className="font-mono font-bold text-[var(--text-primary)] mt-0.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                    <span>{role.userCount}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)] block">Permissions</span>
                  <div className="font-mono font-bold text-[var(--accent-emerald)] mt-0.5 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>
                      {role.name === 'SUPER_ADMIN' ? 'All (*)' : role.assignedPermissions.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Permission Matrix (Desktop Table) */}
      <div className="glass-card p-5 hidden md:block">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--glass-border)] mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--accent-violet)]" />
              <span>Granular Permission Matrix</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Cross-reference of discrete permission grants across canonical platform roles
            </p>
          </div>
          <span className="text-xs font-mono text-[var(--text-tertiary)]">
            Matrix: 21 Permissions × 4 Roles
          </span>
        </div>

        <div className="overflow-x-auto table-scroll-container">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--glass-border)] text-[var(--text-secondary)] uppercase tracking-wider font-semibold text-[11px] bg-[rgba(255,255,255,0.02)]">
                <th className="py-3 px-4 w-1/3">Capability / Permission Code</th>
                {roles.map((r) => (
                  <th key={r.id} className="py-3 px-3 text-center w-1/6">
                    <span className="font-semibold text-[var(--text-primary)]">{r.displayName}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {groups.map((grp) => (
                <React.Fragment key={grp.module}>
                  {/* Module Group Header Row */}
                  <tr className="bg-[var(--glass-bg-active)]/40 font-semibold text-[11px]">
                    <td
                      colSpan={5}
                      className="py-2 px-4 text-[var(--accent-blue)] uppercase tracking-wider"
                    >
                      {grp.displayName} ({grp.module})
                    </td>
                  </tr>

                  {/* Permission Rows */}
                  {grp.permissions.map((perm) => (
                    <tr
                      key={perm.code}
                      className="hover:bg-[var(--glass-bg-hover)] transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-[var(--text-primary)]">{perm.name}</div>
                        <div className="font-mono text-[11px] text-[var(--text-tertiary)]">
                          {perm.code}
                        </div>
                      </td>

                      {roles.map((role) => {
                        const granted = isRoleGranted(role, perm.code);
                        return (
                          <td key={`${role.id}-${perm.code}`} className="py-2.5 px-3 text-center">
                            {granted ? (
                              <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)]">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            ) : (
                              <span className="text-[var(--text-disabled)] font-mono text-sm">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Permission Matrix (Mobile Expandable Accordion) */}
      <div className="glass-card p-4 md:hidden space-y-3">
        <div className="pb-3 border-b border-[var(--glass-border)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Role Permission Grants
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Tap a role to inspect its assigned operational capabilities
          </p>
        </div>

        <div className="space-y-2">
          {roles.map((role) => {
            const isExpanded = expandedMobileRole === role.name;
            return (
              <div
                key={role.id}
                className="border border-[var(--glass-border)] rounded-xl overflow-hidden bg-[var(--glass-bg)]"
              >
                <button
                  type="button"
                  onClick={() => setExpandedMobileRole(isExpanded ? null : role.name)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[var(--glass-bg-hover)] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleBadgeVariant(role.name)} size="sm">
                      {role.displayName}
                    </Badge>
                    <span className="text-xs font-mono text-[var(--text-tertiary)]">
                      {role.name === 'SUPER_ADMIN' ? 'All Grants' : `${role.assignedPermissions.length} Grants`}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[var(--text-tertiary)]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-3.5 pt-0 border-t border-[var(--glass-border)] space-y-3 bg-[rgba(0,0,0,0.15)]">
                    {groups.map((grp) => {
                      const grantedPerms = grp.permissions.filter((p) =>
                        isRoleGranted(role, p.code)
                      );
                      if (grantedPerms.length === 0) return null;

                      return (
                        <div key={grp.module} className="pt-2">
                          <div className="text-[11px] font-semibold text-[var(--accent-blue)] mb-1">
                            {grp.displayName}
                          </div>
                          <div className="space-y-1">
                            {grantedPerms.map((p) => (
                              <div
                                key={p.code}
                                className="flex items-center justify-between text-xs py-1 px-2 rounded bg-[var(--glass-bg)] border border-[var(--glass-border)]"
                              >
                                <span>{p.name}</span>
                                <span className="text-[10px] font-mono text-[var(--accent-emerald)]">
                                  {p.code}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
