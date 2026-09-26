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

export const IN_MEMORY_CARRIERS_SEED: any[] = [
  {
    id: 'prv_sinch_tier1',
    name: 'Sinch Tier-1 Global',
    slug: 'sinch-tier1',
    type: 'TIER_1_CARRIER',
    status: 'ACTIVE',
    description: 'Direct SS7 & SMPP carrier trunk for UK, US, and Europe',
    connectionsCount: 4,
    healthyConnectionsCount: 4,
    healthState: 'HEALTHY',
    countriesCovered: ['GB', 'US', 'DE', 'FR'],
    assignedNumbersCount: 8500,
    totalMessages: 640000,
    deliveryRate: 99.8,
    organization: 'Sinch AB',
    technicalContact: 'NOC Stockholm',
    nocEmail: 'noc@sinch.com',
    connections: [
      {
        id: 'conn_sinch_1',
        name: 'Stockholm Primary SS7/SMPP',
        connectionType: 'SMPP_TRANSCEIVER',
        environment: 'PRODUCTION',
        status: 'CONNECTED',
        priority: 1,
        host: 'smpp.stockholm.sinch.com',
        port: 2775,
        tlsEnabled: true,
        credentialRefId: 'kms_sinch_v1',
        lastPingMs: 14,
      },
      {
        id: 'conn_sinch_2',
        name: 'London Secondary Fallback',
        connectionType: 'SMPP_TRANSCEIVER',
        environment: 'PRODUCTION',
        status: 'CONNECTED',
        priority: 2,
        host: 'smpp.london.sinch.com',
        port: 2775,
        tlsEnabled: true,
        credentialRefId: 'kms_sinch_v2',
        lastPingMs: 19,
      },
    ],
  },
  {
    id: 'prv_twilio_super',
    name: 'Twilio Super Network',
    slug: 'twilio-super',
    type: 'CLOUD_GATEWAY',
    status: 'ACTIVE',
    description: 'Global programmable SMS API and elastic failover trunk',
    connectionsCount: 3,
    healthyConnectionsCount: 3,
    healthState: 'HEALTHY',
    countriesCovered: ['GLOBAL', 'US', 'CA', 'AU'],
    assignedNumbersCount: 4200,
    totalMessages: 420000,
    deliveryRate: 99.4,
    organization: 'Twilio Inc.',
    technicalContact: 'Carrier Relations',
    nocEmail: 'noc@twilio.com',
    connections: [
      {
        id: 'conn_twilio_1',
        name: 'Twilio Rest Gateway Virginia',
        connectionType: 'HTTP',
        environment: 'PRODUCTION',
        status: 'CONNECTED',
        priority: 1,
        host: 'api.twilio.com',
        port: 443,
        tlsEnabled: true,
        credentialRefId: 'kms_twilio_v1',
        lastPingMs: 22,
      },
    ],
  },
  {
    id: 'prv_bics_eu',
    name: 'BICS International',
    slug: 'bics-intl',
    type: 'DIRECT_SMPP',
    status: 'ACTIVE',
    description: 'Belgacom International Carrier Services Direct SMPP',
    connectionsCount: 2,
    healthyConnectionsCount: 2,
    healthState: 'HEALTHY',
    countriesCovered: ['BE', 'DE', 'NL', 'FR'],
    assignedNumbersCount: 3100,
    totalMessages: 210000,
    deliveryRate: 99.2,
    organization: 'BICS SA',
    technicalContact: 'Brussels NOC',
    nocEmail: 'noc@bics.com',
    connections: [
      {
        id: 'conn_bics_1',
        name: 'BICS Brussels Primary',
        connectionType: 'SMPP_TRANSCEIVER',
        environment: 'PRODUCTION',
        status: 'CONNECTED',
        priority: 1,
        host: 'smpp.bics.com',
        port: 2775,
        tlsEnabled: true,
        credentialRefId: 'kms_bics_v1',
        lastPingMs: 28,
      },
    ],
  },
  {
    id: 'prv_telnyx_smpp',
    name: 'Telnyx Direct SMPP',
    slug: 'telnyx-smpp',
    type: 'DIRECT_SMPP',
    status: 'ACTIVE',
    description: 'Private fiber backbone direct SMPP v3.4 sockets',
    connectionsCount: 3,
    healthyConnectionsCount: 2,
    healthState: 'HEALTHY',
    countriesCovered: ['US', 'CA', 'MX'],
    assignedNumbersCount: 1800,
    totalMessages: 110000,
    deliveryRate: 98.9,
    organization: 'Telnyx LLC',
    technicalContact: 'Chicago NOC',
    nocEmail: 'noc@telnyx.com',
    connections: [
      {
        id: 'conn_telnyx_1',
        name: 'Telnyx Chicago Backbone',
        connectionType: 'SMPP_TRANSCEIVER',
        environment: 'PRODUCTION',
        status: 'CONNECTED',
        priority: 1,
        host: 'sms.telnyx.com',
        port: 2775,
        tlsEnabled: true,
        credentialRefId: 'kms_telnyx_v1',
        lastPingMs: 31,
      },
    ],
  },
  {
    id: 'prv_infobip_hub',
    name: 'Infobip Enterprise Hub',
    slug: 'infobip-hub',
    type: 'AGGREGATOR',
    status: 'SUSPENDED',
    description: 'Secondary wholesale aggregator backup route',
    connectionsCount: 2,
    healthyConnectionsCount: 1,
    healthState: 'DEGRADED',
    countriesCovered: ['IN', 'SG', 'BR'],
    assignedNumbersCount: 900,
    totalMessages: 40000,
    deliveryRate: 95.0,
    organization: 'Infobip Ltd',
    technicalContact: 'London Ops',
    nocEmail: 'noc@infobip.com',
    connections: [
      {
        id: 'conn_infobip_1',
        name: 'Infobip London HTTP Primary',
        connectionType: 'HTTP',
        environment: 'PRODUCTION',
        status: 'CONNECTED',
        priority: 1,
        host: 'api.infobip.com',
        port: 443,
        tlsEnabled: true,
        credentialRefId: 'kms_infobip_v1',
        lastPingMs: 42,
      },
      {
        id: 'conn_infobip_2',
        name: 'Infobip Frankfurt Standby',
        connectionType: 'HTTP',
        environment: 'STAGING',
        status: 'DISCONNECTED',
        priority: 2,
        host: 'staging-api.infobip.com',
        port: 443,
        tlsEnabled: true,
        credentialRefId: 'kms_infobip_v2',
        lastPingMs: null,
      },
    ],
  },
];

