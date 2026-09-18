/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ClientItem,
  ClientDetail,
  ClientStatus,
  BillingType,
  ClientKpiSummary,
  ClientFilterState,
  CreateClientPayload,
  UpdateClientPayload,
  AgentSummary,
  ManagerSummary,
  ClientNumberSummary,
  ClientFinancialSummary,
  ClientTransactionSummary,
  ClientActivityItem,
  ClientRecentSmsItem,
} from '../types/clients';
import { apiClient } from './api';

class ClientsService {
  /**
   * Fetch paginated and filtered list of clients directly from API
   */
  public async fetchClients(
    filterState: Partial<ClientFilterState> = {}
  ): Promise<{ items: ClientItem[]; total: number; kpis: ClientKpiSummary }> {
    const liveRes = await apiClient.getClients({
      search: filterState.search,
      status: filterState.status !== 'ALL' ? filterState.status : undefined,
      billingType: filterState.billingType !== 'ALL' ? filterState.billingType : undefined,
      agentId: filterState.agentId !== 'ALL' ? filterState.agentId : undefined,
      managerId: filterState.managerId !== 'ALL' ? filterState.managerId : undefined,
      page: filterState.page,
      limit: filterState.limit,
      sortBy: filterState.sortBy,
      sortDir: filterState.sortDir,
    });

    const rawList = liveRes?.items && Array.isArray(liveRes.items) ? liveRes.items : [];

    const items: ClientItem[] = rawList.map((c: any) => ({
      id: c.id,
      userId: c.userId || c.id,
      name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Client',
      email: c.email,
      companyName: c.companyName || 'Enterprise Client',
      contactPhone: c.contactPhone || c.contact || '',
      billingType: (c.billingType as BillingType) || 'PREPAID',
      status: (c.status as ClientStatus) || 'ACTIVE',
      managerId: c.managerId || null,
      managerName: c.managerName || null,
      agentId: c.agentId || null,
      agentName: c.agentName || null,
      agentEmail: c.agentEmail || null,
      assignedNumbersCount: c.assignedNumbersCount || c.numbersCount || 0,
      balance: Number(c.balance || 0),
      currency: c.currency || 'USD',
      smsCount: c.smsCount || 0,
      inboundSmsCount: c.inboundSmsCount || 0,
      outboundSmsCount: c.outboundSmsCount || 0,
      permissions: c.permissions || [],
      lastLoginAt: c.lastLoginAt || null,
      createdAt: c.createdAt || new Date().toISOString(),
      organization: c.organization || c.companyName || 'Enterprise Client',
    }));

    const kpis = this.calculateKpis(items);
    return {
      items,
      total: liveRes?.pagination?.total ?? liveRes?.total ?? items.length,
      kpis,
    };
  }

  /**
   * Calculate executive KPIs across clients strictly from real records
   */
  public calculateKpis(allClients: ClientItem[]): ClientKpiSummary {
    const totalClients = allClients.length;
    const activeClients = allClients.filter((c) => c.status === 'ACTIVE').length;
    const suspendedClients = allClients.filter((c) => c.status === 'SUSPENDED').length;
    const totalAssignedNumbers = allClients.reduce((acc, c) => acc + (c.assignedNumbersCount || 0), 0);
    const totalWalletBalance = allClients.reduce((acc, c) => acc + (c.balance || 0), 0);
    const totalSmsCount = allClients.reduce((acc, c) => acc + (c.smsCount || 0), 0);
    const averageBalance = totalClients > 0 ? totalWalletBalance / totalClients : 0;

    return {
      totalClients,
      activeClients,
      suspendedClients,
      totalAssignedNumbers,
      totalWalletBalance,
      totalSmsCount,
      averageBalance,
    };
  }

