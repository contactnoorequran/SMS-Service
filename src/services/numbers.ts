/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  NumberItem,
  NumberDetail,
  NumberStatus,
  NumberKpiSummary,
  NumberFilterState,
  CountrySummary,
  OperatorSummary,
  RangeSummary,
  ProviderSummary,
  NumberClientSummary,
  NumberAgentSummary,
  CreateNumberPayload,
  UpdateNumberPayload,
  AssignNumberPayload,
  ReassignNumberPayload,
  ReleaseNumberPayload,
} from '../types/numbers';
import { apiClient } from './api';

export class NumbersService {
  /**
   * Calculate summary KPIs strictly from real phone number records
   */
  public calculateKpis(items: NumberItem[], totalCount?: number): NumberKpiSummary {
    const total = totalCount ?? items.length;
    const assigned = items.filter((n) => n.status === 'ASSIGNED' || n.activeAssignment !== null).length;
    const available = items.filter((n) => n.status === 'AVAILABLE').length;
    const suspended = items.filter((n) => n.status === 'SUSPENDED').length;
    const uniqueProviders = new Set(items.map((n) => n.provider?.id).filter(Boolean)).size;
    const uniqueCountries = new Set(items.map((n) => n.country?.id).filter(Boolean)).size;
    const assignmentUtilization = total > 0 ? Math.round((assigned / total) * 100) : 0;

    return {
      totalNumbers: total,
      availableNumbers: available,
      assignedNumbers: assigned,
      suspendedNumbers: suspended,
      providersCount: uniqueProviders,
      countriesCount: uniqueCountries,
      assignmentUtilization,
      recentlyAddedCount: items.length,
    };
  }

  /**
   * Fetch countries lookup from API
   */
  public async fetchCountries(): Promise<CountrySummary[]> {
    try {
      const res = await apiClient.getCountries();
      const list = Array.isArray(res) ? res : [];
      return list.map((c: any) => ({
        id: c.id,
        isoCode: c.iso2 || c.isoCode || 'UN',
        name: c.name,
        dialCode: c.dialCode ? `+${c.dialCode.replace(/\D/g, '')}` : '',
        flag: c.flag || '🌐',
      }));
    } catch {
      return [];
    }
  }

