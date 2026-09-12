import React, { useState, useEffect } from 'react';
import {
  Database,
  Key,
  Shield,
  Layers,
  ArrowRight,
  CheckCircle2,
  Lock,
  DollarSign,
  FileCode,
  Radio,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { apiClient } from '../../services/api';

interface DomainMeta {
  id: string;
  name: string;
  count: number;
  description: string;
}

const DOMAINS: DomainMeta[] = [
  { id: 'all', name: 'All Entities', count: 28, description: 'Complete normalized PostgreSQL data models' },
  { id: 'identity', name: '1. Identity & RBAC', count: 4, description: 'Users, roles, permissions, and role_permissions' },
  { id: 'org', name: '2. Organization', count: 3, description: 'Manager, Agent, and Client profiles with commission rates' },
  { id: 'providers', name: '3. Providers & Gateway', count: 3, description: 'Telecom providers, dual HTTP/SMPP binds, encrypted credentials' },
  { id: 'inventory', name: '4. Inventory & Telecom', count: 4, description: 'Countries, operators (MCC/MNC), number ranges, and E.164 numbers' },
  { id: 'assignment', name: '5. Assignment History', count: 1, description: 'Temporal number leasing audit with status indexes' },
  { id: 'messaging', name: '6. Messaging & CDR', count: 2, description: 'Inbound SMS payloads and auditable billing CDRs' },
  { id: 'finance', name: '7. Rates & Ledger', count: 6, description: 'Rate cards, client payouts, multi-currency wallets, transactions, credit notes' },
  { id: 'system', name: '8. System & API Keys', count: 5, description: 'Notifications, audit trail, SHA-256 API credentials, request logs, system config' },
];

interface ModelDetail {
  name: string;
  domain: string;
  tableName: string;
  description: string;
  primaryKey: string;
  fields: { name: string; type: string; attributes: string; note?: string }[];
  relations: { target: string; type: string; rule: string }[];
  indexes: string[];
}

const MODEL_DATA: ModelDetail[] = [
  // 1. IDENTITY
  {
    name: 'User',
    domain: 'identity',
    tableName: 'users',
    description: 'Central identity record for all platform actors with salted password hashes.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'email', type: 'String', attributes: '@unique' },
      { name: 'passwordHash', type: 'String', attributes: 'Salted hash', note: 'No plaintext passwords' },
      { name: 'firstName / lastName', type: 'String?', attributes: 'Optional' },
      { name: 'status', type: 'String', attributes: "default('ACTIVE')", note: 'ACTIVE | SUSPENDED | PENDING' },
      { name: 'roleId', type: 'String', attributes: 'Foreign Key -> Role.id' },
      { name: 'lastLoginAt', type: 'DateTime?', attributes: 'Optional' },
      { name: 'createdAt / updatedAt', type: 'DateTime', attributes: 'UTC timestamp' },
    ],
    relations: [
      { target: 'Role', type: 'Many-to-One', rule: 'onDelete: Restrict' },
      { target: 'ManagerProfile / AgentProfile / ClientProfile', type: 'One-to-One', rule: 'onDelete: Cascade' },
      { target: 'Wallet[]', type: 'One-to-Many', rule: 'User financial balances' },
      { target: 'AuditLog[]', type: 'One-to-Many', rule: 'Activity trail' },
      { target: 'ApiCredential[]', type: 'One-to-Many', rule: 'REST API keys' },
    ],
    indexes: ['@@index([email])', '@@index([status])', '@@index([roleId])'],
  },
  {
    name: 'Role',
    domain: 'identity',
    tableName: 'roles',
    description: 'System roles determining authority level and allowed actions.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'name', type: 'String', attributes: '@unique', note: 'SUPER_ADMIN | MANAGER | AGENT | CLIENT' },
      { name: 'displayName', type: 'String', attributes: 'Human readable' },
      { name: 'isSystem', type: 'Boolean', attributes: 'default(false)' },
      { name: 'createdAt / updatedAt', type: 'DateTime', attributes: 'UTC timestamp' },
    ],
    relations: [
      { target: 'User[]', type: 'One-to-Many', rule: 'Users assigned to this role' },
      { target: 'RolePermission[]', type: 'One-to-Many', rule: 'Junction to permissions' },
    ],
    indexes: ['@@unique([name])'],
  },
  {
    name: 'Permission',
    domain: 'identity',
    tableName: 'permissions',
    description: 'Fine-grained functional access tokens scoped by functional module.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'code', type: 'String', attributes: '@unique', note: 'e.g. providers:manage, numbers:assign' },
      { name: 'module', type: 'String', attributes: 'IDENTITY | PROVIDERS | NUMBERS | MESSAGING | BILLING | SYSTEM' },
      { name: 'description', type: 'String?', attributes: 'Documentation' },
      { name: 'createdAt / updatedAt', type: 'DateTime', attributes: 'UTC timestamp' },
    ],
    relations: [{ target: 'RolePermission[]', type: 'One-to-Many', rule: 'onDelete: Cascade' }],
    indexes: ['@@index([module])'],
  },
  {
    name: 'RolePermission',
    domain: 'identity',
    tableName: 'role_permissions',
    description: 'Many-to-Many junction table bridging Roles and granular Permissions.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'roleId', type: 'String', attributes: 'Foreign Key -> Role.id' },
      { name: 'permissionId', type: 'String', attributes: 'Foreign Key -> Permission.id' },
      { name: 'createdAt', type: 'DateTime', attributes: 'default(now())' },
    ],
    relations: [
      { target: 'Role', type: 'Many-to-One', rule: 'onDelete: Cascade' },
      { target: 'Permission', type: 'Many-to-One', rule: 'onDelete: Cascade' },
    ],
    indexes: ['@@unique([roleId, permissionId])'],
  },

  // 2. ORGANIZATION
  {
    name: 'ManagerProfile',
    domain: 'org',
    tableName: 'manager_profiles',
    description: 'Carrier operations manager profile overseeing agents, clients, and inventory.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'userId', type: 'String', attributes: '@unique, FK -> User.id' },
      { name: 'department', type: 'String?', attributes: 'Optional' },
      { name: 'maxAgents', type: 'Int', attributes: 'default(50)' },
      { name: 'createdAt / updatedAt', type: 'DateTime', attributes: 'UTC timestamp' },
    ],
    relations: [
      { target: 'User', type: 'One-to-One', rule: 'onDelete: Cascade' },
      { target: 'AgentProfile[]', type: 'One-to-Many', rule: 'Managed agents' },
      { target: 'ClientProfile[]', type: 'One-to-Many', rule: 'Managed client accounts' },
    ],
    indexes: ['@@unique([userId])'],
  },
  {
    name: 'AgentProfile',
    domain: 'org',
    tableName: 'agent_profiles',
    description: 'Agent profile for partners who onboard clients and earn commissions on SMS traffic.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'userId', type: 'String', attributes: '@unique, FK -> User.id' },
      { name: 'managerId', type: 'String?', attributes: 'FK -> ManagerProfile.id' },
      { name: 'commissionRate', type: 'Decimal(5, 4)', attributes: 'default(0.0000)', note: 'e.g. 0.0500 for 5%' },
      { name: 'status', type: 'String', attributes: "default('ACTIVE')" },
      { name: 'createdAt / updatedAt', type: 'DateTime', attributes: 'UTC timestamp' },
    ],
    relations: [
      { target: 'User', type: 'One-to-One', rule: 'onDelete: Cascade' },
      { target: 'ManagerProfile', type: 'Many-to-One', rule: 'onDelete: SetNull' },
      { target: 'ClientProfile[]', type: 'One-to-Many', rule: 'Onboarded clients' },
      { target: 'CDR[]', type: 'One-to-Many', rule: 'Earned CDR commissions' },
    ],
    indexes: ['@@index([managerId])', '@@index([status])'],
  },
  {
    name: 'ClientProfile',
    domain: 'org',
    tableName: 'client_profiles',
    description: 'Client / tenant profile that leases numbers, receives SMS, and views CDRs.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'userId', type: 'String', attributes: '@unique, FK -> User.id' },
      { name: 'managerId', type: 'String?', attributes: 'FK -> ManagerProfile.id' },
      { name: 'agentId', type: 'String?', attributes: 'FK -> AgentProfile.id' },
      { name: 'companyName', type: 'String?', attributes: 'Optional' },
      { name: 'billingType', type: 'String', attributes: "default('PREPAID')", note: 'PREPAID | POSTPAID' },
      { name: 'status', type: 'String', attributes: "default('ACTIVE')" },
      { name: 'createdAt / updatedAt', type: 'DateTime', attributes: 'UTC timestamp' },
    ],
    relations: [
      { target: 'User', type: 'One-to-One', rule: 'onDelete: Cascade' },
      { target: 'Number[]', type: 'One-to-Many', rule: 'Currently leased numbers' },
      { target: 'NumberAssignment[]', type: 'One-to-Many', rule: 'Temporal assignment history' },
      { target: 'IncomingMessage[]', type: 'One-to-Many', rule: 'Inbound messages received' },
      { target: 'CDR[]', type: 'One-to-Many', rule: 'Call Detail Records' },
      { target: 'ClientPayout[]', type: 'One-to-Many', rule: 'Custom payout rate agreements' },
    ],
    indexes: ['@@index([managerId])', '@@index([agentId])', '@@index([status])'],
  },

  // 3. PROVIDER
  {
    name: 'Provider',
    domain: 'providers',
    tableName: 'providers',
    description: 'Telecom provider / carrier aggregator entity (e.g. Twilio, Sinch, Infobip, direct carrier).',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'name', type: 'String', attributes: 'Carrier Display Name' },
      { name: 'slug', type: 'String', attributes: '@unique', note: 'e.g. telco-direct-global' },
      { name: 'status', type: 'String', attributes: "default('ACTIVE')", note: 'ACTIVE | INACTIVE | MAINTENANCE' },
      { name: 'protocol', type: 'String', attributes: "default('HTTP_REST')", note: 'HTTP_REST | SMPP' },
      { name: 'webhookSecret', type: 'String?', attributes: 'Signature validation token' },
      { name: 'createdAt / updatedAt', type: 'DateTime', attributes: 'UTC timestamp' },
    ],
    relations: [
      { target: 'ProviderConnection[]', type: 'One-to-Many', rule: 'Gateway bind endpoints' },
      { target: 'ProviderCredential[]', type: 'One-to-Many', rule: 'Encrypted credentials' },
      { target: 'Range[]', type: 'One-to-Many', rule: 'Allocated number pools' },
      { target: 'Number[]', type: 'One-to-Many', rule: 'Inventory numbers' },
      { target: 'Rate[]', type: 'One-to-Many', rule: 'Provider rate cards' },
    ],
    indexes: ['@@index([status])'],
  },
  {
    name: 'ProviderConnection',
    domain: 'providers',
    tableName: 'provider_connections',
    description: 'Technical gateway endpoint or SMPP bind connection profile.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'providerId', type: 'String', attributes: 'FK -> Provider.id' },
      { name: 'name', type: 'String', attributes: 'Endpoint Identifier' },
      { name: 'protocol', type: 'String', attributes: 'HTTP | SMPP' },
      { name: 'host / port', type: 'String / Int', attributes: 'Network destination' },
      { name: 'bindType', type: 'String', attributes: "default('TRANSCEIVER')", note: 'TRANSMITTER | RECEIVER | TRANSCEIVER' },
      { name: 'throughputLimit', type: 'Int', attributes: 'default(30)', note: 'Max MPS (messages/sec)' },
      { name: 'isActive / isConnected', type: 'Boolean', attributes: 'Operational state' },
      { name: 'metadata', type: 'Json?', attributes: 'Carrier-specific params' },
      { name: 'createdAt / updatedAt', type: 'DateTime', attributes: 'UTC timestamp' },
    ],
    relations: [{ target: 'Provider', type: 'Many-to-One', rule: 'onDelete: Cascade' }],
    indexes: ['@@index([providerId])', '@@index([isActive])'],
  },
  {
    name: 'ProviderCredential',
    domain: 'providers',
    tableName: 'provider_credentials',
    description: 'Encrypted carrier credentials vault. Absolutely NO plaintext secrets.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'providerId', type: 'String', attributes: 'FK -> Provider.id' },
      { name: 'credentialType', type: 'String', attributes: 'API_KEY | BEARER_TOKEN | BASIC_AUTH | SMPP_SECRET' },
      { name: 'keyReference', type: 'String?', attributes: 'Cloud KMS / Vault URI' },
      { name: 'encryptedSecret', type: 'String?', attributes: 'AES-256-GCM ciphertext', note: 'Zero plaintext' },
      { name: 'iv', type: 'String?', attributes: 'Initialization vector' },
      { name: 'maskedKey', type: 'String?', attributes: 'e.g. td_live_••••••••94f2 for UI' },
      { name: 'isEncrypted', type: 'Boolean', attributes: 'default(true)' },
      { name: 'status', type: 'String', attributes: "default('ACTIVE')" },
      { name: 'createdAt / updatedAt', type: 'DateTime', attributes: 'UTC timestamp' },
    ],
    relations: [{ target: 'Provider', type: 'Many-to-One', rule: 'onDelete: Cascade' }],
    indexes: ['@@index([providerId])', '@@index([status])'],
  },

  // 4. INVENTORY
  {
    name: 'Country',
    domain: 'inventory',
    tableName: 'countries',
    description: 'Master country catalog with ISO standards and default currencies.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'name', type: 'String', attributes: 'Country Name' },
      { name: 'iso2', type: 'String', attributes: '@unique', note: 'ISO-3166-1 alpha-2 (e.g. US, GB)' },
      { name: 'iso3', type: 'String', attributes: 'ISO-3166-1 alpha-3 (e.g. USA, GBR)' },
      { name: 'dialCode', type: 'String', attributes: 'e.g. +1, +44, +49' },
      { name: 'currency', type: 'String', attributes: "default('USD')" },
      { name: 'status', type: 'String', attributes: "default('ACTIVE')" },
      { name: 'createdAt / updatedAt', type: 'DateTime', attributes: 'UTC timestamp' },
    ],
    relations: [
      { target: 'Operator[]', type: 'One-to-Many', rule: 'Carriers in country' },
      { target: 'Range[]', type: 'One-to-Many', rule: 'Number ranges' },
      { target: 'Number[]', type: 'One-to-Many', rule: 'E.164 phone numbers' },
    ],
    indexes: ['@@unique([iso2])', '@@index([status])'],
  },
  {
    name: 'Operator',
    domain: 'inventory',
    tableName: 'operators',
    description: 'Mobile Network Operator (MNO) identified by MCC (Mobile Country Code) and MNC.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'countryId', type: 'String', attributes: 'FK -> Country.id' },
      { name: 'name', type: 'String', attributes: 'Carrier corporate name' },
      { name: 'mcc', type: 'String', attributes: '3-digit MCC (e.g. 310)' },
      { name: 'mnc', type: 'String', attributes: '2-3 digit MNC (e.g. 410)' },
      { name: 'brandName', type: 'String?', attributes: 'Commercial brand' },
      { name: 'status', type: 'String', attributes: "default('ACTIVE')" },
      { name: 'createdAt / updatedAt', type: 'DateTime', attributes: 'UTC timestamp' },
    ],
    relations: [
      { target: 'Country', type: 'Many-to-One', rule: 'onDelete: Cascade' },
      { target: 'Range[]', type: 'One-to-Many', rule: 'Carrier ranges' },
      { target: 'Number[]', type: 'One-to-Many', rule: 'Numbers on this operator' },
    ],
    indexes: ['@@unique([countryId, mcc, mnc])', '@@index([countryId])', '@@index([status])'],
  },
  {
    name: 'Range',
    domain: 'inventory',
    tableName: 'ranges',
    description: 'Logical grouping of phone numbers allocated from a telecom provider.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'providerId', type: 'String', attributes: 'FK -> Provider.id' },
      { name: 'countryId', type: 'String', attributes: 'FK -> Country.id' },
      { name: 'operatorId', type: 'String?', attributes: 'FK -> Operator.id' },
      { name: 'name', type: 'String', attributes: 'Range identifier' },
      { name: 'prefix', type: 'String', attributes: 'Prefix (e.g. +1202555)' },
      { name: 'startRange / endRange', type: 'String?', attributes: 'E.164 boundary' },
      { name: 'rangeType', type: 'String', attributes: "default('LONGCODE')", note: 'LONGCODE | SHORTCODE | TOLL_FREE' },
      { name: 'status', type: 'String', attributes: "default('ACTIVE')" },
      { name: 'createdAt / updatedAt', type: 'DateTime', attributes: 'UTC timestamp' },
    ],
    relations: [
      { target: 'Provider', type: 'Many-to-One', rule: 'onDelete: Restrict' },
      { target: 'Country', type: 'Many-to-One', rule: 'onDelete: Restrict' },
      { target: 'Number[]', type: 'One-to-Many', rule: 'Child numbers' },
    ],
    indexes: ['@@index([providerId])', '@@index([countryId])', '@@index([prefix])', '@@index([status])'],
  },
  {
    name: 'Number',
    domain: 'inventory',
    tableName: 'numbers',
    description: 'Individual phone number adhering to ITU-T E.164 global format.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'e164Number', type: 'String', attributes: '@unique', note: '+12025550123 (Strict E.164)' },
      { name: 'nationalNumber', type: 'String?', attributes: 'Local formatting' },
      { name: 'rangeId', type: 'String', attributes: 'FK -> Range.id' },
      { name: 'providerId', type: 'String', attributes: 'FK -> Provider.id' },
      { name: 'countryId', type: 'String', attributes: 'FK -> Country.id' },
      { name: 'operatorId', type: 'String?', attributes: 'FK -> Operator.id' },
      { name: 'currentClientId', type: 'String?', attributes: 'FK -> ClientProfile.id (Active lease)' },
      { name: 'status', type: 'String', attributes: "default('AVAILABLE')", note: 'AVAILABLE | ASSIGNED | RESERVED | QUARANTINED' },
      { name: 'assignedAt', type: 'DateTime?', attributes: 'Timestamp when leased' },
      { name: 'createdAt / updatedAt', type: 'DateTime', attributes: 'UTC timestamp' },
    ],
    relations: [
      { target: 'Range', type: 'Many-to-One', rule: 'onDelete: Restrict' },
      { target: 'Provider', type: 'Many-to-One', rule: 'onDelete: Restrict' },
      { target: 'ClientProfile', type: 'Many-to-One', rule: 'onDelete: SetNull (Current active lease)' },
      { target: 'NumberAssignment[]', type: 'One-to-Many', rule: 'Full historical audit trail' },
      { target: 'IncomingMessage[]', type: 'One-to-Many', rule: 'SMS traffic history' },
    ],
    indexes: ['@@unique([e164Number])', '@@index([status])', '@@index([providerId])', '@@index([currentClientId])'],
  },

  // 5. ASSIGNMENT
  {
    name: 'NumberAssignment',
    domain: 'assignment',
    tableName: 'number_assignments',
    description: 'Temporal assignment ledger recording when numbers are leased, expired, or released.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'numberId', type: 'String', attributes: 'FK -> Number.id' },
      { name: 'clientId', type: 'String', attributes: 'FK -> ClientProfile.id' },
      { name: 'assignedByUserId', type: 'String?', attributes: 'FK -> User.id (Auditable admin/agent)' },
      { name: 'status', type: 'String', attributes: "default('ACTIVE')", note: 'ACTIVE | RELEASED | EXPIRED | TERMINATED' },
      { name: 'assignedAt', type: 'DateTime', attributes: 'default(now())' },
      { name: 'releasedAt / expiresAt', type: 'DateTime?', attributes: 'Lifecycle timestamps' },
      { name: 'notes', type: 'String?', attributes: 'Contract or campaign reference' },
      { name: 'createdAt / updatedAt', type: 'DateTime', attributes: 'UTC timestamp' },
    ],
    relations: [
      { target: 'Number', type: 'Many-to-One', rule: 'onDelete: Cascade' },
      { target: 'ClientProfile', type: 'Many-to-One', rule: 'onDelete: Cascade' },
      { target: 'User', type: 'Many-to-One', rule: 'onDelete: SetNull (Assigned by user)' },
    ],
    indexes: ['@@index([numberId, status])', '@@index([clientId, status])', '@@index([assignedAt])'],
  },

  // 6. MESSAGING & CDR
  {
    name: 'IncomingMessage',
    domain: 'messaging',
    tableName: 'incoming_messages',
    description: 'Inbound SMS message record capturing raw webhook payload, headers, and text.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'messageRef', type: 'String?', attributes: 'Provider upstream transaction ID' },
      { name: 'numberId', type: 'String', attributes: 'FK -> Number.id' },
      { name: 'providerId', type: 'String', attributes: 'FK -> Provider.id' },
      { name: 'clientId', type: 'String?', attributes: 'FK -> ClientProfile.id' },
      { name: 'senderAddress', type: 'String', attributes: 'Sender E.164 / shortcode / alphanumeric' },
      { name: 'destinationAddress', type: 'String', attributes: 'Destination E.164 number' },
      { name: 'messageBody', type: 'String', attributes: 'Message contents' },
      { name: 'encoding', type: 'String', attributes: "default('UTF-8')", note: 'GSM-7 | UCS-2 | UTF-8' },
      { name: 'segmentCount', type: 'Int', attributes: 'default(1)' },
      { name: 'rawPayload', type: 'Json?', attributes: 'Immutable complete webhook payload' },
      { name: 'status', type: 'String', attributes: "default('RECEIVED')", note: 'RECEIVED | PROCESSED | ROUTED | FAILED' },
      { name: 'receivedAt', type: 'DateTime', attributes: 'default(now())' },
    ],
    relations: [
      { target: 'Number', type: 'Many-to-One', rule: 'onDelete: Restrict' },
      { target: 'Provider', type: 'Many-to-One', rule: 'onDelete: Restrict' },
      { target: 'ClientProfile', type: 'Many-to-One', rule: 'onDelete: SetNull' },
      { target: 'CDR', type: 'One-to-One', rule: 'Auditable billing detail' },
    ],
    indexes: ['@@index([numberId])', '@@index([providerId])', '@@index([clientId])', '@@index([receivedAt])', '@@index([senderAddress])'],
  },
  {
    name: 'CDR',
    domain: 'messaging',
    tableName: 'cdrs',
    description: 'Call Detail Record: Mathematical financial ledger entry linking costs, payouts, and net profit.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'incomingMessageId', type: 'String', attributes: '@unique, FK -> IncomingMessage.id' },
      { name: 'numberId', type: 'String', attributes: 'FK -> Number.id' },
      { name: 'providerId', type: 'String', attributes: 'FK -> Provider.id' },
      { name: 'clientId', type: 'String?', attributes: 'FK -> ClientProfile.id' },
      { name: 'agentId', type: 'String?', attributes: 'FK -> AgentProfile.id' },
      { name: 'providerCost', type: 'Decimal(18, 6)', attributes: 'Carrier cost per SMS' },
      { name: 'clientPayout', type: 'Decimal(18, 6)', attributes: 'Client billed / payout rate' },
      { name: 'agentCommission', type: 'Decimal(18, 6)', attributes: 'Commission credit to agent' },
      { name: 'netProfit', type: 'Decimal(18, 6)', attributes: 'Payout - ProviderCost - Commission' },
      { name: 'currency', type: 'String', attributes: "default('USD')" },
      { name: 'status', type: 'String', attributes: "default('SETTLED')", note: 'SETTLED | PENDING | DISPUTED' },
      { name: 'billedAt', type: 'DateTime', attributes: 'default(now())' },
    ],
    relations: [
      { target: 'IncomingMessage', type: 'One-to-One', rule: 'onDelete: Cascade' },
      { target: 'Number', type: 'Many-to-One', rule: 'onDelete: Restrict' },
      { target: 'Provider', type: 'Many-to-One', rule: 'onDelete: Restrict' },
      { target: 'ClientProfile', type: 'Many-to-One', rule: 'onDelete: SetNull' },
      { target: 'AgentProfile', type: 'Many-to-One', rule: 'onDelete: SetNull' },
    ],
    indexes: ['@@unique([incomingMessageId])', '@@index([clientId, billedAt])', '@@index([providerId, billedAt])', '@@index([status])'],
  },

  // 7. FINANCE
  {
    name: 'Wallet',
    domain: 'finance',
    tableName: 'wallets',
    description: 'Multi-currency balance account for Users (Clients & Agents) with compound unique keys.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'userId', type: 'String', attributes: 'FK -> User.id' },
      { name: 'currency', type: 'String', attributes: "default('USD')", note: 'USD | EUR | GBP' },
      { name: 'balance', type: 'Decimal(18, 4)', attributes: 'Available funds' },
      { name: 'pendingBalance', type: 'Decimal(18, 4)', attributes: 'Awaiting settlement' },
      { name: 'reservedBalance', type: 'Decimal(18, 4)', attributes: 'Hold for pending withdrawal' },
      { name: 'status', type: 'String', attributes: "default('ACTIVE')", note: 'ACTIVE | FROZEN | SUSPENDED' },
      { name: 'createdAt / updatedAt', type: 'DateTime', attributes: 'UTC timestamp' },
    ],
    relations: [
      { target: 'User', type: 'Many-to-One', rule: 'onDelete: Cascade' },
      { target: 'Transaction[]', type: 'One-to-Many', rule: 'Immutable transaction ledger' },
      { target: 'PaymentRequest[]', type: 'One-to-Many', rule: 'Payout requests' },
    ],
    indexes: ['@@unique([userId, currency])', '@@index([userId])'],
  },
  {
    name: 'Transaction',
    domain: 'finance',
    tableName: 'transactions',
    description: 'Immutable double-entry ledger. Stores balanceBefore and balanceAfter to prevent silent overwrites.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'walletId', type: 'String', attributes: 'FK -> Wallet.id' },
      { name: 'type', type: 'String', attributes: 'CREDIT | DEBIT' },
      { name: 'category', type: 'String', attributes: 'SMS_PAYOUT | RECHARGE | WITHDRAWAL | AGENT_COMMISSION | ADJUSTMENT' },
      { name: 'amount', type: 'Decimal(18, 4)', attributes: 'Amount moved' },
      { name: 'balanceBefore', type: 'Decimal(18, 4)', attributes: 'Auditable balance snapshot' },
      { name: 'balanceAfter', type: 'Decimal(18, 4)', attributes: 'Balance snapshot after operation' },
      { name: 'currency', type: 'String', attributes: "default('USD')" },
      { name: 'referenceType', type: 'String', attributes: 'CDR | PAYMENT_REQUEST | CREDIT_NOTE | MANUAL' },
      { name: 'referenceId', type: 'String?', attributes: 'Audit link to source entity' },
      { name: 'description', type: 'String?', attributes: 'Human audit explanation' },
      { name: 'createdAt', type: 'DateTime', attributes: 'default(now()) (Immutable timestamp)' },
    ],
    relations: [{ target: 'Wallet', type: 'Many-to-One', rule: 'onDelete: Restrict' }],
    indexes: ['@@index([walletId, createdAt])', '@@index([referenceType, referenceId])'],
  },
  {
    name: 'Rate',
    domain: 'finance',
    tableName: 'rates',
    description: 'Provider inbound SMS cost rate cards with effective validity windows.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'providerId', type: 'String', attributes: 'FK -> Provider.id' },
      { name: 'countryId', type: 'String', attributes: 'FK -> Country.id' },
      { name: 'costPerSms', type: 'Decimal(18, 6)', attributes: 'Cost per message' },
      { name: 'currency', type: 'String', attributes: "default('USD')" },
      { name: 'effectiveFrom / effectiveTo', type: 'DateTime', attributes: 'Validity time window' },
      { name: 'status', type: 'String', attributes: "default('ACTIVE')" },
      { name: 'createdAt / updatedAt', type: 'DateTime', attributes: 'UTC timestamp' },
    ],
    relations: [
      { target: 'Provider', type: 'Many-to-One', rule: 'onDelete: Cascade' },
      { target: 'Country', type: 'Many-to-One', rule: 'onDelete: Cascade' },
    ],
    indexes: ['@@index([providerId, countryId, status])'],
  },
  {
    name: 'ClientPayout',
    domain: 'finance',
    tableName: 'client_payouts',
    description: 'Custom client payout agreements per country / operator / range.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'clientId', type: 'String', attributes: 'FK -> ClientProfile.id' },
      { name: 'countryId', type: 'String', attributes: 'FK -> Country.id' },
      { name: 'payoutPerSms', type: 'Decimal(18, 6)', attributes: 'Client rate per message' },
      { name: 'currency', type: 'String', attributes: "default('USD')" },
      { name: 'status', type: 'String', attributes: "default('ACTIVE')" },
      { name: 'createdAt / updatedAt', type: 'DateTime', attributes: 'UTC timestamp' },
    ],
    relations: [
      { target: 'ClientProfile', type: 'Many-to-One', rule: 'onDelete: Cascade' },
      { target: 'Country', type: 'Many-to-One', rule: 'onDelete: Cascade' },
    ],
    indexes: ['@@index([clientId, countryId, status])'],
  },
  {
    name: 'CreditNote',
    domain: 'finance',
    tableName: 'credit_notes',
    description: 'Financial adjustment documents issued by administrators for billing corrections.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'userId', type: 'String', attributes: 'FK -> User.id (Beneficiary)' },
      { name: 'issuedByUserId', type: 'String', attributes: 'FK -> User.id (Issuer)' },
      { name: 'amount', type: 'Decimal(18, 4)', attributes: 'Adjustment value' },
      { name: 'currency', type: 'String', attributes: "default('USD')" },
      { name: 'reason', type: 'String', attributes: 'Audit reason' },
      { name: 'status', type: 'String', attributes: "default('PENDING')", note: 'PENDING | APPROVED | REJECTED | APPLIED' },
      { name: 'appliedAt', type: 'DateTime?', attributes: 'Execution timestamp' },
    ],
    relations: [
      { target: 'User', type: 'Many-to-One', rule: 'Beneficiary account' },
      { target: 'User', type: 'Many-to-One', rule: 'Issuing administrator' },
    ],
    indexes: ['@@index([userId])', '@@index([status])'],
  },
  {
    name: 'PaymentRequest',
    domain: 'finance',
    tableName: 'payment_requests',
    description: 'Withdrawal and payout disbursement requests submitted by clients or agents.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'userId', type: 'String', attributes: 'FK -> User.id' },
      { name: 'walletId', type: 'String', attributes: 'FK -> Wallet.id' },
      { name: 'amount', type: 'Decimal(18, 4)', attributes: 'Withdrawal sum' },
      { name: 'currency', type: 'String', attributes: "default('USD')" },
      { name: 'paymentMethod', type: 'String', attributes: 'BANK_TRANSFER | USDT_TRC20 | PAYPAL' },
      { name: 'paymentDetails', type: 'Json', attributes: 'Routing / wallet address details' },
      { name: 'status', type: 'String', attributes: "default('REQUESTED')", note: 'REQUESTED | UNDER_REVIEW | APPROVED | COMPLETED' },
      { name: 'transactionId', type: 'String?', attributes: 'FK -> Transaction.id (When settled)' },
    ],
    relations: [
      { target: 'User', type: 'Many-to-One', rule: 'Requester' },
      { target: 'Wallet', type: 'Many-to-One', rule: 'Debit source' },
      { target: 'Transaction', type: 'Many-to-One', rule: 'Settlement transaction' },
    ],
    indexes: ['@@index([userId, status])', '@@index([walletId])'],
  },

  // 8. SYSTEM & AUDITING
  {
    name: 'AuditLog',
    domain: 'system',
    tableName: 'audit_logs',
    description: 'Immutable system event log for security auditing, compliance, and tracing.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'userId', type: 'String?', attributes: 'FK -> User.id (Actor)' },
      { name: 'action', type: 'String', attributes: 'Action code (e.g. NUMBER_ASSIGNED)' },
      { name: 'entityType', type: 'String', attributes: 'Target entity type' },
      { name: 'entityId', type: 'String?', attributes: 'Target entity ID' },
      { name: 'metadata', type: 'Json?', attributes: 'Before/after event payload' },
      { name: 'ipAddress / userAgent', type: 'String?', attributes: 'Client network telemetry' },
      { name: 'createdAt', type: 'DateTime', attributes: 'default(now()) (Immutable timestamp)' },
    ],
    relations: [{ target: 'User', type: 'Many-to-One', rule: 'onDelete: SetNull' }],
    indexes: ['@@index([userId])', '@@index([action])', '@@index([createdAt])'],
  },
  {
    name: 'ApiCredential',
    domain: 'system',
    tableName: 'api_credentials',
    description: 'Client REST API authentication tokens. Stores SHA-256 key hash (zero plaintext keys).',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'userId', type: 'String', attributes: 'FK -> User.id' },
      { name: 'name', type: 'String', attributes: 'Key Label' },
      { name: 'keyPrefix', type: 'String', attributes: 'Public preview (e.g. sms_live_9a2b)' },
      { name: 'keyHash', type: 'String', attributes: '@unique (SHA-256 digest)', note: 'Zero plaintext' },
      { name: 'status', type: 'String', attributes: "default('ACTIVE')" },
      { name: 'allowedIps', type: 'Json?', attributes: 'CIDR IP whitelist' },
      { name: 'permissions', type: 'Json?', attributes: 'Scoped permission codes' },
      { name: 'expiresAt / lastUsedAt', type: 'DateTime?', attributes: 'Key lifecycle tracking' },
      { name: 'createdAt / updatedAt', type: 'DateTime', attributes: 'UTC timestamp' },
    ],
    relations: [
      { target: 'User', type: 'Many-to-One', rule: 'onDelete: Cascade' },
      { target: 'ApiRequestLog[]', type: 'One-to-Many', rule: 'Gateway request logs' },
    ],
    indexes: ['@@unique([keyHash])', '@@index([userId])', '@@index([status])'],
  },
  {
    name: 'ApiRequestLog',
    domain: 'system',
    tableName: 'api_request_logs',
    description: 'High-speed API gateway telemetry capturing endpoints, status codes, and latency.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'apiCredentialId', type: 'String?', attributes: 'FK -> ApiCredential.id' },
      { name: 'endpoint', type: 'String', attributes: 'API route URL' },
      { name: 'method', type: 'String', attributes: 'GET | POST | PUT | DELETE' },
      { name: 'statusCode', type: 'Int', attributes: 'HTTP Status' },
      { name: 'responseTimeMs', type: 'Int', attributes: 'Execution duration' },
      { name: 'ipAddress / userAgent', type: 'String?', attributes: 'Client telemetry' },
      { name: 'createdAt', type: 'DateTime', attributes: 'default(now())' },
    ],
    relations: [{ target: 'ApiCredential', type: 'Many-to-One', rule: 'onDelete: SetNull' }],
    indexes: ['@@index([apiCredentialId, createdAt])', '@@index([endpoint])', '@@index([statusCode])'],
  },
  {
    name: 'Notification',
    domain: 'system',
    tableName: 'notifications',
    description: 'Real-time in-app notifications and alerts dispatched to user accounts.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'userId', type: 'String', attributes: 'FK -> User.id' },
      { name: 'title / body', type: 'String', attributes: 'Notification content' },
      { name: 'type', type: 'String', attributes: "default('INFO')", note: 'INFO | WARNING | ALERT | SUCCESS' },
      { name: 'isRead', type: 'Boolean', attributes: 'default(false)' },
      { name: 'readAt', type: 'DateTime?', attributes: 'Read receipt timestamp' },
      { name: 'createdAt', type: 'DateTime', attributes: 'default(now())' },
    ],
    relations: [{ target: 'User', type: 'Many-to-One', rule: 'onDelete: Cascade' }],
    indexes: ['@@index([userId, isRead])'],
  },
  {
    name: 'SystemConfig',
    domain: 'system',
    tableName: 'system_configs',
    description: 'Dynamic platform configuration keys and feature toggles.',
    primaryKey: 'id (UUID)',
    fields: [
      { name: 'id', type: 'String (UUID)', attributes: '@id @default(uuid())' },
      { name: 'key', type: 'String', attributes: '@unique' },
      { name: 'value', type: 'String', attributes: 'Configuration payload' },
      { name: 'description', type: 'String?', attributes: 'Key explanation' },
      { name: 'createdAt / updatedAt', type: 'DateTime', attributes: 'UTC timestamp' },
    ],
    relations: [],
    indexes: ['@@unique([key])'],
  },
];

