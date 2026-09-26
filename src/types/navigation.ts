import { UserRole } from './auth';

export type NavGroup =
  // Common / Agent groups
  | 'Main'
  | 'SMS Module'
  | 'SMS Test Panel'
  | 'Users'
  | 'Stats & Finance'
  | 'Account'
  // Super Admin groups
  | 'Overview'
  | 'Telecom & Gateways'
  | 'User Directory'
  | 'Inventory & Routing'
  | 'Financials & CDR'
  | 'System'
  // Manager groups
  | 'Team Management'
  | 'Operations & Approvals'
  // Client groups
  | 'My SMS Numbers'
  | 'API & Webhooks'
  | 'Billing';

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

// ─────────────────────────────────────────────────────────────────────────────
// 1. AGENT NAVIGATION (IMS SMS Portal)
// ─────────────────────────────────────────────────────────────────────────────
export const AGENT_NAV_GROUPS: NavGroup[] = [
  'Main',
  'SMS Module',
  'SMS Test Panel',
  'Users',
  'Stats & Finance',
  'Account',
];

export const AGENT_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    group: 'Main',
    iconName: 'LayoutDashboard',
    status: 'active',
    description: 'SMS earnings overview, volume chart and top ranges',
    targetTab: 'dashboard',
    allowedRoles: ['AGENT'],
  },
  {
    id: 'sms-ranges',
    label: 'SMS Ranges',
    group: 'SMS Module',
    iconName: 'Layers',
    status: 'active',
    description: 'Browse available prefixes, request free ranges or ask support',
    targetTab: 'sms-ranges',
    allowedRoles: ['AGENT'],
  },
  {
    id: 'cli-search',
    label: 'CLI Search',
    group: 'SMS Module',
    iconName: 'Search',
    status: 'active',
    description: 'Search by sender CLI or message text across active ranges',
    targetTab: 'cli-search',
    allowedRoles: ['AGENT'],
  },
  {
    id: 'my-numbers',
    label: 'My Numbers',
    group: 'SMS Module',
    iconName: 'Hash',
    status: 'active',
    description: 'Your number inventory: allocate, unassign, or return numbers',
    targetTab: 'my-numbers',
    allowedRoles: ['AGENT'],
  },
  {
    id: 'bulk-add',
    label: 'Bulk Add',
    group: 'SMS Module',
    iconName: 'Plus',
    status: 'active',
    description: 'Queue bulk number assignments across multiple ranges',
    targetTab: 'bulk-add',
    allowedRoles: ['AGENT'],
  },
  {
    id: 'sms-test-panel',
    label: 'SMS Test Panel',
    group: 'SMS Test Panel',
    iconName: 'Radio',
    status: 'active',
    description: 'Test numbers and live inbound SMS stream',
    targetTab: 'sms-test-panel',
    allowedRoles: ['AGENT'],
  },
  {
    id: 'my-clients',
    label: 'My Clients',
    group: 'Users',
    iconName: 'Users',
    status: 'active',
    description: 'View and manage your assigned client accounts',
    targetTab: 'my-clients',
    allowedRoles: ['AGENT'],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    group: 'Users',
    iconName: 'Bell',
    status: 'active',
    description: 'Your inbox and sent notification history',
    targetTab: 'notifications',
    allowedRoles: ['AGENT'],
  },
  {
    id: 'cdr-statistics',
    label: 'CDR & Statistics',
    group: 'Stats & Finance',
    iconName: 'BarChart3',
    status: 'active',
    description: 'Call detail records and SMS traffic statistics',
    targetTab: 'cdr-statistics',
    allowedRoles: ['AGENT'],
  },
  {
    id: 'credit-notes',
    label: 'Credit Notes',
    group: 'Stats & Finance',
    iconName: 'FileText',
    status: 'active',
    description: 'Your refund adjustments and agent credits',
    targetTab: 'credit-notes',
    allowedRoles: ['AGENT'],
  },
  {
    id: 'payment-requests',
    label: 'Payment Requests',
    group: 'Stats & Finance',
    iconName: 'CreditCard',
    status: 'active',
    description: 'Submit and track payment and top-up requests',
    targetTab: 'payment-requests',
    allowedRoles: ['AGENT'],
  },
  {
    id: 'rest-api',
    label: 'REST API',
    group: 'Account',
    iconName: 'Code',
    status: 'active',
    description: 'Your API keys, webhooks, and developer tokens',
    targetTab: 'rest-api',
    allowedRoles: ['AGENT'],
  },
  {
    id: 'profile-settings',
    label: 'Profile Settings',
    group: 'Account',
    iconName: 'Settings',
    status: 'active',
    description: 'Update your profile, password and preferences',
    targetTab: 'profile-settings',
    allowedRoles: ['AGENT'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. SUPER ADMIN NAVIGATION (Telecom Operations Platform)
// ─────────────────────────────────────────────────────────────────────────────
export const ADMIN_NAV_GROUPS: NavGroup[] = [
  'Overview',
  'Telecom & Gateways',
  'User Directory',
  'Inventory & Routing',
  'Financials & CDR',
  'System',
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Executive Overview',
    group: 'Overview',
    iconName: 'LayoutDashboard',
    status: 'active',
    description: 'Telecommunications throughput, gateway binds & ledger summary',
    targetTab: 'dashboard',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'providers',
    label: 'Providers & Gateways',
    group: 'Telecom & Gateways',
    iconName: 'Server',
    status: 'active',
    description: 'SMPP binds, HTTP carrier connections & failover routes',
    targetTab: 'providers',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'users',
    label: 'All Users',
    group: 'User Directory',
    iconName: 'Users',
    status: 'active',
    description: 'Global user identity list and RBAC role assignments',
    targetTab: 'users',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'managers',
    label: 'Managers',
    group: 'User Directory',
    iconName: 'UserCheck',
    status: 'active',
    description: 'Manager accounts, team capacity and agent assignments',
    targetTab: 'managers',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'agents',
    label: 'Agents',
    group: 'User Directory',
    iconName: 'UserCog',
    status: 'active',
    description: 'Agent roster, commission structures and allocated quotas',
    targetTab: 'agents',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'clients',
    label: 'Clients',
    group: 'User Directory',
    iconName: 'Building2',
    status: 'active',
    description: 'Client organizations, leased pools and account balances',
    targetTab: 'clients',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'numbers',
    label: 'Number Inventory',
    group: 'Inventory & Routing',
    iconName: 'Hash',
    status: 'active',
    description: 'Global number inventory, ranges, prefixes and carrier routes',
    targetTab: 'numbers',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'traffic',
    label: 'Live Traffic',
    group: 'Inventory & Routing',
    iconName: 'MessageSquare',
    status: 'active',
    description: 'Real-time SMS dispatch feed, queuing, and delivery receipts',
    targetTab: 'traffic',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'cdr',
    label: 'CDR Logs',
    group: 'Financials & CDR',
    iconName: 'Receipt',
    status: 'active',
    description: 'Carrier call detail records and telemetry verification',
    targetTab: 'cdr',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'financials',
    label: 'Billing & Wallets',
    group: 'Financials & CDR',
    iconName: 'Wallet',
    status: 'active',
    description: 'Double-entry transaction ledger, balances and invoices',
    targetTab: 'financials',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'audit',
    label: 'Audit Trail',
    group: 'System',
    iconName: 'ShieldCheck',
    status: 'active',
    description: 'Immutable security log of administrative actions',
    targetTab: 'audit',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'diagnostics',
    label: 'System Diagnostics',
    group: 'System',
    iconName: 'Radio',
    status: 'active',
    description: 'API latency, telemetry health, and endpoint tester',
    targetTab: 'diagnostics',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'database-schema',
    label: 'Database Schema',
    group: 'System',
    iconName: 'Code',
    status: 'active',
    description: 'Live PostgreSQL schema explorer and entity relations',
    targetTab: 'database-schema',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'settings',
    label: 'Platform Settings',
    group: 'System',
    iconName: 'Settings',
    status: 'active',
    description: 'Security policies, rate limits, and system parameters',
    targetTab: 'settings',
    allowedRoles: ['SUPER_ADMIN'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. MANAGER NAVIGATION (Manager Ops & Team Oversight)
// ─────────────────────────────────────────────────────────────────────────────
export const MANAGER_NAV_GROUPS: NavGroup[] = [
  'Overview',
  'Team Management',
  'Operations & Approvals',
  'Account',
];

export const MANAGER_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Manager Overview',
    group: 'Overview',
    iconName: 'LayoutDashboard',
    status: 'active',
    description: 'Team performance, pending approvals queue, and monthly volume',
    targetTab: 'dashboard',
    allowedRoles: ['MANAGER'],
  },
  {
    id: 'managers-team',
    label: 'My Team',
    group: 'Team Management',
    iconName: 'Users',
    status: 'active',
    description: 'Assigned agents and allocated client accounts',
    targetTab: 'managers-team',
    allowedRoles: ['MANAGER'],
  },
  {
    id: 'manager-approvals',
    label: 'Approvals Queue',
    group: 'Operations & Approvals',
    iconName: 'CheckCircle2',
    status: 'active',
    description: 'Review and approve client deposits & agent payout requests',
    targetTab: 'manager-approvals',
    allowedRoles: ['MANAGER'],
  },
  {
    id: 'sms-ranges',
    label: 'Allocated Ranges',
    group: 'Operations & Approvals',
    iconName: 'Layers',
    status: 'active',
    description: 'Inspect prefix pools and range quotas assigned to your team',
    targetTab: 'sms-ranges',
    allowedRoles: ['MANAGER'],
  },
  {
    id: 'cdr-statistics',
    label: 'Team CDR Stats',
    group: 'Operations & Approvals',
    iconName: 'BarChart3',
    status: 'active',
    description: 'SMS traffic and delivery statistics across your team',
    targetTab: 'cdr-statistics',
    allowedRoles: ['MANAGER'],
  },
  {
    id: 'notifications',
    label: 'Team Broadcasts',
    group: 'Operations & Approvals',
    iconName: 'Bell',
    status: 'active',
    description: 'Broadcast alerts and communications to team agents',
    targetTab: 'notifications',
    allowedRoles: ['MANAGER'],
  },
  {
    id: 'profile-settings',
    label: 'Manager Profile',
    group: 'Account',
    iconName: 'Settings',
    status: 'active',
    description: 'Update your manager credentials and preferences',
    targetTab: 'profile-settings',
    allowedRoles: ['MANAGER'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 4. CLIENT NAVIGATION (Customer Self-Service Portal)
// ─────────────────────────────────────────────────────────────────────────────
export const CLIENT_NAV_GROUPS: NavGroup[] = [
  'Overview',
  'My SMS Numbers',
  'API & Webhooks',
  'Billing',
  'Account',
];

export const CLIENT_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Client Overview',
    group: 'Overview',
    iconName: 'LayoutDashboard',
    status: 'active',
    description: 'Active leased numbers, inbound OTP rate, and wallet balance',
    targetTab: 'dashboard',
    allowedRoles: ['CLIENT'],
  },
  {
    id: 'client-numbers',
    label: 'Leased Numbers',
    group: 'My SMS Numbers',
    iconName: 'Hash',
    status: 'active',
    description: 'Your leased phone numbers, expiry dates, and lease renewal',
    targetTab: 'client-numbers',
    allowedRoles: ['CLIENT'],
  },
  {
    id: 'client-inbound',
    label: 'Live OTP Stream',
    group: 'My SMS Numbers',
    iconName: 'Radio',
    status: 'active',
    description: 'Live real-time feed of received SMS & 1-click OTP copying',
    targetTab: 'client-inbound',
    allowedRoles: ['CLIENT'],
  },
  {
    id: 'client-webhooks',
    label: 'Webhooks & Ping',
    group: 'API & Webhooks',
    iconName: 'Cable',
    status: 'active',
    description: 'Configure endpoint URL, secret key and simulate webhook pings',
    targetTab: 'client-webhooks',
    allowedRoles: ['CLIENT'],
  },
  {
    id: 'rest-api',
    label: 'API Keys & Docs',
    group: 'API & Webhooks',
    iconName: 'Code',
    status: 'active',
    description: 'Client REST API endpoints, authorization tokens, and code snippets',
    targetTab: 'rest-api',
    allowedRoles: ['CLIENT'],
  },
  {
    id: 'client-wallet',
    label: 'Wallet & Deposits',
    group: 'Billing',
    iconName: 'Wallet',
    status: 'active',
    description: 'Current funds, request deposit top-up, and invoice statements',
    targetTab: 'client-wallet',
    allowedRoles: ['CLIENT'],
  },
  {
    id: 'profile-settings',
    label: 'Account Profile',
    group: 'Account',
    iconName: 'Settings',
    status: 'active',
    description: 'Company information, notification preferences and password',
    targetTab: 'profile-settings',
    allowedRoles: ['CLIENT'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Helper Functions
// ─────────────────────────────────────────────────────────────────────────────
export function getNavGroupsForRole(role: UserRole): NavGroup[] {
  switch (role) {
    case 'SUPER_ADMIN':
      return ADMIN_NAV_GROUPS;
    case 'MANAGER':
      return MANAGER_NAV_GROUPS;
    case 'AGENT':
      return AGENT_NAV_GROUPS;
    case 'CLIENT':
      return CLIENT_NAV_GROUPS;
    default:
      return AGENT_NAV_GROUPS;
  }
}

export function getNavItemsForRole(role: UserRole): NavItem[] {
  switch (role) {
    case 'SUPER_ADMIN':
      return ADMIN_NAV_ITEMS;
    case 'MANAGER':
      return MANAGER_NAV_ITEMS;
    case 'AGENT':
      return AGENT_NAV_ITEMS;
    case 'CLIENT':
      return CLIENT_NAV_ITEMS;
    default:
      return AGENT_NAV_ITEMS;
  }
}

// Backward compatibility exports
export const PLATFORM_NAV_GROUPS = AGENT_NAV_GROUPS;
export const PLATFORM_NAV_ITEMS = AGENT_NAV_ITEMS;
