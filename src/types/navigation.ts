import { UserRole } from './auth';

export type NavGroup =
  | 'Overview'
  | 'Management'
  | 'Telecom'
  | 'Messaging'
  | 'Finance'
  | 'Platform';

export interface NavItem {
  id: string;
  label: string;
  group: NavGroup;
  iconName: string;
  status: 'active' | 'planned';
  description: string;
  requiredPermission?: string;
  allowedRoles?: UserRole[];
  badge?: string | number;
  badgeVariant?: 'info' | 'success' | 'warning' | 'error' | 'neutral';
  targetTab?: string;
}

export const PLATFORM_NAV_GROUPS: NavGroup[] = [
  'Overview',
  'Management',
  'Telecom',
  'Messaging',
  'Finance',
  'Platform',
];

export const PLATFORM_NAV_ITEMS: NavItem[] = [
  // 1. Overview
  {
    id: 'dashboard',
    label: 'Dashboard',
    group: 'Overview',
    iconName: 'LayoutDashboard',
    status: 'active',
    description: 'Executive overview, real-time telemetry, and platform status',
    targetTab: 'dashboard',
  },

  // 2. Management
  {
    id: 'users',
    label: 'Users',
    group: 'Management',
    iconName: 'Users',
    status: 'active',
    requiredPermission: 'users.view',
    allowedRoles: ['SUPER_ADMIN', 'MANAGER', 'AGENT'],
    description: 'User directory, security roles, and permission assignments',
    targetTab: 'users',
  },
  {
    id: 'managers',
    label: 'Managers',
    group: 'Management',
    iconName: 'UserCheck',
    status: 'active',
    requiredPermission: 'users.view',
    allowedRoles: ['SUPER_ADMIN'],
    description: 'Manager directory, capacity, and agent supervision',
    targetTab: 'managers',
  },
  {
    id: 'agents',
    label: 'Agents',
    group: 'Management',
    iconName: 'UserCog',
    status: 'active',
    requiredPermission: 'agents.view',
    allowedRoles: ['SUPER_ADMIN', 'MANAGER', 'AGENT'],
    description: 'Agent directory, commission rates, and client portfolio allocations',
    targetTab: 'agents',
  },
  {
    id: 'clients',
    label: 'Clients',
    group: 'Management',
    iconName: 'Building2',
    status: 'active',
    requiredPermission: 'clients.view',
    allowedRoles: ['SUPER_ADMIN', 'MANAGER', 'AGENT', 'CLIENT'],
    description: 'Enterprise client tenants, balances, and API credentials',
    targetTab: 'clients',
  },

  // 3. Telecom
  {
    id: 'providers',
    label: 'Providers',
    group: 'Telecom',
    iconName: 'Radio',
    status: 'active',
    requiredPermission: 'providers.view',
    allowedRoles: ['SUPER_ADMIN', 'MANAGER'],
    description: 'Carrier gateways and routing priority',
    targetTab: 'providers',
  },
  {
    id: 'connections',
    label: 'Connections',
    group: 'Telecom',
    iconName: 'Cable',
    status: 'active',
    requiredPermission: 'providers.view',
    allowedRoles: ['SUPER_ADMIN', 'MANAGER'],
    description: 'HTTP REST & SMPP v3.4 carrier trunks',
    targetTab: 'providers',
  },
  {
    id: 'countries',
    label: 'Countries',
    group: 'Telecom',
    iconName: 'Globe',
    status: 'active',
    requiredPermission: 'numbers.view',
    description: 'International dialing codes and destination routing',
    targetTab: 'numbers',
  },
  {
    id: 'operators',
    label: 'Operators',
    group: 'Telecom',
    iconName: 'Server',
    status: 'active',
    requiredPermission: 'numbers.view',
    description: 'Mobile network operators and carrier MCC/MNC codes',
    targetTab: 'numbers',
  },
  {
    id: 'ranges',
    label: 'Number Ranges',
    group: 'Telecom',
    iconName: 'Layers',
    status: 'active',
    requiredPermission: 'numbers.view',
    description: 'E.164 prefixes and allocated wholesale blocks',
    targetTab: 'numbers',
  },
  {
    id: 'numbers',
    label: 'Numbers',
    group: 'Telecom',
    iconName: 'Hash',
    status: 'active',
    requiredPermission: 'numbers.view',
    description: 'Inventory of phone numbers and carrier pools',
    targetTab: 'numbers',
  },
  {
    id: 'assignments',
    label: 'Assignments',
    group: 'Telecom',
    iconName: 'UserCheck',
    status: 'active',
    requiredPermission: 'numbers.view',
    description: 'Active client number allocations and history',
    targetTab: 'numbers',
  },

  // 4. Messaging
  {
    id: 'messages',
    label: 'Messages',
    group: 'Messaging',
    iconName: 'MessageSquare',
    status: 'active',
    requiredPermission: 'sms.view',
    description: 'Real-time inbound SMS stream and delivery receipts',
    targetTab: 'traffic',
  },
  {
    id: 'cdr',
    label: 'CDR',
    group: 'Messaging',
    iconName: 'Receipt',
    status: 'active',
    requiredPermission: 'billing.view',
    description: 'Call Detail Records and carrier wholesale margins',
    targetTab: 'cdr',
  },

  // 5. Finance
  {
    id: 'rates',
    label: 'Rates',
    group: 'Finance',
    iconName: 'Tag',
    status: 'active',
    requiredPermission: 'billing.view',
    description: 'Customer pricing cards and wholesale carrier costs',
    targetTab: 'financials',
  },
  {
    id: 'wallets',
    label: 'Wallets',
    group: 'Finance',
    iconName: 'Wallet',
    status: 'active',
    requiredPermission: 'billing.view',
    description: 'Multi-party prepaid balances and master treasury',
    targetTab: 'financials',
  },
  {
    id: 'transactions',
    label: 'Transactions',
    group: 'Finance',
    iconName: 'DollarSign',
    status: 'active',
    requiredPermission: 'billing.view',
    description: 'Sequential double-entry balance movements',
    targetTab: 'financials',
  },
  {
    id: 'payment-requests',
    label: 'Payment Requests',
    group: 'Finance',
    iconName: 'CreditCard',
    status: 'active',
    requiredPermission: 'billing.view',
    description: 'Invoices, top-up requests, and wire transfers',
    targetTab: 'financials',
  },
  {
    id: 'credit-notes',
    label: 'Credit Notes',
    group: 'Finance',
    iconName: 'FileText',
    status: 'active',
    requiredPermission: 'billing.view',
    description: 'Refund adjustments and customer credits',
    targetTab: 'financials',
  },

  // 6. Platform
  {
    id: 'notifications',
    label: 'Notifications',
    group: 'Platform',
    iconName: 'Bell',
    status: 'active',
    description: 'Real-time system telemetry and security alerts',
    targetTab: 'audit',
  },
  {
    id: 'api',
    label: 'API',
    group: 'Platform',
    iconName: 'Code',
    status: 'active',
    requiredPermission: 'users.view',
    allowedRoles: ['SUPER_ADMIN', 'MANAGER'],
    description: 'REST API endpoints, webhook testing, and developer tokens',
    targetTab: 'diagnostics',
  },
  {
    id: 'reports',
    label: 'Reports',
    group: 'Platform',
    iconName: 'BarChart3',
    status: 'active',
    requiredPermission: 'billing.view',
    description: 'Traffic volume, carrier delivery performance, and revenue reports',
    targetTab: 'cdr',
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    group: 'Platform',
    iconName: 'ShieldCheck',
    status: 'active',
    requiredPermission: 'audit.view',
    allowedRoles: ['SUPER_ADMIN'],
    description: 'Immutable security audit trail and access logs',
    targetTab: 'audit',
  },
  {
    id: 'settings',
    label: 'Settings',
    group: 'Platform',
    iconName: 'Settings',
    status: 'active',
    allowedRoles: ['SUPER_ADMIN'],
    description: 'Global system parameters and platform defaults',
    targetTab: 'settings',
  },
];