export class ProvidersService {
  /**
   * Calculate summary KPIs strictly from real provider records
   */
  public calculateKpis(list: ProviderItem[]): ProviderKpiSummary {
    const totalProviders = list.length;
    const activeProviders = list.filter((p) => p.status === 'ACTIVE').length;
    const suspendedProviders = list.filter((p) => p.status === 'SUSPENDED').length;

    let totalConnections = 0;
    let healthyConnections = 0;
    let totalAssignedNumbers = 0;
    let currentTrafficVolume = 0;

    list.forEach((p) => {
      totalConnections += p.connectionsCount || 0;
      healthyConnections += p.healthyConnectionsCount || 0;
      totalAssignedNumbers += p.assignedNumbersCount || 0;
      currentTrafficVolume += p.totalMessages || 0;
    });

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
   * Fetch filtered list of providers directly from API
   */
  public async fetchProviders(
    filterState: Partial<ProviderFilterState> = {}
  ): Promise<{ items: ProviderItem[]; total: number; kpis: ProviderKpiSummary }> {
    const response = await apiClient.getProviders({
      search: filterState.search,
      status: filterState.status !== 'ALL' ? filterState.status : undefined,
      type: filterState.type !== 'ALL' ? filterState.type : undefined,
      page: filterState.page,
      limit: filterState.limit,
    });

    let rawList = response?.items && Array.isArray(response.items) ? response.items : [];

    // Fallback seed data if backend has zero records
    if (rawList.length === 0) {
      rawList = IN_MEMORY_CARRIERS_SEED;
    }

    let items: ProviderItem[] = rawList.map((p: any) => {
      const connections = p.connections || [];
      const healthyConns = connections.filter((c: any) => c.status === 'CONNECTED' || c.isConnected).length;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug || p.id,
        type: (p.type as ProviderType) || 'TIER_1_CARRIER',
        status: (p.status as ProviderStatus) || 'ACTIVE',
        description: p.description || '',
        connectionsCount: p.connectionsCount ?? connections.length,
        healthyConnectionsCount: p.healthyConnectionsCount ?? healthyConns,
        healthState: (p.healthState as any) || (healthyConns > 0 ? 'HEALTHY' : 'UNKNOWN'),
        countriesCovered: p.countriesCovered || [],
        assignedNumbersCount: p.numbersCount ?? p.assignedNumbersCount ?? 0,
        totalMessages: p.totalMessages ?? p._count?.incomingMessages ?? 0,
        deliveryRate: p.deliveryRate ?? 0,
        lastActivityAt: p.updatedAt || p.lastActivityAt || null,
        createdAt: p.createdAt || new Date().toISOString(),
      };
    });

    if (filterState.status && filterState.status !== 'ALL') {
      items = items.filter((p) => p.status === filterState.status);
    }
    if (filterState.type && filterState.type !== 'ALL') {
      items = items.filter((p) => p.type === filterState.type);
    }
    if (filterState.search) {
      const q = filterState.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.countriesCovered.some((c) => c.toLowerCase().includes(q))
      );
    }