  /**
   * Fetch single client details by ID from API
   */
  public async fetchClientById(id: string): Promise<ClientDetail> {
    const live = await apiClient.getClientById(id);
    if (!live) {
      throw new Error(`Client account with ID '${id}' not found`);
    }

    const c = live.client || live;

    return {
      id: c.id,
      userId: c.userId || c.id,
      name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Client',
      email: c.email,
      companyName: c.companyName || 'Enterprise Client',
      contactPhone: c.contactPhone || c.contact || '',
      billingType: (c.billingType as BillingType) || 'PREPAID',
      status: (c.status as ClientStatus) || 'ACTIVE',
      managerId: c.managerId || null,
      managerName: c.managerName || null,
      agentId: c.agentId || null,
      agentName: c.agentName || null,
      agentEmail: c.agentEmail || null,
      assignedNumbersCount: c.assignedNumbersCount || c.numbersCount || (c.numbers?.length ?? 0),
      balance: Number(c.balance || c.financials?.balance || 0),
      currency: c.currency || 'USD',
      smsCount: c.smsCount || 0,
      inboundSmsCount: c.inboundSmsCount || 0,
      outboundSmsCount: c.outboundSmsCount || 0,
      permissions: c.permissions || [],
      lastLoginAt: c.lastLoginAt || null,
      createdAt: c.createdAt || new Date().toISOString(),
      organization: c.organization || c.companyName || 'Enterprise Client',
      agent: c.agent || null,
      manager: c.manager || null,
      numbers: (c.numbers || []).map((n: any) => ({
        id: n.id,
        e164: n.e164,
        country: n.country || { name: 'Unknown', isoCode: 'UN', flag: '🌐' },
        operator: n.operator || { name: 'Direct' },
        assignedAt: n.assignedAt || n.createdAt || new Date().toISOString(),
        monthlyCost: Number(n.monthlyCost || 0),
        status: n.status || 'ASSIGNED',
        totalMessages: n.totalMessages || 0,
      })),
      financials: c.financials || {
        balance: Number(c.balance || 0),
        currency: c.currency || 'USD',
        creditLimit: Number(c.creditLimit || 0),
        availableCredit: Number(c.balance || 0),
        totalSpent: 0,
        billingType: (c.billingType as BillingType) || 'PREPAID',
        lastRechargeDate: null,
        lastRechargeAmount: null,
        recentTransactions: [],
      },
      recentSms: (c.recentSms || []).map((s: any) => ({
        id: s.id,
        sender: s.sender || s.fromNumber,
        receiver: s.receiver || s.toNumber,
        status: s.status,
        direction: s.direction || 'INBOUND',
        timestamp: s.timestamp || s.receivedAt,
        cost: Number(s.cost || 0),
      })),
      recentActivity: (c.recentActivity || []).map((a: any) => ({
        id: a.id,
        action: a.action,
        description: a.description,
        timestamp: a.timestamp || a.createdAt,
        actor: a.actor || 'System',
      })),
      apiAccess: c.apiAccess || {
        enabled: Boolean(c.apiKey),
        rateLimitPerSecond: 100,
        activeKeysCount: c.apiKey ? 1 : 0,
        lastUsedAt: null,
      },
    };
  }

  /**
   * Create new client account via API
   */
  public async createClient(payload: CreateClientPayload): Promise<ClientItem> {
    const res = await apiClient.createClient({
      name: payload.name,
      email: payload.email,
      companyName: payload.companyName,
      contact: payload.contactPhone,
      billingType: payload.billingType,
      agentId: payload.agentId,
      status: payload.status,
      initialBalance: payload.initialBalance,
      creditLimit: payload.creditLimit,
    });

    const c = res.client || res;

    return {
      id: c.id,
      userId: c.userId || c.id,
      name: c.name || payload.name,
      email: c.email || payload.email,
      companyName: c.companyName || payload.companyName,
      contactPhone: c.contactPhone || payload.contactPhone,
      billingType: payload.billingType,
      status: (c.status as ClientStatus) || payload.status || 'ACTIVE',
      managerId: c.managerId || null,
      managerName: c.managerName || null,
      agentId: payload.agentId || null,
      agentName: null,
      agentEmail: null,
      assignedNumbersCount: 0,
      balance: payload.initialBalance || 0,
      currency: 'USD',
      smsCount: 0,
      inboundSmsCount: 0,
      outboundSmsCount: 0,
      permissions: ['messages.send', 'numbers.read', 'billing.view'],
      lastLoginAt: null,
      createdAt: c.createdAt || new Date().toISOString(),
      organization: payload.companyName,
    };
  }

  /**
   * Update mutable client profile fields via API
   */
  public async updateClient(id: string, payload: UpdateClientPayload): Promise<ClientItem> {
    const res = await apiClient.updateClient(id, payload);
    const c = res.client || res;

    return {
      id: c.id,
      userId: c.userId || c.id,
      name: c.name,
      email: c.email,
      companyName: c.companyName,
      contactPhone: c.contactPhone || c.contact || '',
      billingType: (c.billingType as BillingType) || 'PREPAID',
      status: (c.status as ClientStatus) || 'ACTIVE',
      managerId: c.managerId || null,
      managerName: c.managerName || null,
      agentId: c.agentId || null,
      agentName: c.agentName || null,
      agentEmail: c.agentEmail || null,
      assignedNumbersCount: c.assignedNumbersCount || 0,
      balance: Number(c.balance || 0),
      currency: c.currency || 'USD',
      smsCount: c.smsCount || 0,
      inboundSmsCount: c.inboundSmsCount || 0,
      outboundSmsCount: c.outboundSmsCount || 0,
      permissions: c.permissions || [],
      lastLoginAt: c.lastLoginAt || null,
      createdAt: c.createdAt,
      organization: c.organization || c.companyName || 'Enterprise Client',
    };
  }

  /**
   * Update lifecycle status via API
   */
  public async updateStatus(id: string, status: ClientStatus, reason?: string): Promise<ClientItem> {
    const res = await apiClient.updateClientStatus(id, status, reason);
    const c = res.client || res;

    return {
      id: c.id,
      userId: c.userId || c.id,
      name: c.name,
      email: c.email,
      companyName: c.companyName,
      contactPhone: c.contactPhone || c.contact || '',
      billingType: (c.billingType as BillingType) || 'PREPAID',
      status: (c.status as ClientStatus) || status,
      managerId: c.managerId || null,
      managerName: c.managerName || null,
      agentId: c.agentId || null,
      agentName: c.agentName || null,
      agentEmail: c.agentEmail || null,
      assignedNumbersCount: c.assignedNumbersCount || 0,
      balance: Number(c.balance || 0),
      currency: c.currency || 'USD',
      smsCount: c.smsCount || 0,
      inboundSmsCount: c.inboundSmsCount || 0,
      outboundSmsCount: c.outboundSmsCount || 0,
      permissions: c.permissions || [],
      lastLoginAt: c.lastLoginAt || null,
      createdAt: c.createdAt,
      organization: c.organization || c.companyName || 'Enterprise Client',
    };
  }

