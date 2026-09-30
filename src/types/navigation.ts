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
  | 'Operations'
  | 'Management'
  | 'Reports'
  | 'Wholesale Customers'
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
// 1. AGENT NAVIGATION (WORLD SMS SERVICE Agent Portal)
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
    iconName: 'number-inventory',
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
    iconName: 'sms-gateway',
    status: 'active',
    description: 'Zero-credential test panel for numbers and live inbound SMS stream',
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
    iconName: 'cdr',
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
  'Operations',
  'Management',
  'Reports',
  'Wholesale Customers',
  'System',
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  // ── Overview ──
  {
    id: 'dashboard',
    label: 'Operations Overview',
    group: 'Overview',
    iconName: 'LayoutDashboard',
    status: 'active',
    description: 'Live platform performance across SMS, numbers, and earnings',
    targetTab: 'dashboard',
    allowedRoles: ['SUPER_ADMIN'],
  },

  // ── Operations ──
  {
    id: 'providers',
    label: 'Providers',
    group: 'Operations',
    iconName: 'smpp',
    status: 'active',
    description: 'Manage HTTP and SMPP providers, connection status, and inbound webhooks',
    targetTab: 'providers',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'ranges',
    label: 'Ranges',
    group: 'Operations',
    iconName: 'Layers',
    status: 'active',
    description: 'Manage traffic ranges, payout rates, daily caps, and custom price sync',
    targetTab: 'ranges',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'numbers',
    label: 'Numbers',
    group: 'Operations',
    iconName: 'number-inventory',
    status: 'active',
    description: 'Search, filter, assign, and manage the full number inventory',
    targetTab: 'numbers',
    allowedRoles: ['SUPER_ADMIN'],
  },

  // ── Management ──
  {
    id: 'users',
    label: 'Users',
    group: 'Management',
    iconName: 'Users',
    status: 'active',
    description: 'Global user identity list, credentials, and RBAC permissions',
    targetTab: 'users',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'clients',
    label: 'Clients',
    group: 'Management',
    iconName: 'Building2',
    status: 'active',
    description: 'Client organizations, leased numbers, and account profiles',
    targetTab: 'clients',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'withdrawals',
    label: 'Withdrawals',
    group: 'Management',
    iconName: 'CreditCard',
    status: 'active',
    description: 'Member payout requests, approval status, and ledger records',
    targetTab: 'payment-requests',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'notifications',
    label: 'News',
    group: 'Management',
    iconName: 'Bell',
    status: 'active',
    description: 'Platform announcements, news, and member notifications',
    targetTab: 'notifications',
    allowedRoles: ['SUPER_ADMIN'],
  },

  // ── Reports ──
  {
    id: 'traffic',
    label: 'SMS Reports',
    group: 'Reports',
    iconName: 'sms-routing',
    status: 'active',
    description: 'Live inbound and outbound SMS traffic logs and delivery stats',
    targetTab: 'traffic',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'financial-reports',
    label: 'Financial Reports',
    group: 'Reports',
    iconName: 'FileSpreadsheet',
    status: 'active',
    description: 'Track member balances, payouts, revenue, and platform net profit',
    targetTab: 'financial-reports',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'field-sms',
    label: 'Field SMS',
    group: 'Reports',
    iconName: 'Radio',
    status: 'active',
    description: 'Inbound messages for numbers not currently assigned in the system',
    targetTab: 'field-sms',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'cdr',
    label: 'Statement Providers',
    group: 'Reports',
    iconName: 'FileText',
    status: 'active',
    description: 'Carrier statements, CDR records, and telemetry reconciliation',
    targetTab: 'cdr',
    allowedRoles: ['SUPER_ADMIN'],
  },

  // ── Wholesale Customers ──
  {
    id: 'customers-list',
    label: 'Customers List',
    group: 'Wholesale Customers',
    iconName: 'Building2',
    status: 'active',
    description: 'Wholesale client directory and dedicated API integrations',
    targetTab: 'clients',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'allocate-numbers',
    label: 'Allocate Numbers',
    group: 'Wholesale Customers',
    iconName: 'Plus',
    status: 'active',
    description: 'Bulk allocate number pools to wholesale clients',
    targetTab: 'allocate-numbers',
    allowedRoles: ['SUPER_ADMIN'],
  },

  // ── System ──
  {
    id: 'settings',
    label: 'Platform Settings',
    group: 'System',
    iconName: 'Settings',
    status: 'active',
    description: 'System configurations, passwords, and security controls',
    targetTab: 'settings',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'diagnostics',
    label: 'System Diagnostics',
    group: 'System',
    iconName: 'Activity',
    status: 'active',
    description: 'API connectivity, SMPP binds, and service telemetry',
    targetTab: 'diagnostics',
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    id: 'audit',
    label: 'Audit Trail',
    group: 'System',
    iconName: 'ShieldCheck',
    status: 'active',
    description: 'Immutable audit log of all system administrative operations',
    targetTab: 'audit',
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
    id: 'sms-test-panel',
    label: 'SMS Test Panel',
    group: 'Operations & Approvals',
    iconName: 'sms-gateway',
    status: 'active',
    description: 'Zero-credential test panel for number testing and inbound validation',
    targetTab: 'sms-test-panel',
    allowedRoles: ['MANAGER'],
  },
  {
    id: 'cdr-statistics',
    label: 'Team CDR Stats',
    group: 'Operations & Approvals',
    iconName: 'cdr',
    status: 'active',
    description: 'SMS traffic and delivery statistics across your team',
    targetTab: 'cdr-statistics',
    allowedRoles: ['MANAGER'],
  },
  {
    id: 'financial-reports',
    label: 'Financial Reports',
    group: 'Operations & Approvals',
    iconName: 'FileSpreadsheet',
    status: 'active',
    description: 'Track team member balances and SMS earnings breakdown',
    targetTab: 'financial-reports',
    allowedRoles: ['MANAGER'],
  },
  {
    id: 'field-sms',
    label: 'Field SMS',
    group: 'Operations & Approvals',
    iconName: 'Radio',
    status: 'active',
    description: 'Inbound messages for unregistered destination numbers',
    targetTab: 'field-sms',
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
    iconName: 'number-inventory',
    status: 'active',
    description: 'Your leased phone numbers, expiry dates, and lease renewal',
    targetTab: 'client-numbers',
    allowedRoles: ['CLIENT'],
  },
  {
    id: 'client-inbound',
    label: 'Live OTP Stream',
    group: 'My SMS Numbers',
    iconName: 'sms-routing',
    status: 'active',
    description: 'Live real-time feed of received SMS & 1-click OTP copying',
    targetTab: 'client-inbound',
    allowedRoles: ['CLIENT'],
  },
  {
    id: 'sms-test-panel',
    label: 'SMS Test Panel',
    group: 'My SMS Numbers',
    iconName: 'sms-gateway',
    status: 'active',
    description: 'Zero-credential test panel for number testing and inbound verification',
    targetTab: 'sms-test-panel',
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