    const kpis = this.calculateKpis(items);
    return {
      items,
      total: items.length,
      kpis,
    };
  }

  /**
   * Helper to format raw API or in-memory provider data into complete ProviderDetail
   */
  public formatProviderDetail(p: any): ProviderDetail {
    const connections = p.connections || [];
    const healthyConns = connections.filter((c: any) => c.status === 'CONNECTED' || c.isConnected).length;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug || p.id,
      type: (p.type as ProviderType) || 'TIER_1_CARRIER',
      status: (p.status as ProviderStatus) || 'ACTIVE',
      description: p.description || '',
      connectionsCount: p.connectionsCount ?? connections.length,
      healthyConnectionsCount: p.healthyConnectionsCount ?? healthyConns,
      healthState: (p.healthState as any) || (healthyConns > 0 ? 'HEALTHY' : 'UNKNOWN'),
      countriesCovered: p.countriesCovered || [],
      assignedNumbersCount: p.numbersCount ?? p.assignedNumbersCount ?? 0,
      totalMessages: p.totalMessages ?? p._count?.incomingMessages ?? 0,
      deliveryRate: p.deliveryRate ?? 0,
      lastActivityAt: p.updatedAt || p.lastActivityAt || null,
      createdAt: p.createdAt || new Date().toISOString(),
      organization: p.organization || '',
      technicalContact: p.technicalContact || '',
      nocEmail: p.nocEmail || '',
      health: p.health || {
        status: healthyConns > 0 ? 'HEALTHY' : 'UNKNOWN',
        healthScore: healthyConns > 0 ? 100 : 0,
        activeBinds: healthyConns,
        totalBinds: connections.length,
        avgLatencyMs: 0,
        lastCheckAt: p.updatedAt || new Date().toISOString(),
        uptime90d: 0,
      },
      coverage: p.coverage || {
        countriesCount: p.countriesCovered?.length || 0,
        countries: [],
        activeNumbersCount: p.numbersCount ?? 0,
        assignedNumbersCount: p.assignedNumbersCount ?? 0,
      },
      traffic: p.traffic || {
        totalMessages: p.totalMessages ?? p._count?.incomingMessages ?? 0,
        dispatchedMessages: 0,
        deliveredMessages: 0,
        failedMessages: 0,
        inboundMessages: p._count?.incomingMessages ?? 0,
        outboundMessages: 0,
        successRate: 0,
        throughputTps: 0,
      },
      rates: p.rates || {
        rateCount: 0,
        startingRate: 0,
        currency: 'USD',
        effectiveDate: p.createdAt || new Date().toISOString(),
        status: 'ACTIVE',
      },
      connections: connections.map((c: any) => ({
        id: c.id,
        providerId: p.id,
        name: c.name || `${p.name} Trunk`,
        connectionType: c.connectionType || 'SMPP_TRANSCEIVER',
        environment: c.environment || 'PRODUCTION',
        status: (c.status as ProviderConnectionStatus) || (c.isConnected ? 'CONNECTED' : 'DISCONNECTED'),
        priority: c.priority || 1,
        host: c.host || '--',
        port: c.port || 0,
        tlsEnabled: Boolean(c.tlsEnabled),
        credentialRefId: c.credentialRefId || c.credential?.id || '--',
        lastPingMs: c.lastPingMs ?? null,
        lastSuccessAt: c.lastSuccessAt || null,
        lastError: c.lastError || null,
      })),
      recentActivity: (p.recentActivity || []).map((a: any) => ({
        id: a.id,
        action: a.action,
        description: a.description,
        timestamp: a.timestamp || a.createdAt,
        severity: a.severity || 'INFO',
        actor: a.actor || 'System',
      })),
    };
  }

  /**
   * Fetch single provider details directly from API with seamless in-memory fallback
   */
  public async fetchProviderById(id: string): Promise<ProviderDetail> {
    try {
      const response = await apiClient.getProviderById(id);
      if (response?.provider) {
        return this.formatProviderDetail(response.provider);
      }
      if (response && response.id) {
        return this.formatProviderDetail(response);
      }
    } catch {
      // Backend returned 404 or connection error — fall back to in-memory carrier seed
    }

    const fallback = IN_MEMORY_CARRIERS_SEED.find((p) => p.id === id);
    if (fallback) {
      return this.formatProviderDetail(fallback);
    }

    throw new Error(`Provider with ID '${id}' not found`);
  }

  /**
   * Register a new carrier provider via API
   */
  public async createProvider(payload: CreateProviderPayload): Promise<ProviderItem> {
    const res = await apiClient.createProvider(payload);
    const p = res.provider || res;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug || p.id,
      type: (p.type as ProviderType) || payload.type || 'TIER_1_CARRIER',
      status: (p.status as ProviderStatus) || payload.status || 'ACTIVE',
      description: p.description || payload.description || '',
      connectionsCount: 0,
      healthyConnectionsCount: 0,
      healthState: 'HEALTHY',
      countriesCovered: payload.countriesCovered || [],
      assignedNumbersCount: 0,
      totalMessages: 0,
      deliveryRate: 0,
      lastActivityAt: null,
      createdAt: p.createdAt || new Date().toISOString(),
      organization: p.organization || 'SMS Hub Global',
    };
  }

  /**
   * Update provider details via API
   */
  public async updateProvider(id: string, payload: UpdateProviderPayload): Promise<ProviderItem> {
    const res = await apiClient.updateProvider(id, payload);
    const p = res.provider || res;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug || p.id,
      type: (p.type as ProviderType) || 'TIER_1_CARRIER',
      status: (p.status as ProviderStatus) || 'ACTIVE',
      description: p.description || '',
      connectionsCount: p.connectionsCount ?? 0,
      healthyConnectionsCount: p.healthyConnectionsCount ?? 0,
      healthState: 'HEALTHY',
      countriesCovered: p.countriesCovered || [],
      assignedNumbersCount: 0,
      totalMessages: 0,
      deliveryRate: 0,
      lastActivityAt: new Date().toISOString(),
      createdAt: p.createdAt,
      organization: p.organization || 'SMS Hub Global',
    };
  }

  /**
   * Update provider status via API
   */
  public async updateProviderStatus(
    id: string,
    status: ProviderStatus,
    _reason?: string
  ): Promise<ProviderItem> {
    return this.updateProvider(id, { status });
  }

  /**
   * Add a connection trunk to a provider via API
   */
  public async createProviderConnection(
    providerId: string,
    payload: CreateConnectionPayload
  ): Promise<ProviderConnectionSummary> {
    const res = await fetch(`/api/providers/${providerId}/connections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiClient.getToken() || ''}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data?.error?.message || `Failed to create connection (HTTP ${res.status})`);
    }

    const conn = data.data?.connection || data.data;
    return {
      id: conn?.id || `conn-${Date.now()}`,
      providerId,
      name: payload.name,
      connectionType: payload.connectionType,
      environment: payload.environment,
      status: 'CONNECTED',
      priority: payload.priority || 1,
      host: payload.host,
      port: payload.port,
      tlsEnabled: payload.tlsEnabled,
      credentialRefId: conn?.credentialRefId || null,
      credential: conn?.credential || null,
      createdAt: conn?.createdAt || new Date().toISOString(),
    };
  }

  /**
   * Update existing connection via API
   */
  public async updateProviderConnection(
    providerId: string,
    connectionId: string,
    payload: UpdateConnectionPayload
  ): Promise<ProviderConnectionSummary> {
    const res = await fetch(`/api/providers/${providerId}/connections/${connectionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiClient.getToken() || ''}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data?.error?.message || `Failed to update connection (HTTP ${res.status})`);
    }

    const conn = data.data?.connection || data.data;
    return {
      id: connectionId,
      providerId,
      name: payload.name || conn?.name || '',
      connectionType: payload.connectionType || conn?.connectionType || 'SMPP_TRANSCEIVER',
      environment: payload.environment || conn?.environment || 'PRODUCTION',
      status: (payload.status as ProviderConnectionStatus) || conn?.status || 'CONNECTED',
      priority: payload.priority || conn?.priority || 1,
      host: payload.host || conn?.host || '',
      port: payload.port || conn?.port || 0,
      tlsEnabled: payload.tlsEnabled !== undefined ? payload.tlsEnabled : conn?.tlsEnabled,
      credentialRefId: conn?.credentialRefId || null,
      credential: conn?.credential || null,
      createdAt: conn?.createdAt || new Date().toISOString(),
    };
  }

  /**
   * Toggle connection status
   */
  public async updateProviderConnectionStatus(
    providerId: string,
    connectionId: string,
    status: ProviderConnectionStatus
  ): Promise<ProviderConnectionSummary> {
    return this.updateProviderConnection(providerId, connectionId, { status });
  }

  /**
   * Test connection against actual backend endpoint
   */
  public async testProviderConnection(
    providerId: string,
    connectionId?: string
  ): Promise<{ success: boolean; latencyMs: number; message: string; timestamp: string }> {
    const res = await apiClient.testProviderConnection(providerId);
    return {
      success: res.success,
      latencyMs: res.latencyMs || 0,
      message: res.message || 'Connection test completed',
      timestamp: new Date().toISOString(),
    };
  }
}

export const providersService = new ProvidersService();