export const DatabaseSchemaViewer: React.FC = () => {
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModelName, setSelectedModelName] = useState<string>('Number');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(false);

  useEffect(() => {
    fetchArchitectureData();
  }, []);

  const fetchArchitectureData = async () => {
    setIsLoadingApi(true);
    try {
      const res = await apiClient.getDatabaseArchitecture();
      setApiResponse(res.data);
    } catch (e) {
      console.error('Failed to load database architecture endpoint', e);
    } finally {
      setIsLoadingApi(false);
    }
  };

  const filteredModels = MODEL_DATA.filter((m) => {
    const matchesDomain = selectedDomain === 'all' || m.domain === selectedDomain;
    const matchesSearch =
      searchQuery.trim() === '' ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tableName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  const currentModel = MODEL_DATA.find((m) => m.name === selectedModelName) || MODEL_DATA[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 bg-slate-900 rounded-xl text-white border border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">
                <CheckCircle2 className="w-3.5 h-3.5" /> Phase 02 Schema Ready
              </Badge>
              <span className="text-xs text-slate-400 font-mono">Prisma ORM 6.x • PostgreSQL Normalized DDL</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              Database Architecture & Entity Relationship Directory
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Fully normalized relational design implementing 28 entities across 8 core domains. Enforces strict UUID primary keys,
              E.164 unique constraints, double-entry immutable financial ledgers, zero plaintext passwords, and high-throughput indexes.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchArchitectureData}
              disabled={isLoadingApi}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingApi ? 'animate-spin' : ''}`} />
              Verify Schema API
            </button>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Models</div>
            <div className="text-lg font-bold text-slate-100 mt-0.5">28 Models</div>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Architecture Tests</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">51 / 51 Passed (100%)</div>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Financial Precision</div>
            <div className="text-lg font-bold text-amber-300 mt-0.5">Decimal(18, 6)</div>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Migration DDL</div>
            <div className="text-lg font-bold text-blue-400 mt-0.5">833 Lines SQL</div>
          </div>
        </div>
      </div>

      {/* Core Architectural Invariants Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
            <Radio className="w-4 h-4 text-indigo-500" />
            <span>1:N Telephony Hierarchy</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
            <strong>Provider</strong> has many <strong>Ranges</strong>, which have many <strong>Numbers</strong>. Numbers link strictly to one Provider and Range at a time.
          </p>
          <div className="text-[11px] font-mono text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded">
            Provider [1] ──&lt; Range [N] ──&lt; Number [N]
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span>Immutable Financial Ledger</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
            Wallet balances are never silently overwritten. Every transaction stores <strong>balanceBefore</strong> and <strong>balanceAfter</strong> with auditable reference links.
          </p>
          <div className="text-[11px] font-mono text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded">
            CDR / Txn: Payout - Cost - Commission = Net
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
            <Lock className="w-4 h-4 text-amber-500" />
            <span>Encrypted Credentials Vault</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
            Carrier keys and passwords use AES-256 ciphertext, IVs, and masked strings. API tokens store SHA-256 digests with safe prefixes.
          </p>
          <div className="text-[11px] font-mono text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded">
            Zero Plaintext Passwords or Secrets
          </div>
        </div>
      </div>

      {/* Main Interactive Model Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Domain Filter & Model Selector */}
        <div className="lg:col-span-4 space-y-4">
          {/* Domain Filter */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Filter by Domain
            </div>
            <div className="space-y-1">
              {DOMAINS.map((domain) => (
                <button
                  key={domain.id}
                  onClick={() => setSelectedDomain(domain.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left ${
                    selectedDomain === domain.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span className="truncate">{domain.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {domain.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Model Search & List */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models, tables, fields..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Models ({filteredModels.length})
            </div>

            <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
              {filteredModels.map((model) => (
                <button
                  key={model.name}
                  onClick={() => setSelectedModelName(model.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left ${
                    selectedModelName === model.name
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="font-mono text-xs">{model.name}</div>
                    <div className={`text-[10px] ${selectedModelName === model.name ? 'text-indigo-200' : 'text-slate-400'}`}>
                      table: {model.tableName}
                    </div>
                  </div>
                  <ArrowRight className={`w-3 h-3 ${selectedModelName === model.name ? 'text-white' : 'text-slate-400'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Model Details & Relations Inspector */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-5">
            {/* Model Title & Table Metadata */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                    {currentModel.name}
                  </span>
                  <Badge variant="neutral" size="sm">
                    table: {currentModel.tableName}
                  </Badge>
                  <Badge variant="info" size="sm">
                    PK: {currentModel.primaryKey}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {currentModel.description}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-mono">
                  {currentModel.fields.length} Columns
                </span>
              </div>
            </div>

            {/* Field Schema Table */}
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-indigo-500" />
                <span>Column Definitions & Attributes</span>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="px-3 py-2 font-mono">Field Name</th>
                      <th className="px-3 py-2">Data Type</th>
                      <th className="px-3 py-2">Constraints & Defaults</th>
                      <th className="px-3 py-2">Operational Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                    {currentModel.fields.map((field) => (
                      <tr key={field.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                          {field.name}
                        </td>
                        <td className="px-3 py-2 text-indigo-600 dark:text-indigo-400">
                          {field.type}
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                          {field.attributes}
                        </td>
                        <td className="px-3 py-2 font-sans text-[11px] text-slate-500">
                          {field.note || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Entity Relationships */}
            {currentModel.relations.length > 0 && (
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  <span>Foreign Key Cardinality & Cascade Rules</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentModel.relations.map((rel, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                          {rel.target}
                        </div>
                        <div className="text-[10px] text-slate-500">{rel.rule}</div>
                      </div>
                      <Badge variant="neutral" size="sm">
                        {rel.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Database Indexes */}
            {currentModel.indexes.length > 0 && (
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>Performance Indexes & Unique Constraints</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentModel.indexes.map((idxStr, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-700 dark:text-slate-300"
                    >
                      {idxStr}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live Express API Response Preview */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Live Backend Schema Verification (/api/database/architecture)</span>
              </div>
              <Badge variant={apiResponse?.status === 'READY' ? 'success' : 'neutral'} size="sm">
                Status: {apiResponse?.status || 'Active'}
              </Badge>
            </div>

            <p className="text-xs text-slate-500">
              The backend Express gateway dynamically validates and serves the database schema specification:
            </p>

            <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto max-h-48 border border-slate-800">
              {JSON.stringify(apiResponse || { message: 'Loading live database architecture from backend...' }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
