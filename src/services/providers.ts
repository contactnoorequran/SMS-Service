/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ProviderItem,
  ProviderDetail,
  ProviderStatus,
  ProviderType,
  ProviderConnectionSummary,
  ProviderConnectionDetail,
  ProviderConnectionStatus,
  ProviderKpiSummary,
  ProviderFilterState,
  CreateProviderPayload,
  UpdateProviderPayload,
  CreateConnectionPayload,
  UpdateConnectionPayload,
  ProviderHealthSummary,
  ProviderCoverageSummary,
  ProviderTrafficSummary,
  ProviderRateSummary,
  ProviderActivityItem,
} from '../types/providers';
import { apiClient } from './api';

// Comprehensive Seed Providers (Sanitized, Safe KMS Credentials)
const INITIAL_PROVIDERS_SEED: ProviderDetail[] = [
  {
    id: 'prov-001',
    name: 'Sinch Global Telecom',
    slug: 'sinch-global',
    type: 'TIER_1_CARRIER',
    status: 'ACTIVE',
    description: 'Tier-1 international direct carrier interconnect with SS7 routing & dual SMPP binds',
    connectionsCount: 3,
    healthyConnectionsCount: 3,
    healthState: 'HEALTHY',
    countriesCovered: ['GB', 'US', 'DE', 'FR', 'ES', 'IT', 'NL', 'SE'],
    assignedNumbersCount: 120,
    totalMessages: 2450000,
    deliveryRate: 99.8,
    lastActivityAt: '2026-09-15T22:30:00.000Z',
    createdAt: '2026-01-05T08:00:00.000Z',
    organization: 'Global SMS Infrastructure',
    technicalContact: 'Carrier Interconnect Operations (Frankfurt NOC)',
    nocEmail: 'noc-support@sinch.carrier.local',
    health: {
      status: 'HEALTHY',
      healthScore: 99,
      activeBinds: 3,
      totalBinds: 3,
      avgLatencyMs: 42,
      lastCheckAt: '2026-09-15T22:45:00.000Z',
      uptime90d: 99.98,
    },
    coverage: {
      countriesCount: 48,
      countries: [
        { name: 'United Kingdom', isoCode: 'GB', operatorCount: 4 },
        { name: 'United States', isoCode: 'US', operatorCount: 3 },
        { name: 'Germany', isoCode: 'DE', operatorCount: 3 },
        { name: 'France', isoCode: 'FR', operatorCount: 4 },
      ],
      activeNumbersCount: 120,
      assignedNumbersCount: 112,
    },
    traffic: {
      totalMessages: 2450000,
      dispatchedMessages: 2445100,
      deliveredMessages: 2440210,
      failedMessages: 4890,
      inboundMessages: 620000,
      outboundMessages: 1825100,
      successRate: 99.8,
      throughputTps: 250,
    },
    rates: {
      rateCount: 142,
      startingRate: 0.0042,
      currency: 'USD',
      effectiveDate: '2026-09-01T00:00:00.000Z',
      status: 'ACTIVE',
    },
    connections: [
      {
        id: 'conn-001',
        providerId: 'prov-001',
        name: 'Frankfurt Direct SMPP TX',
        connectionType: 'SMPP_TRANSMITTER',
        environment: 'PRODUCTION',
        status: 'CONNECTED',
        priority: 1,
        host: 'smpp.fra.sinch.com',
        port: 2775,
        tlsEnabled: true,
        credentialRefId: 'cred-ref-001',
        credential: {
          id: 'cred-ref-001',
          label: 'Frankfurt Production KMS Vault Key',
          isConfigured: true,
          keyVersion: 'v3',
          rotatedAt: '2026-08-15T10:00:00.000Z',
          algorithm: 'AES-256-GCM / AWS-KMS',
        },
        lastPingMs: 38,
        lastSuccessAt: '2026-09-15T22:45:00.000Z',
        createdAt: '2026-01-05T08:30:00.000Z',
      },
      {
        id: 'conn-002',
        providerId: 'prov-001',
        name: 'Frankfurt Direct SMPP RX',
        connectionType: 'SMPP_RECEIVER',
        environment: 'PRODUCTION',
        status: 'CONNECTED',
        priority: 1,
        host: 'smpp.fra.sinch.com',
        port: 2776,
        tlsEnabled: true,
        credentialRefId: 'cred-ref-001',
        credential: {
          id: 'cred-ref-001',
          label: 'Frankfurt Production KMS Vault Key',
          isConfigured: true,
          keyVersion: 'v3',
          rotatedAt: '2026-08-15T10:00:00.000Z',
          algorithm: 'AES-256-GCM / AWS-KMS',
        },
        lastPingMs: 44,
        lastSuccessAt: '2026-09-15T22:45:00.000Z',
        createdAt: '2026-01-05T08:35:00.000Z',
      },
      {
        id: 'conn-003',
        providerId: 'prov-001',
        name: 'Global REST Callback Gateway',
        connectionType: 'HTTP_REST',
        environment: 'PRODUCTION',
        status: 'CONNECTED',
        priority: 2,
        host: 'sms.api.sinch.com',
        port: 443,
        tlsEnabled: true,
        credentialRefId: 'cred-ref-002',
        credential: {
          id: 'cred-ref-002',
          label: 'REST API Token Reference (Vault)',
          isConfigured: true,
          keyVersion: 'v2',
          rotatedAt: '2026-07-10T12:00:00.000Z',
          algorithm: 'Envelope Encryption / KMS',
        },
        lastPingMs: 65,
        lastSuccessAt: '2026-09-15T22:40:00.000Z',
        createdAt: '2026-01-06T10:00:00.000Z',
      },
    ],
    recentActivity: [
      {
        id: 'act-prov-101',
        action: 'HEALTH_CHECK_PASSED',
        description: 'Automated 60s health check passed across all 3 active binds (latency 42ms)',
        timestamp: '2026-09-15T22:45:00.000Z',
        severity: 'INFO',
        actor: 'Watchdog Daemon',
      },
      {
        id: 'act-prov-102',
        action: 'KMS_CREDENTIAL_VERIFIED',
        description: 'KMS Credential Reference cred-ref-001 rotation verified successfully',
        timestamp: '2026-08-15T10:00:00.000Z',
        severity: 'INFO',
        actor: 'Security Officer',
      },
    ],
  },
  {
    id: 'prov-002',
    name: 'Twilio Telecom Cloud',
    slug: 'twilio-cloud',
    type: 'CLOUD_GATEWAY',
    status: 'ACTIVE',
    description: 'High-availability programmable SMS cloud gateway with automated failover',
    connectionsCount: 2,
    healthyConnectionsCount: 2,
    healthState: 'HEALTHY',
    countriesCovered: ['US', 'CA', 'GB', 'AU', 'IE', 'NZ'],
    assignedNumbersCount: 85,
    totalMessages: 1820000,
    deliveryRate: 99.6,
    lastActivityAt: '2026-09-15T22:15:00.000Z',
    createdAt: '2026-01-10T11:00:00.000Z',
    organization: 'Global SMS Infrastructure',
    technicalContact: 'Twilio Enterprise Account Engineering',
    nocEmail: 'support-enterprise@twilio.com',
    health: {
      status: 'HEALTHY',
      healthScore: 98,
      activeBinds: 2,
      totalBinds: 2,
      avgLatencyMs: 78,
      lastCheckAt: '2026-09-15T22:40:00.000Z',
      uptime90d: 99.95,
    },
    coverage: {
      countriesCount: 35,
      countries: [
        { name: 'United States', isoCode: 'US', operatorCount: 3 },
        { name: 'Canada', isoCode: 'CA', operatorCount: 3 },
        { name: 'United Kingdom', isoCode: 'GB', operatorCount: 4 },
      ],
      activeNumbersCount: 85,
      assignedNumbersCount: 78,
    },
    traffic: {
      totalMessages: 1820000,
      dispatchedMessages: 1818000,
      deliveredMessages: 1812720,
      failedMessages: 5280,
      inboundMessages: 410000,
      outboundMessages: 1408000,
      successRate: 99.6,
      throughputTps: 180,
    },
    rates: {
      rateCount: 95,
      startingRate: 0.0055,
      currency: 'USD',
      effectiveDate: '2026-08-01T00:00:00.000Z',
      status: 'ACTIVE',
    },
    connections: [
      {
        id: 'conn-004',
        providerId: 'prov-002',
        name: 'US-East REST Dispatch Trunk',
        connectionType: 'HTTP_REST',
        environment: 'PRODUCTION',
        status: 'CONNECTED',
        priority: 1,
        host: 'api.twilio.com',
        port: 443,
        tlsEnabled: true,
        credentialRefId: 'cred-ref-003',
        credential: {
          id: 'cred-ref-003',
          label: 'Twilio Live Master Account AuthRef',
          isConfigured: true,
          keyVersion: 'v1',
          rotatedAt: '2026-06-01T00:00:00.000Z',
          algorithm: 'HMAC-SHA256 Vault Token',
        },
        lastPingMs: 72,
        lastSuccessAt: '2026-09-15T22:40:00.000Z',
        createdAt: '2026-01-10T11:20:00.000Z',
      },
      {
        id: 'conn-005',
        providerId: 'prov-002',
        name: 'Dublin Secondary HTTP Trunk',
        connectionType: 'HTTP_REST',
        environment: 'SANDBOX',
        status: 'CONNECTED',
        priority: 2,
        host: 'api.twilio.com',
        port: 443,
        tlsEnabled: true,
        credentialRefId: 'cred-ref-004',
        credential: {
          id: 'cred-ref-004',
          label: 'Sandbox Staging AuthRef',
          isConfigured: true,
          keyVersion: 'v1',
          rotatedAt: '2026-06-01T00:00:00.000Z',
          algorithm: 'HMAC-SHA256 Vault Token',
        },
        lastPingMs: 84,
        lastSuccessAt: '2026-09-15T22:40:00.000Z',
        createdAt: '2026-01-10T11:25:00.000Z',
      },
    ],
    recentActivity: [
      {
        id: 'act-prov-103',
        action: 'TRUNK_PING_SUCCESS',
        description: 'US-East REST Dispatch Trunk latency optimal (72ms)',
        timestamp: '2026-09-15T22:40:00.000Z',
        severity: 'INFO',
        actor: 'Telemetry Ping Engine',
      },
    ],
  },
  {
    id: 'prov-003',
    name: 'Infobip Carrier Services',
    slug: 'infobip-carrier',
    type: 'AGGREGATOR',
    status: 'ACTIVE',
    description: 'Enterprise aggregator with deep mobile operator connections in EMEA and APAC',
    connectionsCount: 2,
    healthyConnectionsCount: 2,
    healthState: 'HEALTHY',
    countriesCovered: ['GB', 'DE', 'FR', 'PL', 'ES', 'TR', 'AE', 'ZA'],
    assignedNumbersCount: 54,
    totalMessages: 980000,
    deliveryRate: 99.4,
    lastActivityAt: '2026-09-15T21:40:00.000Z',
    createdAt: '2026-02-01T09:00:00.000Z',
    organization: 'Global SMS Infrastructure',
    technicalContact: 'Infobip Carrier Operations',
    nocEmail: 'noc@infobip.com',
    health: {
      status: 'HEALTHY',
      healthScore: 97,
      activeBinds: 2,
      totalBinds: 2,
      avgLatencyMs: 58,
      lastCheckAt: '2026-09-15T22:35:00.000Z',
      uptime90d: 99.92,
    },
    coverage: {
      countriesCount: 62,
      countries: [
        { name: 'Poland', isoCode: 'PL', operatorCount: 4 },
        { name: 'Germany', isoCode: 'DE', operatorCount: 3 },
        { name: 'United Arab Emirates', isoCode: 'AE', operatorCount: 2 },
      ],
      activeNumbersCount: 54,
      assignedNumbersCount: 50,
    },
    traffic: {
      totalMessages: 980000,
      dispatchedMessages: 978500,
      deliveredMessages: 972630,
      failedMessages: 5870,
      inboundMessages: 180000,
      outboundMessages: 798500,
      successRate: 99.4,
      throughputTps: 150,
    },
    rates: {
      rateCount: 180,
      startingRate: 0.0048,
      currency: 'USD',
      effectiveDate: '2026-09-01T00:00:00.000Z',
      status: 'ACTIVE',
    },
    connections: [
      {
        id: 'conn-006',
        providerId: 'prov-003',
        name: 'Infobip Primary SMPP Transceiver',
        connectionType: 'SMPP_TRANSCEIVER',
        environment: 'PRODUCTION',
        status: 'CONNECTED',
        priority: 1,
        host: 'smpp.infobip.com',
        port: 8888,
        tlsEnabled: true,
        credentialRefId: 'cred-ref-005',
        credential: {
          id: 'cred-ref-005',
          label: 'Infobip Dedicated SMPP Key',
          isConfigured: true,
          keyVersion: 'v2',
          rotatedAt: '2026-08-01T10:00:00.000Z',
          algorithm: 'AES-256-GCM / KMS',
        },
        lastPingMs: 52,
        lastSuccessAt: '2026-09-15T22:35:00.000Z',
        createdAt: '2026-02-01T09:30:00.000Z',
      },
    ],
    recentActivity: [],
  },
  {
    id: 'prov-004',
    name: 'Bandwidth Inc USA',
    slug: 'bandwidth-inc',
    type: 'TIER_1_CARRIER',
    status: 'ACTIVE',
    description: 'Direct Tier-1 CLEC carrier network offering toll-free, 10DLC, and local SMS nationwide',
    connectionsCount: 2,
    healthyConnectionsCount: 2,
    healthState: 'HEALTHY',
    countriesCovered: ['US', 'CA'],
    assignedNumbersCount: 95,
    totalMessages: 3120000,
    deliveryRate: 99.9,
    lastActivityAt: '2026-09-15T22:42:00.000Z',
    createdAt: '2026-01-15T10:00:00.000Z',
    organization: 'Global SMS Infrastructure',
    technicalContact: 'Bandwidth NOC (Raleigh, NC)',
    nocEmail: 'noc@bandwidth.com',
    health: {
      status: 'HEALTHY',
      healthScore: 100,
      activeBinds: 2,
      totalBinds: 2,
      avgLatencyMs: 31,
      lastCheckAt: '2026-09-15T22:45:00.000Z',
      uptime90d: 99.99,
    },
    coverage: {
      countriesCount: 2,
      countries: [
        { name: 'United States', isoCode: 'US', operatorCount: 3 },
        { name: 'Canada', isoCode: 'CA', operatorCount: 3 },
      ],
      activeNumbersCount: 95,
      assignedNumbersCount: 92,
    },
    traffic: {
      totalMessages: 3120000,
      dispatchedMessages: 3118000,
      deliveredMessages: 3114880,
      failedMessages: 3120,
      inboundMessages: 890000,
      outboundMessages: 2228000,
      successRate: 99.9,
      throughputTps: 400,
    },
    rates: {
      rateCount: 25,
      startingRate: 0.0038,
      currency: 'USD',
      effectiveDate: '2026-09-01T00:00:00.000Z',
      status: 'ACTIVE',
    },
    connections: [
      {
        id: 'conn-008',
        providerId: 'prov-004',
        name: 'Bandwidth North America SMPP',
        connectionType: 'SMPP_TRANSCEIVER',
        environment: 'PRODUCTION',
        status: 'CONNECTED',
        priority: 1,
        host: 'smpp.bandwidth.com',
        port: 2775,
        tlsEnabled: true,
        credentialRefId: 'cred-ref-007',
        credential: {
          id: 'cred-ref-007',
          label: 'Bandwidth Clec Key Reference',
          isConfigured: true,
          keyVersion: 'v4',
          rotatedAt: '2026-09-01T00:00:00.000Z',
          algorithm: 'AES-256-GCM / KMS',
        },
        lastPingMs: 29,
        lastSuccessAt: '2026-09-15T22:45:00.000Z',
        createdAt: '2026-01-15T10:30:00.000Z',
      },
    ],
    recentActivity: [],
  },
  {
    id: 'prov-005',
    name: 'Vodafone Direct UK',
    slug: 'vodafone-uk',
    type: 'TIER_1_CARRIER',
    status: 'ACTIVE',
    description: 'Direct Mobile Network Operator (MNO) route into the UK Vodafone cellular core',
    connectionsCount: 1,
    healthyConnectionsCount: 1,
    healthState: 'HEALTHY',
    countriesCovered: ['GB'],
    assignedNumbersCount: 32,
    totalMessages: 740000,
    deliveryRate: 99.7,
    lastActivityAt: '2026-09-15T21:50:00.000Z',
    createdAt: '2026-02-10T12:00:00.000Z',
    organization: 'Global SMS Infrastructure',
    technicalContact: 'Vodafone Enterprise Wholesale',
    nocEmail: 'wholesale-noc@vodafone.co.uk',
    health: {
      status: 'HEALTHY',
      healthScore: 99,
      activeBinds: 1,
      totalBinds: 1,
      avgLatencyMs: 34,
      lastCheckAt: '2026-09-15T22:40:00.000Z',
      uptime90d: 99.96,
    },
    coverage: {
      countriesCount: 1,
      countries: [
        { name: 'United Kingdom', isoCode: 'GB', operatorCount: 1 },
      ],
      activeNumbersCount: 32,
      assignedNumbersCount: 30,
    },
    traffic: {
      totalMessages: 740000,
      dispatchedMessages: 739200,
      deliveredMessages: 737780,
      failedMessages: 2220,
      inboundMessages: 195000,
      outboundMessages: 544200,
      successRate: 99.7,
      throughputTps: 120,
    },
    rates: {
      rateCount: 12,
      startingRate: 0.0051,
      currency: 'USD',
      effectiveDate: '2026-08-15T00:00:00.000Z',
      status: 'ACTIVE',
    },
    connections: [
      {
        id: 'conn-010',
        providerId: 'prov-005',
        name: 'London Vodafone MNO Direct SMPP',
        connectionType: 'SMPP_TRANSCEIVER',
        environment: 'PRODUCTION',
        status: 'CONNECTED',
        priority: 1,
        host: 'smpp.mno.vodafone.co.uk',
        port: 2775,
        tlsEnabled: true,
        credentialRefId: 'cred-ref-009',
        credential: {
          id: 'cred-ref-009',
          label: 'Vodafone UK Carrier Trunk Vault',
          isConfigured: true,
          keyVersion: 'v2',
          rotatedAt: '2026-07-20T10:00:00.000Z',
          algorithm: 'AES-256-GCM / KMS',
        },
        lastPingMs: 34,
        lastSuccessAt: '2026-09-15T22:40:00.000Z',
        createdAt: '2026-02-10T12:30:00.000Z',
      },
    ],
    recentActivity: [],
  },
  {
    id: 'prov-006',
    name: 'Orange Wholesale France',
    slug: 'orange-wholesale',
    type: 'TIER_1_CARRIER',
    status: 'SUSPENDED',
    description: 'Direct French carrier route currently suspended for scheduled optical core maintenance',
    connectionsCount: 1,
    healthyConnectionsCount: 0,
    healthState: 'DEGRADED',
    countriesCovered: ['FR'],
    assignedNumbersCount: 14,
    totalMessages: 120000,
    deliveryRate: 88.2,
    lastActivityAt: '2026-09-15T18:00:00.000Z',
    createdAt: '2026-03-01T14:00:00.000Z',
    organization: 'Global SMS Infrastructure',
    technicalContact: 'Orange Wholesale Paris',
    nocEmail: 'noc@orange.com',
    health: {
      status: 'DEGRADED',
      healthScore: 65,
      activeBinds: 0,
      totalBinds: 1,
      avgLatencyMs: 145,
      lastCheckAt: '2026-09-15T22:30:00.000Z',
      uptime90d: 94.20,
    },
    coverage: {
      countriesCount: 1,
      countries: [
        { name: 'France', isoCode: 'FR', operatorCount: 1 },
      ],
      activeNumbersCount: 14,
      assignedNumbersCount: 14,
    },
    traffic: {
      totalMessages: 120000,
      dispatchedMessages: 118000,
      deliveredMessages: 105840,
      failedMessages: 14160,
      inboundMessages: 28000,
      outboundMessages: 90000,
      successRate: 88.2,
      throughputTps: 50,
    },
    rates: {
      rateCount: 8,
      startingRate: 0.0058,
      currency: 'USD',
      effectiveDate: '2026-07-01T00:00:00.000Z',
      status: 'PENDING_UPDATE',
    },
    connections: [
      {
        id: 'conn-011',
        providerId: 'prov-006',
        name: 'Paris Orange Direct Trunk',
        connectionType: 'SMPP_TRANSCEIVER',
        environment: 'PRODUCTION',
        status: 'DEGRADED',
        priority: 2,
        host: 'smpp.orange.fr',
        port: 2775,
        tlsEnabled: true,
        credentialRefId: 'cred-ref-010',
        credential: {
          id: 'cred-ref-010',
          label: 'Orange France Trunk Key Reference',
          isConfigured: true,
          keyVersion: 'v1',
          rotatedAt: '2026-03-01T00:00:00.000Z',
          algorithm: 'AES-256-GCM / KMS',
        },
        lastPingMs: 145,
        lastSuccessAt: '2026-09-15T18:00:00.000Z',
        lastError: 'TCP Socket Timeout on Bind Transmitter',
        createdAt: '2026-03-01T14:30:00.000Z',
      },
    ],
    recentActivity: [
      {
        id: 'act-prov-104',
        action: 'MAINTENANCE_HOLD',
        description: 'Trunk marked suspended pending scheduled carrier core maintenance window',
        timestamp: '2026-09-15T18:15:00.000Z',
        severity: 'WARNING',
        actor: 'Routing Engine',
      },
    ],
  },
  {
    id: 'prov-007',
    name: 'Tata Communications Asia',
    slug: 'tata-comm',
    type: 'AGGREGATOR',
    status: 'ACTIVE',
    description: 'Asia-Pacific aggregator hub with Tier-1 SMS terminations across SAARC & ASEAN',
    connectionsCount: 2,
    healthyConnectionsCount: 2,
    healthState: 'HEALTHY',
    countriesCovered: ['IN', 'SG', 'MY', 'AE', 'TH', 'VN'],
    assignedNumbersCount: 40,
    totalMessages: 650000,
    deliveryRate: 99.1,
    lastActivityAt: '2026-09-15T22:20:00.000Z',
    createdAt: '2026-02-15T10:00:00.000Z',
    organization: 'Global SMS Infrastructure',
    technicalContact: 'Tata Communications Global NOC (Mumbai)',
    nocEmail: 'noc@tatacommunications.com',
    health: {
      status: 'HEALTHY',
      healthScore: 96,
      activeBinds: 2,
      totalBinds: 2,
      avgLatencyMs: 68,
      lastCheckAt: '2026-09-15T22:40:00.000Z',
      uptime90d: 99.88,
    },
    coverage: {
      countriesCount: 28,
      countries: [
        { name: 'India', isoCode: 'IN', operatorCount: 4 },
        { name: 'Singapore', isoCode: 'SG', operatorCount: 3 },
        { name: 'Malaysia', isoCode: 'MY', operatorCount: 3 },
      ],
      activeNumbersCount: 40,
      assignedNumbersCount: 36,
    },
    traffic: {
      totalMessages: 650000,
      dispatchedMessages: 648000,
      deliveredMessages: 642168,
      failedMessages: 5832,
      inboundMessages: 110000,
      outboundMessages: 538000,
      successRate: 99.1,
      throughputTps: 100,
    },
    rates: {
      rateCount: 64,
      startingRate: 0.0039,
      currency: 'USD',
      effectiveDate: '2026-09-01T00:00:00.000Z',
      status: 'ACTIVE',
    },
    connections: [
      {
        id: 'conn-012',
        providerId: 'prov-007',
        name: 'Singapore Hub SMPP Transceiver',
        connectionType: 'SMPP_TRANSCEIVER',
        environment: 'PRODUCTION',
        status: 'CONNECTED',
        priority: 1,
        host: 'smpp.tatacommunications.com',
        port: 3333,
        tlsEnabled: true,
        credentialRefId: 'cred-ref-011',
        credential: {
          id: 'cred-ref-011',
          label: 'Tata Communications Vault Reference',
          isConfigured: true,
          keyVersion: 'v2',
          rotatedAt: '2026-07-01T00:00:00.000Z',
          algorithm: 'AES-256-GCM / KMS',
        },
        lastPingMs: 68,
        lastSuccessAt: '2026-09-15T22:40:00.000Z',
        createdAt: '2026-02-15T10:30:00.000Z',
      },
    ],
    recentActivity: [],
  },
];

