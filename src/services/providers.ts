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

    const rawList = response?.items && Array.isArray(response.items) ? response.items : [];

    const items: ProviderItem[] = rawList.map((p: any) => {
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

    const kpis = this.calculateKpis(items);
    return {
      items,
      total: response?.total ?? items.length,
      kpis,
    };
  }

  /**
   * Fetch single provider details directly from API
   */
  public async fetchProviderById(id: string): Promise<ProviderDetail> {
    const response = await apiClient.getProviderById(id);
    if (!response) {
      throw new Error(`Provider with ID '${id}' not found`);
    }

    const p = response.provider || response;
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
