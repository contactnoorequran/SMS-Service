import { UserRole } from './auth';

export interface NavItem {
  id: string;
  label: string;
  phase: string;
  iconName: string;
  status: 'active' | 'planned';
  description: string;
  requiredPermission?: string;
  allowedRoles?: UserRole[];
  category?: 'core' | 'operations' | 'management' | 'system';
}

export const PLATFORM_NAV_ITEMS: NavItem[] = [
  // Core Platform
  {
    id: 'dashboard',
    label: 'Admin Dashboard',
    phase: 'Phase 04',
    iconName: 'LayoutDashboard',
    status: 'active',
    category: 'core',
    description: 'Executive KPIs, SMS throughput, revenue analytics, provider health, and number inventory',
  },
  {
    id: 'numbers',
    label: 'Ranges & Numbers',
    phase: 'Phase 04',
    iconName: 'Hash',
    status: 'active',
    category: 'operations',
    requiredPermission: 'numbers.view',
    description: 'Inventory of E.164 phone numbers, pool allocations, and client assignments',
  },
  {
    id: 'providers',
    label: 'SMS Providers',
    phase: 'Phase 05',
    iconName: 'Radio',
    status: 'planned',
    category: 'operations',
    requiredPermission: 'providers.view',
    allowedRoles: ['SUPER_ADMIN', 'MANAGER'],
    description: 'Multi-carrier HTTP/REST and SMPP gateway connections and routing priority',
  },
  {
    id: 'traffic',
    label: 'SMS & CDR Records',
    phase: 'Phase 06',
    iconName: 'MessageSquare',
    status: 'planned',
    category: 'operations',
    requiredPermission: 'sms.view',
    description: 'Real-time inbound SMS stream, message statuses, and Call Detail Records',
  },
  {
    id: 'financials',
    label: 'Rates & Balances',
    phase: 'Phase 07',
    iconName: 'DollarSign',
    status: 'planned',
    category: 'management',
    requiredPermission: 'billing.view',
    description: 'Platform ledger, wallet recharges, provider costs, and agent commissions',
  },
  {
    id: 'managers',
    label: 'Manager Management',
    phase: 'Phase 05',
    iconName: 'UserCheck',
    status: 'active',
    category: 'management',
    requiredPermission: 'users.view',
    allowedRoles: ['SUPER_ADMIN'],
    description: 'Super Admin complete Manager oversight, agent hierarchies, client allocations, security, and permissions',
  },
  {
    id: 'agents',
    label: 'Agent Management',
    phase: 'Phase 06',
    iconName: 'Users',
    status: 'active',
    category: 'management',
    requiredPermission: 'agents.view',
    allowedRoles: ['SUPER_ADMIN', 'MANAGER', 'AGENT'],
    description: 'Agent directory, search, filters, pagination, profile edits, status toggle, manager assignments, clients, inventory, and stats',
  },
  {
    id: 'clients',
    label: 'Client Management',
    phase: 'Phase 07',
    iconName: 'Building2',
    status: 'active',
    category: 'management',
    requiredPermission: 'clients.view',
    allowedRoles: ['SUPER_ADMIN', 'MANAGER', 'AGENT', 'CLIENT'],
    description: 'Enterprise client list, search, filter, pagination, lifecycle toggle, numbers, SMS statistics, balance, and API credentials',
  },
  {
    id: 'users',
    label: 'Users & RBAC',
    phase: 'Phase 03',
    iconName: 'Users',
    status: 'active',
    category: 'management',
    requiredPermission: 'users.view',
    allowedRoles: ['SUPER_ADMIN', 'MANAGER', 'AGENT'],
    description: 'Super Admin, Managers, Agents, Client accounts, and granular permission matrices',
  },
  {
    id: 'audit',
    label: 'Security & Audit Logs',
    phase: 'Phase 08',
    iconName: 'ShieldCheck',
    status: 'active',
    category: 'system',
    requiredPermission: 'audit.view',
    allowedRoles: ['SUPER_ADMIN'],
    description: 'Immutable security audit trail, session events, and access logs',
  },
  {
    id: 'database-schema',
    label: 'Database Architecture',
    phase: 'Phase 02',
    iconName: 'Database',
    status: 'active',
    category: 'system',
    allowedRoles: ['SUPER_ADMIN'],
    description: 'Normalized PostgreSQL schema, 28 entities, and ERD relationship inspector',
  },
  {
    id: 'diagnostics',
    label: 'System Diagnostics',
    phase: 'Phase 01',
    iconName: 'Activity',
    status: 'active',
    category: 'system',
    allowedRoles: ['SUPER_ADMIN', 'MANAGER'],
    description: 'REST API health checks, latencies, and PostgreSQL connectivity',
  },
  {
    id: 'architecture',
    label: 'Platform Roadmap',
    phase: 'Phase 01 & 02',
    iconName: 'Layers',
    status: 'active',
    category: 'system',
    allowedRoles: ['SUPER_ADMIN', 'MANAGER', 'AGENT'],
    description: 'Full modular architecture roadmap and implementation phases',
  },
];