class ProvidersService {
  private providers: ProviderDetail[] = [...INITIAL_PROVIDERS_SEED];

  /**
   * Fetch paginated and filtered list of providers with KPIs
   */
  public async fetchProviders(
    filterState: Partial<ProviderFilterState> = {}
  ): Promise<{ items: ProviderItem[]; total: number; kpis: ProviderKpiSummary }> {
    try {
      const liveRes = await apiClient.getProviders({
        search: filterState.search,
        status: filterState.status,
        type: filterState.type,
        page: filterState.page,
        limit: filterState.limit,
      });
      if (liveRes && liveRes.items && Array.isArray(liveRes.items) && liveRes.items.length > 0) {
        const items: ProviderItem[] = liveRes.items.map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          type: (p.type as ProviderType) || 'TIER_1_CARRIER',
          status: (p.status as ProviderStatus) || 'ACTIVE',
          description: p.description || `${p.name} Enterprise Carrier Gateway`,
          connectionsCount: p.connections?.length ?? (p.connectionsCount ?? 1),
          healthyConnectionsCount: p.healthyConnectionsCount ?? (p.status === 'ACTIVE' ? 1 : 0),
          healthState: p.healthState || (p.status === 'ACTIVE' ? 'HEALTHY' : 'DEGRADED'),
          countriesCovered: p.countriesCovered || ['US', 'GB', 'DE'],
          assignedNumbersCount: p._count?.numbers ?? p.assignedNumbersCount ?? 0,
          totalMessages: p._count?.inboundMessages ?? p.totalMessages ?? 0,
          deliveryRate: p.deliveryRate ?? 99.8,
          lastActivityAt: p.updatedAt || new Date().toISOString(),
          createdAt: p.createdAt || new Date().toISOString(),
        }));

