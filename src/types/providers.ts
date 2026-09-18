/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProviderStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type ProviderType =
  | 'TIER_1_CARRIER'
  | 'DIRECT_SMPP'
  | 'AGGREGATOR'
  | 'CLOUD_GATEWAY';

export type ProviderConnectionType =
  | 'HTTP_REST'
  | 'SMPP_TRANSCEIVER'
  | 'SMPP_TRANSMITTER'
  | 'SMPP_RECEIVER';

export type ProviderConnectionStatus =
  | 'CONNECTED'
  | 'DEGRADED'
  | 'DISCONNECTED'
  | 'DISABLED';

export type ProvidersSortField =
  | 'name'
  | 'type'
  | 'status'
  | 'connections'
  | 'numbers'
  | 'volume'
  | 'deliveryRate'
  | 'createdAt';

/**
 * Secure credential reference representation.
 * NOTE: Never store, return, or expose plaintext passwords, tokens, or secret keys.
 */
export interface ProviderCredentialSummary {
  id: string; // Reference ID (e.g. "cred-ref-001")
  label: string; // Human-friendly label (e.g. "KMS Managed Trunk Credential")
  isConfigured: boolean;
  keyVersion?: string; // KMS key rotation version
  rotatedAt?: string | null;
  algorithm?: string; // e.g. "AES-256-GCM / AWS-KMS"
}

export interface ProviderConnectionSummary {
  id: string;
  providerId: string;
  name: string;
  connectionType: ProviderConnectionType;
  environment: 'PRODUCTION' | 'SANDBOX';
  status: ProviderConnectionStatus;
  priority: number;
  host: string;
  port: number;
  tlsEnabled: boolean;
  credentialRefId: string | null;
  credential: ProviderCredentialSummary | null;
  lastPingMs?: number;
  lastSuccessAt?: string | null;
  lastError?: string | null;
  createdAt: string;
}

export interface ProviderConnectionDetail extends ProviderConnectionSummary {
  systemId?: string; // Safe SMPP system ID (non-secret account identifier)
  bindMode?: string;
  throughputTps: number;
  enquireLinkIntervalSec?: number;
  reconnectIntervalSec?: number;
  socketStatus?: 'ESTABLISHED' | 'CONNECTING' | 'CLOSED';
}

export interface ProviderHealthSummary {
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  healthScore: number; // 0 to 100
  activeBinds: number;
  totalBinds: number;
  avgLatencyMs: number;
  lastCheckAt: string;
  uptime90d: number; // e.g. 99.98
}

export interface ProviderCoverageCountry {
  name: string;
  isoCode: string;
  operatorCount: number;
}

export interface ProviderCoverageSummary {
  countriesCount: number;
  countries: ProviderCoverageCountry[];
  activeNumbersCount: number;
  assignedNumbersCount: number;
}

export interface ProviderTrafficSummary {
  totalMessages: number;
  dispatchedMessages: number;
  deliveredMessages: number;
  failedMessages: number;
  inboundMessages: number;
  outboundMessages: number;
  successRate: number; // e.g. 99.8
  throughputTps: number;
}

export interface ProviderRateSummary {
  rateCount: number;
  startingRate: number; // micro-unit sub-cent rate e.g. 0.0045
  currency: string;
  effectiveDate: string;
  status: 'ACTIVE' | 'PENDING_UPDATE';
}

export interface ProviderActivityItem {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  severity?: 'INFO' | 'WARNING' | 'ERROR';
  actor?: string;
}

export interface ProviderItem {
  id: string;
  name: string;
  slug: string;
  type: ProviderType;
  status: ProviderStatus;
  description?: string;
  connectionsCount: number;
  healthyConnectionsCount: number;
  healthState: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  countriesCovered: string[];
  assignedNumbersCount: number;
  totalMessages: number;
  deliveryRate: number;
  lastActivityAt: string | null;
  createdAt: string;
  organization: string;
}

export interface ProviderDetail extends ProviderItem {
  connections: ProviderConnectionSummary[];
  health: ProviderHealthSummary;
  coverage: ProviderCoverageSummary;
  traffic: ProviderTrafficSummary;
  rates: ProviderRateSummary;
  recentActivity: ProviderActivityItem[];
  technicalContact?: string;
  nocEmail?: string;
}

export interface ProviderKpiSummary {
  totalProviders: number;
  activeProviders: number;
  suspendedProviders: number;
  totalConnections: number;
  healthyConnections: number;
  totalAssignedNumbers: number;
  currentTrafficVolume: number;
}

export interface ProviderFilterState {
  search: string;
  status: string; // 'ALL' | ProviderStatus
  type: string; // 'ALL' | ProviderType
  healthState: string; // 'ALL' | 'HEALTHY' | 'DEGRADED' | 'DOWN'
  country: string; // 'ALL' | isoCode
  sortBy: ProvidersSortField;
  sortDir: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface CreateProviderPayload {
  name: string;
  type: ProviderType;
  description?: string;
  status: ProviderStatus;
  countriesCovered: string[];
  technicalContact?: string;
  nocEmail?: string;
}

export interface UpdateProviderPayload {
  name?: string;
  type?: ProviderType;
  description?: string;
  status?: ProviderStatus;
  countriesCovered?: string[];
  technicalContact?: string;
  nocEmail?: string;
}

export interface CreateConnectionPayload {
  name: string;
  connectionType: ProviderConnectionType;
  environment: 'PRODUCTION' | 'SANDBOX';
  host: string;
  port: number;
  priority: number;
  tlsEnabled: boolean;
  systemId?: string;
  credentialRefLabel?: string;
}

export interface UpdateConnectionPayload {
  name?: string;
  connectionType?: ProviderConnectionType;
  environment?: 'PRODUCTION' | 'SANDBOX';
  host?: string;
  port?: number;
  priority?: number;
  tlsEnabled?: boolean;
  status?: ProviderConnectionStatus;
}