  public async updateClientStatus(id: string, status: ClientStatus, reason?: string): Promise<ClientItem> {
    return this.updateStatus(id, status, reason);
  }

  public async assignAgent(clientId: string, agentId: string | null): Promise<ClientItem> {
    return this.updateClient(clientId, { agentId: agentId || undefined });
  }

  /**
   * Reset client password via API
   */
  public async resetPassword(
    id: string,
    options: { newPassword?: string; autoGenerate?: boolean }
  ): Promise<{ temporaryPassword?: string }> {
    return apiClient.resetClientPassword(id, options);
  }

  /**
   * Update client permissions via API
   */
  public async updatePermissions(id: string, permissions: string[]): Promise<ClientItem> {
    const res = await apiClient.updateClientPermissions(id, permissions);
    const c = res.client || res;

    return {
      id: c.id,
      userId: c.userId || c.id,
      name: c.name,
      email: c.email,
      companyName: c.companyName,
      contactPhone: c.contactPhone || c.contact || '',
      billingType: (c.billingType as BillingType) || 'PREPAID',
      status: (c.status as ClientStatus) || 'ACTIVE',
      managerId: c.managerId || null,
      managerName: c.managerName || null,
      agentId: c.agentId || null,
      agentName: c.agentName || null,
      agentEmail: c.agentEmail || null,
      assignedNumbersCount: c.assignedNumbersCount || 0,
      balance: Number(c.balance || 0),
      currency: c.currency || 'USD',
      smsCount: c.smsCount || 0,
      inboundSmsCount: c.inboundSmsCount || 0,
      outboundSmsCount: c.outboundSmsCount || 0,
      permissions: c.permissions || permissions,
      lastLoginAt: c.lastLoginAt || null,
      createdAt: c.createdAt,
      organization: c.organization || c.companyName || 'Enterprise Client',
    };
  }

  /**
   * Configure API credentials & rate limiting via API
   */
  public async configureApiAccess(
    id: string,
    payload: { enabled: boolean; rateLimitPerSecond?: number; rotateSecret?: boolean }
  ): Promise<{ apiKey: string; apiSecret?: string }> {
    return apiClient.configureClientApiAccess(id, payload);
  }

  /**
   * Fetch agents for assignment dropdown from API
   */
  public async fetchAgents(): Promise<AgentSummary[]> {
    try {
      const res = await apiClient.getAgents();
      const list = res?.items && Array.isArray(res.items) ? res.items : Array.isArray(res) ? res : [];
      return list.map((a: any) => ({
        id: a.id,
        userId: a.userId || a.id,
        name: a.name || `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'Agent',
        email: a.email,
        managerId: a.managerId || null,
        managerName: a.managerName || null,
        department: a.department || null,
        clientsCount: a.clientsCount || 0,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Fetch managers for assignment dropdown from API
   */
  public async fetchManagers(): Promise<ManagerSummary[]> {
    try {
      const res = await apiClient.getManagers();
      const list = res?.items && Array.isArray(res.items) ? res.items : Array.isArray(res) ? res : [];
      return list.map((m: any) => ({
        id: m.id,
        userId: m.userId || m.id,
        name: m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Manager',
        email: m.email,
        department: m.department || '',
      }));
    } catch {
      return [];
    }
  }

  /**
   * Fetch numbers assigned to this client from API
   */
  public async fetchClientNumbers(clientId: string): Promise<ClientNumberSummary[]> {
    try {
      const res = await apiClient.getClientNumbers(clientId);
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  }

  /**
   * Fetch wallet balance & ledger summary from API
   */
  public async fetchClientFinancials(clientId: string): Promise<ClientFinancialSummary> {
    try {
      const res = await apiClient.getClientBalance(clientId);
      return res || {
        balance: 0,
        currency: 'USD',
        creditLimit: 0,
        availableCredit: 0,
        totalSpent: 0,
        billingType: 'PREPAID',
        lastRechargeDate: null,
        lastRechargeAmount: null,
        recentTransactions: [],
      };
    } catch {
      return {
        balance: 0,
        currency: 'USD',
        creditLimit: 0,
        availableCredit: 0,
        totalSpent: 0,
        billingType: 'PREPAID',
        lastRechargeDate: null,
        lastRechargeAmount: null,
        recentTransactions: [],
      };
    }
  }

  /**
   * Fetch client activity history from API
   */
  public async fetchClientActivity(clientId: string): Promise<ClientActivityItem[]> {
    try {
      const res = await apiClient.getClientActivity(clientId);
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  }
}

export const clientsService = new ClientsService();
