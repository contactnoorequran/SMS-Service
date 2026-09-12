export const APP_CONFIG = {
  name: 'SMS Management Platform',
  version: '1.7.0-phase-07',
  phase: '07 - CLIENT MANAGEMENT',
  apiPrefix: '/api',
  apiVersion: 'v1',
  supportedPhases: [
    { id: '01', name: 'Project Foundation', status: 'COMPLETED' },
    { id: '02', name: 'Database Architecture (Normalized PostgreSQL)', status: 'COMPLETED' },
    { id: '03', name: 'Authentication & RBAC', status: 'COMPLETED' },
    { id: '04', name: 'Countries & Operators', status: 'COMPLETED' },
    { id: '05', name: 'Manager Management', status: 'COMPLETED' },
    { id: '06', name: 'Agent Management', status: 'COMPLETED' },
    { id: '07', name: 'Client Management', status: 'ACTIVE' },
    { id: '08', name: 'SMS Router & Providers', status: 'PLANNED' },
    { id: '09', name: 'Financials & Payouts', status: 'PLANNED' },
  ],
} as const;