  /**
   * Fetch operators lookup from API
   */
  public async fetchOperators(countryId?: string): Promise<OperatorSummary[]> {
    try {
      const res = await apiClient.getOperators();
      const list = Array.isArray(res) ? res : [];
      const filtered = countryId ? list.filter((op: any) => op.countryId === countryId) : list;
      return filtered.map((op: any) => ({
        id: op.id,
        name: op.name,
        countryId: op.countryId,
        mccMnc: op.mccMnc || op.mnc,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Fetch providers lookup from API
   */
  public async fetchProviders(): Promise<ProviderSummary[]> {
    try {
      const res = await apiClient.getProviders();
      const list = res?.items && Array.isArray(res.items) ? res.items : Array.isArray(res) ? res : [];
      return list.map((p: any) => ({
        id: p.id,
        name: p.name,
        status: p.status || 'ACTIVE',
        type: p.type || 'TIER_1_CARRIER',
        connectionHealth: 'HEALTHY',
        activeConnectionCount: p.connectionsCount || 1,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Fetch numbering ranges from API
   */
  public async fetchRanges(): Promise<RangeSummary[]> {
    try {
      const res = await fetch('/api/numbers/ranges', {
        headers: {
          Authorization: `Bearer ${apiClient.getToken() || ''}`,
        },
      });
      const data = await res.json();
      const list = data?.data?.ranges && Array.isArray(data.data.ranges) ? data.data.ranges : [];
      return list.map((r: any) => ({
        id: r.id,
        providerId: r.providerId,
        countryId: r.countryId,
        operatorId: r.operatorId || null,
        startE164: r.startE164,
        endE164: r.endE164,
        status: r.status || 'ACTIVE',
      }));
    } catch {
      return [];
    }
  }

  /**
   * Fetch clients lookup for assignment modal
   */
  public async fetchClients(): Promise<NumberClientSummary[]> {
    try {
      const res = await apiClient.getClients();
      const list = res?.items && Array.isArray(res.items) ? res.items : Array.isArray(res) ? res : [];
      return list.map((c: any) => ({
        id: c.id,
        name: c.name || 'Client',
        companyName: c.companyName || 'Enterprise Client',
        email: c.email,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Fetch agents lookup for assignment modal
   */
  public async fetchAgents(): Promise<NumberAgentSummary[]> {
    try {
      const res = await apiClient.getAgents();
      const list = res?.items && Array.isArray(res.items) ? res.items : Array.isArray(res) ? res : [];
      return list.map((a: any) => ({
        id: a.id,
        name: a.name || 'Agent',
        email: a.email,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Fetch paginated and filtered list of numbers directly from API
   */
  public async fetchNumbers(filterState: NumberFilterState): Promise<{
    items: NumberItem[];
    total: number;
    kpis: NumberKpiSummary;
  }> {
    const liveRes = await apiClient.getNumbers({
      search: filterState.search,
      status: filterState.status !== 'ALL' ? filterState.status : undefined,
      countryId: filterState.countryId !== 'ALL' ? filterState.countryId : undefined,
      operatorId: filterState.operatorId !== 'ALL' ? filterState.operatorId : undefined,
      clientId: filterState.clientId !== 'ALL' ? filterState.clientId : undefined,
      page: filterState.page,
      limit: filterState.limit,
    });

    const rawList = liveRes?.items && Array.isArray(liveRes.items) ? liveRes.items : [];

    const items: NumberItem[] = rawList.map((n: any) => ({
      id: n.id,
      e164: n.e164 || n.e164Number,
      country: n.country
        ? {
            id: n.country.id,
            isoCode: n.country.iso2 || n.country.isoCode || 'UN',
            name: n.country.name,
            dialCode: n.country.dialCode ? `+${n.country.dialCode.replace(/\D/g, '')}` : '',
            flag: n.country.flag || '🌐',
          }
        : { id: 'c-un', isoCode: 'UN', name: 'Unknown', dialCode: '' },
      operator: n.operator ? { id: n.operator.id, name: n.operator.name, countryId: n.operator.countryId } : null,
      provider: n.provider
        ? { id: n.provider.id, name: n.provider.name, status: n.provider.status || 'ACTIVE' }
        : { id: 'p-default', name: 'Default Carrier', status: 'ACTIVE' },
      range: n.range || null,
      status: (n.status as NumberStatus) || 'AVAILABLE',
      activeAssignment: n.activeAssignment || n.assignment
        ? {
            id: (n.activeAssignment || n.assignment).id,
            numberId: n.id,
            clientId: (n.activeAssignment || n.assignment).clientId,
            client: {
              id: (n.activeAssignment || n.assignment).clientId,
              name: (n.activeAssignment || n.assignment).clientName || (n.activeAssignment || n.assignment).client?.name || 'Client',
              companyName: (n.activeAssignment || n.assignment).client?.companyName || (n.activeAssignment || n.assignment).clientName || 'Enterprise Client',
              email: (n.activeAssignment || n.assignment).client?.email || '',
            },
            agentId: (n.activeAssignment || n.assignment).agentId || null,
            agent: (n.activeAssignment || n.assignment).agentId
              ? {
                  id: (n.activeAssignment || n.assignment).agentId,
                  name: (n.activeAssignment || n.assignment).agentName || 'Agent',
                  email: (n.activeAssignment || n.assignment).agent?.user?.email || '',
                }
              : null,
            assignedAt: (n.activeAssignment || n.assignment).assignedAt || new Date().toISOString(),
            assignedBy: 'System',
          }
        : null,
      monthlyCost: n.monthlyCost ? Number(n.monthlyCost) : 0,
      currency: n.currency || 'USD',
      totalMessages: n.totalMessages ?? n._count?.incomingMessages ?? 0,
      lastActivityAt: n.updatedAt || n.lastActivityAt || null,
      createdAt: n.createdAt || new Date().toISOString(),
    }));

    const total = liveRes?.total ?? items.length;
    const kpis = this.calculateKpis(items, total);

    return {
      items,
      total,
      kpis,
    };
  }

  /**
   * Fetch single number details by ID directly from API
   */
  public async fetchNumberById(id: string): Promise<NumberDetail> {
    const live = await apiClient.getNumberById(id);
    if (!live) {
      throw new Error(`Phone number '${id}' not found`);
    }

    const n = live.number || live;
    const assignment = n.activeAssignment || n.assignment;

    return {
      id: n.id,
      e164: n.e164 || n.e164Number,
      country: n.country
        ? {
            id: n.country.id,
            isoCode: n.country.iso2 || n.country.isoCode || 'UN',
            name: n.country.name,
            dialCode: n.country.dialCode ? `+${n.country.dialCode.replace(/\D/g, '')}` : '',
            flag: n.country.flag || '🌐',
          }
        : { id: 'c-un', isoCode: 'UN', name: 'Unknown', dialCode: '' },
      operator: n.operator ? { id: n.operator.id, name: n.operator.name, countryId: n.operator.countryId } : null,
      provider: n.provider
        ? { id: n.provider.id, name: n.provider.name, status: n.provider.status || 'ACTIVE' }
        : { id: 'p-default', name: 'Default Carrier', status: 'ACTIVE' },
      range: n.range || null,
      status: (n.status as NumberStatus) || 'AVAILABLE',
      activeAssignment: assignment
        ? {
            id: assignment.id,
            numberId: n.id,
            clientId: assignment.clientId,
            client: {
              id: assignment.clientId,
              name: assignment.clientName || assignment.client?.name || 'Client',
              companyName: assignment.client?.companyName || assignment.clientName || 'Enterprise Client',
              email: assignment.client?.email || '',
            },
            agentId: assignment.agentId || null,
            agent: assignment.agentId
              ? {
                  id: assignment.agentId,
                  name: assignment.agentName || 'Agent',
                  email: assignment.agent?.user?.email || '',
                }
              : null,
            assignedAt: assignment.assignedAt || new Date().toISOString(),
            assignedBy: 'System',
          }
        : null,
      monthlyCost: n.monthlyCost ? Number(n.monthlyCost) : 0,
      currency: n.currency || 'USD',
      totalMessages: n.totalMessages ?? n._count?.incomingMessages ?? 0,
      lastActivityAt: n.updatedAt || n.lastActivityAt || null,
      createdAt: n.createdAt || new Date().toISOString(),
      assignmentHistories: (n.assignmentHistories || []).map((h: any) => ({
        id: h.id,
        numberId: n.id,
        clientId: h.clientId,
        clientName: h.clientName || h.client?.companyName || 'Client',
        agentId: h.agentId || null,
        agentName: h.agentName || null,
        assignedAt: h.assignedAt || h.createdAt,
        endedAt: h.endedAt || null,
        changedBy: h.changedBy || 'System',
        reason: h.reason || '',
      })),
      traffic: n.traffic || {
        smsCount: n.totalMessages ?? 0,
        inboundVolume: n.totalMessages ?? 0,
        outboundVolume: 0,
        deliveryRate: 0,
        lastMessageAt: n.lastActivityAt || null,
        throughputTps: 0,
      },
      recentActivity: (n.recentActivity || []).map((a: any) => ({
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
   * Provision a new number via API
   */
  public async createNumber(payload: CreateNumberPayload): Promise<NumberItem> {
    const res = await fetch('/api/numbers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiClient.getToken() || ''}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data?.error?.message || `Failed to create number (HTTP ${res.status})`);
    }

    const n = data.data?.number || data.data;
    return {
      id: n.id,
      e164: n.e164 || payload.e164,
      country: { id: payload.countryId, isoCode: 'UN', name: 'Country', dialCode: '' },
      operator: null,
      provider: { id: payload.providerId, name: 'Carrier', status: 'ACTIVE' },
      range: null,
      status: 'AVAILABLE',
      activeAssignment: null,
      monthlyCost: payload.monthlyCost || 0,
      currency: (payload as any).currency || 'USD',
      totalMessages: 0,
      lastActivityAt: null,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Update number configuration via API
   */
  public async updateNumber(id: string, payload: UpdateNumberPayload): Promise<NumberItem> {
    const res = await fetch(`/api/numbers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiClient.getToken() || ''}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data?.error?.message || `Failed to update number (HTTP ${res.status})`);
    }

    return this.fetchNumberById(id);
  }

  /**
   * Update status via API
   */
  public async updateNumberStatus(
    id: string,
    status: NumberStatus,
    reason?: string
  ): Promise<NumberItem> {
    const res = await fetch(`/api/numbers/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiClient.getToken() || ''}`,
      },
      body: JSON.stringify({ status, reason }),
    });

    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data?.error?.message || `Failed to update status (HTTP ${res.status})`);
    }

    return this.fetchNumberById(id);
  }

  /**
   * Assign number to client via API
   */
  public async assignNumber(id: string, payload: AssignNumberPayload): Promise<NumberItem> {
    await apiClient.assignNumber(id, { clientId: payload.clientId, agentId: payload.agentId });
    return this.fetchNumberById(id);
  }

  /**
   * Reassign number to new client via API
   */
  public async reassignNumber(id: string, payload: ReassignNumberPayload): Promise<NumberItem> {
    await apiClient.reassignNumber(id, {
      newClientId: payload.targetClientId,
      newAgentId: payload.targetAgentId,
      reason: payload.reason,
    });
    return this.fetchNumberById(id);
  }

  /**
   * Release number back to pool via API
   */
  public async releaseNumber(id: string, payload: ReleaseNumberPayload): Promise<NumberItem> {
    await apiClient.releaseNumber(id, { reason: payload.reason });
    return this.fetchNumberById(id);
  }
}

export const numbersService = new NumbersService();
