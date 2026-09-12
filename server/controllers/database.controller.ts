import { Request, Response } from 'express';
import { sendSuccess } from '../utils/api-response';
import fs from 'fs';
import path from 'path';

export const getDatabaseArchitecture = (_req: Request, res: Response) => {
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  const migrationPath = path.join(process.cwd(), 'prisma', 'migrations', '20260910000000_phase_02_database_architecture', 'migration.sql');

  const hasSchema = fs.existsSync(schemaPath);
  const hasMigration = fs.existsSync(migrationPath);

  const architectureDomains = [
    {
      domain: '1. Identity & Access Control',
      description: 'Role-based access control, hashed credentials, and granular permission enforcement',
      models: ['User', 'Role', 'Permission', 'RolePermission'],
      keyFeatures: [
        'UUID primary keys',
        'SHA-512/Argon2/bcrypt password hashing (no plaintext)',
        'Hierarchical RBAC: SUPER_ADMIN, MANAGER, AGENT, CLIENT',
        'Granular module-scoped permissions',
      ],
    },
    {
      domain: '2. Organization & Hierarchy',
      description: 'Carrier operations, agent commission tracking, and client account associations',
      models: ['ManagerProfile', 'AgentProfile', 'ClientProfile'],
      keyFeatures: [
        '1:1 mapping with User accounts',
        'Manager oversight of Agents & Clients',
        'Agent commission rate tracking (@db.Decimal)',
        'Client prepaid/postpaid billing profiles',
      ],
    },
    {
      domain: '3. Provider & Connection Layer',
      description: 'Telecom carrier abstractions, dual protocol gateways, and secure credential storage',
      models: ['Provider', 'ProviderConnection', 'ProviderCredential'],
      keyFeatures: [
        'Dual protocol support: HTTP/REST webhooks & SMPP v3.4 binds',
        'Throughput limit controls & bind type configuration',
        'Zero plaintext secrets: AES-256 encrypted fields & masked keys',
        'One Provider to Many Ranges and Numbers',
      ],
    },
    {
      domain: '4. Inventory & Telecom Master',
      description: 'Geographic master data, mobile network operators, and E.164 number inventory',
      models: ['Country', 'Operator', 'Range', 'Number'],
      keyFeatures: [
        'ISO 3166-1 alpha-2/3 country codes & dial codes',
        'MCC/MNC carrier unique constraints',
        'Range prefixes and bulk number allocations',
        'Unique E.164 global format (+12025550123) with lifecycle states',
      ],
    },
    {
      domain: '5. Assignment Lifecycle',
      description: 'Historical and temporal tracking of phone number leases and assignments',
      models: ['NumberAssignment'],
      keyFeatures: [
        'Preserves immutable historical audit of all assignments',
        'Fast lookups with composite indexes [numberId, status] and [clientId, status]',
        'Expiration and release timestamps',
      ],
    },
    {
      domain: '6. Messaging & CDR Billing',
      description: 'Inbound message ingestion, provider payloads, and auditable call detail records',
      models: ['IncomingMessage', 'CDR'],
      keyFeatures: [
        'Raw provider webhook payload retention',
        '1:1 auditable CDR calculation per inbound SMS',
        'Net profit formula: (Client Payout - Provider Cost - Agent Commission)',
        'High precision @db.Decimal(18, 6) calculation to prevent rounding errors',
      ],
    },
    {
      domain: '7. Rates & Double-Entry Ledger',
      description: 'Rate cards, client payout agreements, wallets, and immutable transactions',
      models: ['Rate', 'ClientPayout', 'Wallet', 'Transaction', 'CreditNote', 'PaymentRequest'],
      keyFeatures: [
        'Provider rate cards and client payout agreements with validity periods',
        'Multi-currency balance wallets with compound unique constraints [userId, currency]',
        'Immutable ledger with balanceBefore and balanceAfter audit trail',
        'Payout requests with review workflow and transaction linkage',
      ],
    },
    {
      domain: '8. System, Auditing & API Keys',
      description: 'Comprehensive audit trails, in-app notifications, and hashed REST API credentials',
      models: ['Notification', 'AuditLog', 'ApiCredential', 'ApiRequestLog', 'SystemConfig'],
      keyFeatures: [
        'SHA-256 hashed API keys with public prefix for developer access',
        'IP whitelisting and scoped permission validation',
        'Gateway request/response telemetry logs',
        'Structured event audit logs',
      ],
    },
  ];

  sendSuccess(res, {
    phase: 'PHASE_02_DATABASE_ARCHITECTURE',
    status: 'READY',
    orm: 'Prisma ORM 6.x',
    databaseEngine: 'PostgreSQL',
    schemaConfigured: hasSchema,
    migrationGenerated: hasMigration,
    migrationName: '20260910000000_phase_02_database_architecture',
    totalModels: 28,
    totalDomains: architectureDomains.length,
    domains: architectureDomains,
    specifications: {
      primaryKeys: 'UUID v4',
      financialTypes: 'Decimal(18, 6) for Rates/CDR, Decimal(18, 4) for Wallets/Ledger',
      timestamps: 'Timezone-safe UTC DateTime',
      credentialsSecurity: 'Encrypted ciphertext / SHA-256 hash / Masked preview',
      performanceIndexes: 'High-throughput composite indexes on status, foreign keys, timestamps',
    },
  });
};