        const kpis = this.calculateKpis(items as any);

        return {
          items,
          total: liveRes.total || items.length,
          kpis,
        };
      }
    } catch (err) {
      console.warn('[ProvidersService] Live API fetch failed, falling back to local seed:', err);
    }

    let filtered = [...this.providers];

    // Search filter (name, slug, description)
    if (filterState.search && filterState.search.trim()) {
      const q = filterState.search.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (filterState.status && filterState.status !== 'ALL') {
      filtered = filtered.filter((p) => p.status === filterState.status);
    }

    // Type filter
    if (filterState.type && filterState.type !== 'ALL') {
      filtered = filtered.filter((p) => p.type === filterState.type);
    }

    // Health state filter
    if (filterState.healthState && filterState.healthState !== 'ALL') {
      filtered = filtered.filter((p) => p.healthState === filterState.healthState);
    }

    // Country filter
    if (filterState.country && filterState.country !== 'ALL') {
      filtered = filtered.filter((p) => p.countriesCovered.includes(filterState.country!));
    }

    // Sorting
    const sortField = filterState.sortBy || 'volume';
    const sortDir = filterState.sortDir === 'asc' ? 1 : -1;

    filtered.sort((a, b) => {
      switch (sortField) {
        case 'name':
          return sortDir * a.name.localeCompare(b.name);
        case 'type':
          return sortDir * a.type.localeCompare(b.type);
        case 'status':
          return sortDir * a.status.localeCompare(b.status);
        case 'connections':
          return sortDir * (a.connectionsCount - b.connectionsCount);
        case 'numbers':
          return sortDir * (a.assignedNumbersCount - b.assignedNumbersCount);
        case 'deliveryRate':
          return sortDir * (a.deliveryRate - b.deliveryRate);
        case 'createdAt':
          return sortDir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        case 'volume':
        default:
          return sortDir * (a.totalMessages - b.totalMessages);
      }
    });

    const total = filtered.length;
    const page = filterState.page || 1;
    const limit = filterState.limit || 10;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      items: paginated,
      total,
      kpis: this.calculateKpis(this.providers),
    };
  }

  /**
   * Calculate executive KPIs across providers
   */
  public calculateKpis(allProviders: ProviderDetail[]): ProviderKpiSummary {
    const totalProviders = allProviders.length;
    const activeProviders = allProviders.filter((p) => p.status === 'ACTIVE').length;
    const suspendedProviders = allProviders.filter((p) => p.status === 'SUSPENDED' || p.status === 'INACTIVE').length;
    const totalConnections = allProviders.reduce((acc, p) => acc + (p.connectionsCount || 0), 0);
    const healthyConnections = allProviders.reduce((acc, p) => acc + (p.healthyConnectionsCount || 0), 0);
    const totalAssignedNumbers = allProviders.reduce((acc, p) => acc + (p.assignedNumbersCount || 0), 0);
    const currentTrafficVolume = allProviders.reduce((acc, p) => acc + (p.totalMessages || 0), 0);

    return {
      totalProviders,
      activeProviders,
      suspendedProviders,
      totalConnections,
      healthyConnections,
      totalAssignedNumbers,
      currentTrafficVolume,
    };
  }

  /**
   * Fetch single provider details by ID
   */
  public async fetchProviderById(id: string): Promise<ProviderDetail> {
    try {
      const live = await apiClient.getProviderById(id);
      if (live && live.provider) {
        const p = live.provider;
        return {
          id: p.id,
          name: p.name,
          slug: p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          type: (p.type as ProviderType) || 'TIER_1_CARRIER',
          status: (p.status as ProviderStatus) || 'ACTIVE',
          description: p.description || `${p.name} Enterprise Carrier Gateway`,
          connectionsCount: p.connections?.length ?? 1,
          healthyConnectionsCount: p.status === 'ACTIVE' ? 1 : 0,
          healthState: p.status === 'ACTIVE' ? 'HEALTHY' : 'DEGRADED',
          countriesCovered: ['GLOBAL', 'US', 'GB'],
          assignedNumbersCount: p.numbers?.length || p._count?.numbers || 0,
          totalMessages: p.inboundMessages?.length || p._count?.inboundMessages || 0,
          deliveryRate: 99.8,
          lastActivityAt: p.updatedAt || new Date().toISOString(),
          createdAt: p.createdAt || new Date().toISOString(),
          organization: 'Global SMS Infrastructure',
          technicalContact: 'Carrier Interconnect Operations',
          nocEmail: 'noc@smshub.local',
          health: {
            status: p.status === 'ACTIVE' ? 'HEALTHY' : 'DEGRADED',
            healthScore: p.status === 'ACTIVE' ? 100 : 60,
            activeBinds: 1,
            totalBinds: 1,
            avgLatencyMs: 36,
            lastCheckAt: new Date().toISOString(),
            uptime90d: 99.9,
          },
          coverage: {
            countriesCount: 1,
            countries: [{ name: 'International', isoCode: 'GLOBAL', operatorCount: 2 }],
            activeNumbersCount: p.numbers?.length || 0,
            assignedNumbersCount: p.numbers?.length || 0,
          },
          traffic: {
            totalMessages: p.inboundMessages?.length || p._count?.inboundMessages || 0,
            dispatchedMessages: p.inboundMessages?.length || p._count?.inboundMessages || 0,
            deliveredMessages: p.inboundMessages?.length || p._count?.inboundMessages || 0,
            failedMessages: 0,
            inboundMessages: p.inboundMessages?.length || p._count?.inboundMessages || 0,
            outboundMessages: 0,
            successRate: 100,
            throughputTps: 100,
          },
          rates: {
            rateCount: 1,
            startingRate: 0.0045,
            currency: 'USD',
            effectiveDate: new Date().toISOString(),
            status: 'ACTIVE',
          },
          connections: (p.connections || []).map((c: any) => ({
            id: c.id,
            providerId: p.id,
            name: c.name || `${p.name} Gateway Connection`,
            connectionType: c.connectionType || 'SMPP_TRANSCEIVER',
            environment: c.environment || 'PRODUCTION',
            status: c.status || 'CONNECTED',
            priority: c.priority || 1,
            host: c.host || 'smpp.smshub.local',
            port: c.port || 2775,
            tlsEnabled: c.tlsEnabled ?? true,
            credentialRefId: c.credentialRefId || 'kms-key-ref',
            credential: {
              id: 'kms-ref',
              label: 'Production Gateway Key',
              isConfigured: true,
              keyVersion: 'v1',
              rotatedAt: new Date().toISOString(),
              algorithm: 'AES-256-GCM / KMS',
            },
            lastPingMs: 36,
            lastSuccessAt: new Date().toISOString(),
            createdAt: c.createdAt || new Date().toISOString(),
          })),
          recentActivity: [],
        };
      }
    } catch (err) {
      console.warn('[ProvidersService] Live provider by ID failed, falling back to local:', err);
    }

    const found = this.providers.find((p) => p.id === id);
    if (!found) {
      throw new Error(`Carrier provider with ID '${id}' not found`);
    }
    return found;
  }

  /**
   * Create new provider
   */
  public async createProvider(payload: CreateProviderPayload): Promise<ProviderItem> {
    const newId = `prov-${String(this.providers.length + 1).padStart(3, '0')}`;
    const slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newProvider: ProviderDetail = {
      id: newId,
      name: payload.name,
      slug,
      type: payload.type,
      status: payload.status,
      description: payload.description || 'Enterprise carrier gateway connection',
      connectionsCount: 0,
      healthyConnectionsCount: 0,
      healthState: payload.status === 'ACTIVE' ? 'HEALTHY' : 'DOWN',
      countriesCovered: payload.countriesCovered.length > 0 ? payload.countriesCovered : ['GLOBAL'],
      assignedNumbersCount: 0,
      totalMessages: 0,
      deliveryRate: 100.0,
      lastActivityAt: null,
      createdAt: new Date().toISOString(),
      organization: 'Global SMS Infrastructure',
      technicalContact: payload.technicalContact || 'Platform NOC',
      nocEmail: payload.nocEmail || 'noc-admin@smshub.local',
      health: {
        status: payload.status === 'ACTIVE' ? 'HEALTHY' : 'DOWN',
        healthScore: payload.status === 'ACTIVE' ? 100 : 0,
        activeBinds: 0,
        totalBinds: 0,
        avgLatencyMs: 0,
        lastCheckAt: new Date().toISOString(),
        uptime90d: 100.0,
      },
      coverage: {
        countriesCount: payload.countriesCovered.length || 1,
        countries: payload.countriesCovered.map((code) => ({
          name: code,
          isoCode: code,
          operatorCount: 2,
        })),
        activeNumbersCount: 0,
        assignedNumbersCount: 0,
      },
      traffic: {
        totalMessages: 0,
        dispatchedMessages: 0,
        deliveredMessages: 0,
        failedMessages: 0,
        inboundMessages: 0,
        outboundMessages: 0,
        successRate: 100.0,
        throughputTps: 100,
      },
      rates: {
        rateCount: 0,
        startingRate: 0.0050,
        currency: 'USD',
        effectiveDate: new Date().toISOString(),
        status: 'ACTIVE',
      },
      connections: [],
      recentActivity: [
        {
          id: `act-${Date.now()}`,
          action: 'PROVIDER_CREATED',
          description: `Provider gateway initialized with type ${payload.type}`,
          timestamp: new Date().toISOString(),
          severity: 'INFO',
          actor: 'Super Admin',
        },
      ],
    };

    this.providers.unshift(newProvider);
    return newProvider;
  }

  /**
   * Update mutable provider metadata
   */
  public async updateProvider(id: string, payload: UpdateProviderPayload): Promise<ProviderItem> {
    const target = this.providers.find((p) => p.id === id);
    if (!target) {
      throw new Error(`Provider with ID '${id}' not found`);
    }

    if (payload.name) {
      target.name = payload.name;
      target.slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (payload.type) target.type = payload.type;
    if (payload.description !== undefined) target.description = payload.description;
    if (payload.status) target.status = payload.status;
    if (payload.countriesCovered) {
      target.countriesCovered = payload.countriesCovered;
      target.coverage.countriesCount = payload.countriesCovered.length;
    }
    if (payload.technicalContact) target.technicalContact = payload.technicalContact;
    if (payload.nocEmail) target.nocEmail = payload.nocEmail;

    target.recentActivity.unshift({
      id: `act-${Date.now()}`,
      action: 'METADATA_UPDATED',
      description: 'Carrier metadata and routing parameters updated',
      timestamp: new Date().toISOString(),
      severity: 'INFO',
      actor: 'Super Admin / Telecom Engineer',
    });

    return target;
  }

  /**
   * Update provider lifecycle status with reason
   */
  public async updateProviderStatus(
    id: string,
    status: ProviderStatus,
    reason?: string
  ): Promise<ProviderItem> {
    const target = this.providers.find((p) => p.id === id);
    if (!target) {
      throw new Error(`Provider with ID '${id}' not found`);
    }

    const prev = target.status;
    target.status = status;
    target.healthState = status === 'ACTIVE' ? 'HEALTHY' : 'DOWN';
    target.health.status = status === 'ACTIVE' ? 'HEALTHY' : 'DOWN';

    target.recentActivity.unshift({
      id: `act-${Date.now()}`,
      action: `STATUS_${status}`,
      description: `Provider trunk status changed from ${prev} to ${status}${reason ? `: ${reason}` : ''}`,
      timestamp: new Date().toISOString(),
      severity: status === 'ACTIVE' ? 'INFO' : 'WARNING',
      actor: 'Super Admin / Routing Ops',
    });

    return target;
  }

  /**
   * Fetch all connections for a provider
   */
  public async fetchProviderConnections(providerId: string): Promise<ProviderConnectionSummary[]> {
    const provider = this.providers.find((p) => p.id === providerId);
    return provider ? [...provider.connections] : [];
  }

  /**
   * Create new connection bind on a provider
   */
  public async createProviderConnection(
    providerId: string,
    payload: CreateConnectionPayload
  ): Promise<ProviderConnectionSummary> {
    const provider = this.providers.find((p) => p.id === providerId);
    if (!provider) {
      throw new Error(`Provider with ID '${providerId}' not found`);
    }

    const newConnId = `conn-${Date.now().toString().slice(-4)}`;
    const credRefId = `cred-ref-${Date.now().toString().slice(-4)}`;

    const newConnection: ProviderConnectionSummary = {
      id: newConnId,
      providerId,
      name: payload.name,
      connectionType: payload.connectionType,
      environment: payload.environment,
      status: 'CONNECTED',
      priority: payload.priority || 1,
      host: payload.host,
      port: payload.port,
      tlsEnabled: payload.tlsEnabled,
      credentialRefId: credRefId,
      credential: {
        id: credRefId,
        label: payload.credentialRefLabel || `${payload.name} KMS Reference`,
        isConfigured: true,
        keyVersion: 'v1',
        rotatedAt: new Date().toISOString(),
        algorithm: 'AES-256-GCM / AWS-KMS',
      },
      lastPingMs: 40,
      lastSuccessAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    provider.connections.push(newConnection);
    provider.connectionsCount = provider.connections.length;
    provider.healthyConnectionsCount = provider.connections.filter((c) => c.status === 'CONNECTED').length;
    provider.health.totalBinds = provider.connectionsCount;
    provider.health.activeBinds = provider.healthyConnectionsCount;

    provider.recentActivity.unshift({
      id: `act-${Date.now()}`,
      action: 'CONNECTION_ADDED',
      description: `Added ${payload.connectionType} connection: ${payload.name} (${payload.host}:${payload.port})`,
      timestamp: new Date().toISOString(),
      severity: 'INFO',
      actor: 'Telecom Engineer',
    });

    return newConnection;
  }

  /**
   * Update an existing provider connection
   */
  public async updateProviderConnection(
    providerId: string,
    connectionId: string,
    payload: UpdateConnectionPayload
  ): Promise<ProviderConnectionSummary> {
    const provider = this.providers.find((p) => p.id === providerId);
    if (!provider) {
      throw new Error(`Provider with ID '${providerId}' not found`);
    }

    const conn = provider.connections.find((c) => c.id === connectionId);
    if (!conn) {
      throw new Error(`Connection with ID '${connectionId}' not found`);
    }

    if (payload.name) conn.name = payload.name;
    if (payload.connectionType) conn.connectionType = payload.connectionType;
    if (payload.environment) conn.environment = payload.environment;
    if (payload.host) conn.host = payload.host;
    if (payload.port) conn.port = payload.port;
    if (payload.priority !== undefined) conn.priority = payload.priority;
    if (payload.tlsEnabled !== undefined) conn.tlsEnabled = payload.tlsEnabled;
    if (payload.status) conn.status = payload.status;

    provider.healthyConnectionsCount = provider.connections.filter((c) => c.status === 'CONNECTED').length;
    provider.health.activeBinds = provider.healthyConnectionsCount;

    provider.recentActivity.unshift({
      id: `act-${Date.now()}`,
      action: 'CONNECTION_UPDATED',
      description: `Connection ${conn.name} parameters updated`,
      timestamp: new Date().toISOString(),
      severity: 'INFO',
      actor: 'Telecom Engineer',
    });

    return conn;
  }

  /**
   * Toggle connection status (ENABLE / DISABLE)
   */
  public async updateProviderConnectionStatus(
    providerId: string,
    connectionId: string,
    status: ProviderConnectionStatus
  ): Promise<ProviderConnectionSummary> {
    return this.updateProviderConnection(providerId, connectionId, { status });
  }

  /**
   * Test connection (Simulates safe network ping with latency telemetry)
   */
  public async testProviderConnection(
    providerId: string,
    connectionId: string
  ): Promise<{ success: boolean; latencyMs: number; message: string; timestamp: string }> {
    const provider = this.providers.find((p) => p.id === providerId);
    if (!provider) {
      throw new Error(`Provider with ID '${providerId}' not found`);
    }

    const conn = provider.connections.find((c) => c.id === connectionId);
    if (!conn) {
      throw new Error(`Connection with ID '${connectionId}' not found`);
    }

    // Simulate realistic carrier socket ping
    const isDegraded = conn.status === 'DEGRADED';
    const latency = isDegraded ? Math.floor(120 + Math.random() * 80) : Math.floor(25 + Math.random() * 30);
    const success = conn.status !== 'DISABLED';

    conn.lastPingMs = latency;
    if (success) {
      conn.lastSuccessAt = new Date().toISOString();
      conn.lastError = isDegraded ? 'Intermittent TCP retransmission detected' : null;
    } else {
      conn.lastError = 'Connection disabled by operator';
    }

    return {
      success,
      latencyMs: latency,
      message: success
        ? `Socket bind responding healthy (${latency}ms round-trip over TLS)`
        : 'Socket bind failed: connection currently disabled',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Fetch health summary for a provider
   */
  public async fetchProviderHealth(providerId: string): Promise<ProviderHealthSummary | null> {
    const provider = this.providers.find((p) => p.id === providerId);
    return provider ? provider.health : null;
  }

  /**
   * Fetch coverage summary for a provider
   */
  public async fetchProviderCoverage(providerId: string): Promise<ProviderCoverageSummary | null> {
    const provider = this.providers.find((p) => p.id === providerId);
    return provider ? provider.coverage : null;
  }

  /**
   * Fetch traffic telemetry for a provider
   */
  public async fetchProviderTraffic(providerId: string): Promise<ProviderTrafficSummary | null> {
    const provider = this.providers.find((p) => p.id === providerId);
    return provider ? provider.traffic : null;
  }

  /**
   * Fetch rate cards summary for a provider
   */
  public async fetchProviderRates(providerId: string): Promise<ProviderRateSummary | null> {
    const provider = this.providers.find((p) => p.id === providerId);
    return provider ? provider.rates : null;
  }

  /**
   * Fetch activity history for a provider
   */
  public async fetchProviderActivity(providerId: string): Promise<ProviderActivityItem[]> {
    const provider = this.providers.find((p) => p.id === providerId);
    return provider ? [...provider.recentActivity] : [];
  }
}

export const providersService = new ProvidersService();
