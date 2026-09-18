/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AgentItem,
  AgentDetail,
  AgentStatus,
  AgentKpiSummary,
  AgentFilterState,
  CreateAgentPayload,
  UpdateAgentPayload,
  ManagerSummary,
  AgentClientSummary,
  AgentNumberSummary,
  AgentCommissionSummary,
} from '../types/agents';
import { calculateCapacity } from './managers';
import { apiClient } from './api';

export class AgentsService {
  /**
   * Calculate KPIs dynamically from real agent items
   */
  public calculateKpis(list: AgentItem[]): AgentKpiSummary {
    const totalAgents = list.length;
    const activeAgents = list.filter((a) => a.status === 'ACTIVE').length;
    const suspendedAgents = list.filter((a) => a.status === 'SUSPENDED').length;

    let totalClientsManaged = 0;
    let totalAssignedNumbers = 0;
    let totalCommissionEarned = 0;

    list.forEach((a) => {
      totalClientsManaged += a.clientsCount || 0;
      totalAssignedNumbers += a.assignedNumbersCount || 0;
      totalCommissionEarned += a.earnings || 0;
    });

    const averageClientsPerAgent = totalAgents > 0 ? Math.round(totalClientsManaged / totalAgents) : 0;

    return {
      totalAgents,
      activeAgents,
      suspendedAgents,
      totalClientsManaged,
      totalAssignedNumbers,
      totalCommissionEarned,
      averageClientsPerAgent,
    };
  }

  /**
   * Fetch managers list with real capacity
   */
  public async fetchManagers(): Promise<ManagerSummary[]> {
    try {
      const res = await apiClient.getManagers();
      const list = res?.items && Array.isArray(res.items) ? res.items : Array.isArray(res) ? res : [];
      return list.map((m: any) => {
        const cap = calculateCapacity(m.agentsCount || 0, m.maxAgents || 10);
        return {
          id: m.id,
          userId: m.userId || m.id,
          name: m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Manager',
          email: m.email,
          department: m.department || '',
          maxAgents: m.maxAgents || 10,
          assignedAgentsCount: m.agentsCount || 0,
          availableSlots: cap.available,
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Fetch filtered and paginated list of agents directly from API
   */
  public async fetchAgents(filters?: Partial<AgentFilterState>): Promise<{
    items: AgentItem[];
    total: number;
    kpis: AgentKpiSummary;
  }> {
    const response = await apiClient.getAgents({
      search: filters?.search,
      status: filters?.status,
      managerId: filters?.managerId,
      page: filters?.page,
      limit: filters?.limit,
      sortBy: filters?.sortBy,
      sortDir: filters?.sortDir,
    });

    const rawList = response?.items && Array.isArray(response.items) ? response.items : [];

    const items: AgentItem[] = rawList.map((a: any) => ({
      id: a.id,
      userId: a.userId || a.id,
      name: a.name || `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'Agent',
      email: a.email,
      status: (a.status as AgentStatus) || 'ACTIVE',
      managerId: a.managerId || null,
      managerName: a.managerName || null,
      managerEmail: a.managerEmail || null,
      department: a.department || null,
      clientsCount: a.clientsCount || 0,
      assignedNumbersCount: a.assignedNumbersCount || 0,
      commissionRate: a.commissionRate || 0.05,
      earnings: a.earnings || 0,
      permissions: a.permissions || [],
      lastLoginAt: a.lastLoginAt || null,
      createdAt: a.createdAt || new Date().toISOString(),
      organization: a.organization || 'SMS Hub Global',
    }));

    const kpis = this.calculateKpis(items);
    return {
      items,
      total: response?.total ?? items.length,
      kpis,
    };
  }

  /**
   * Fetch single agent with details from API
   */
  public async fetchAgentById(id: string): Promise<AgentDetail | null> {
    const a = await apiClient.getAgentById(id);
    if (!a) return null;

    const agentData = a.agent || a;

    return {
      id: agentData.id,
      userId: agentData.userId || agentData.id,
      name: agentData.name || `${agentData.firstName || ''} ${agentData.lastName || ''}`.trim() || 'Agent',
      email: agentData.email,
      status: (agentData.status as AgentStatus) || 'ACTIVE',
      managerId: agentData.managerId || null,
      managerName: agentData.managerName || null,
      managerEmail: agentData.managerEmail || null,
      department: agentData.department || null,
      clientsCount: agentData.clientsCount || (agentData.clients?.length ?? 0),
      assignedNumbersCount: agentData.assignedNumbersCount || (agentData.numbers?.length ?? 0),
      commissionRate: agentData.commissionRate || 0.05,
      earnings: agentData.earnings || 0,
      permissions: agentData.permissions || [],
      lastLoginAt: agentData.lastLoginAt || null,
      createdAt: agentData.createdAt || new Date().toISOString(),
      organization: agentData.organization || 'SMS Hub Global',
      manager: agentData.manager || null,
      clients: (agentData.clients || []).map((c: any) => ({
        id: c.id,
        name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Client',
        companyName: c.companyName || 'Enterprise Client',
        email: c.email,
        assignedNumbersCount: c.assignedNumbersCount || 0,
        monthlyVolume: c.monthlyVolume || 0,
        balance: c.balance || 0,
        status: c.status || 'ACTIVE',
      })),
      numbers: (agentData.numbers || []).map((n: any) => ({
        id: n.id,
        e164: n.e164,
        country: n.country || { name: 'Unknown', isoCode: 'UN', flag: '🌐' },
        operator: n.operator || { name: 'Direct Gateway' },
        clientId: n.clientId || '',
        clientName: n.clientName || 'Client',
        status: n.status || 'ACTIVE',
        monthlyMessages: n.monthlyMessages || 0,
      })),
      commission: agentData.commission || {
        earned: agentData.earnings || 0,
        pending: 0,
        paid: agentData.earnings || 0,
        rate: agentData.commissionRate || 0.05,
        currentPeriod: '',
        historical: [],
      },
      recentActivity: (agentData.recentActivity || []).map((act: any) => ({
        id: act.id,
        action: act.action,
        description: act.description,
        timestamp: act.timestamp || act.createdAt,
      })),
    };
  }

  /**
   * Create a new agent profile via API
   */
  public async createAgent(payload: CreateAgentPayload): Promise<AgentItem> {
    const res = await apiClient.createAgent({
      name: payload.name,
      email: payload.email,
      password: payload.password,
      managerId: payload.managerId,
      status: payload.status,
    });

    const a = res.agent || res;

    return {
      id: a.id,
      userId: a.userId || a.id,
      name: a.name || payload.name,
      email: a.email || payload.email,
      status: (a.status as AgentStatus) || payload.status || 'ACTIVE',
      managerId: a.managerId || payload.managerId || null,
      managerName: a.managerName || null,
      managerEmail: a.managerEmail || null,
      department: a.department || null,
      clientsCount: 0,
      assignedNumbersCount: 0,
      commissionRate: payload.commissionRate || 0.05,
      earnings: 0.0,
      permissions: a.permissions || ['clients.read', 'numbers.read', 'messages.read', 'cdr.read'],
      lastLoginAt: null,
      createdAt: a.createdAt || new Date().toISOString(),
      organization: 'SMS Hub Global',
    };
  }

  /**
   * Update agent details via API
   */
  public async updateAgent(id: string, payload: UpdateAgentPayload): Promise<AgentItem> {
    const a = await apiClient.updateAgent(id, payload);
    const agent = a.agent || a;

    return {
      id: agent.id,
      userId: agent.userId || agent.id,
      name: agent.name || payload.name || '',
      email: agent.email,
      status: (agent.status as AgentStatus) || 'ACTIVE',
      managerId: agent.managerId || null,
      managerName: agent.managerName || null,
      managerEmail: agent.managerEmail || null,
      department: agent.department || null,
      clientsCount: agent.clientsCount || 0,
      assignedNumbersCount: agent.assignedNumbersCount || 0,
      commissionRate: agent.commissionRate || payload.commissionRate || 0.05,
      earnings: agent.earnings || 0,
      permissions: agent.permissions || [],
      lastLoginAt: agent.lastLoginAt || null,
      createdAt: agent.createdAt,
      organization: 'SMS Hub Global',
    };
  }

  /**
   * Update agent status via API
   */
  public async updateStatus(id: string, status: AgentStatus, reason?: string): Promise<AgentItem> {
    const a = await apiClient.updateAgentStatus(id, status, reason);
    const agent = a.agent || a;

    return {
      id: agent.id,
      userId: agent.userId || agent.id,
      name: agent.name,
      email: agent.email,
      status: (agent.status as AgentStatus) || status,
      managerId: agent.managerId || null,
      managerName: agent.managerName || null,
      managerEmail: agent.managerEmail || null,
      department: agent.department || null,
      clientsCount: agent.clientsCount || 0,
      assignedNumbersCount: agent.assignedNumbersCount || 0,
      commissionRate: agent.commissionRate || 0.05,
      earnings: agent.earnings || 0,
      permissions: agent.permissions || [],
      lastLoginAt: agent.lastLoginAt || null,
      createdAt: agent.createdAt,
      organization: 'SMS Hub Global',
    };
  }

  public async updateAgentStatus(id: string, status: AgentStatus, reason?: string): Promise<AgentItem> {
    return this.updateStatus(id, status, reason);
  }

  /**
   * Reset agent password via API
   */
  public async resetPassword(
    id: string,
    options: { newPassword?: string; autoGenerate?: boolean }
  ): Promise<{ temporaryPassword?: string }> {
    return apiClient.resetAgentPassword(id, options);
  }

  /**
   * Update agent permissions via API
   */
  public async updatePermissions(id: string, permissions: string[]): Promise<AgentItem> {
    const a = await apiClient.updateAgentPermissions(id, permissions);
    const agent = a.agent || a;

    return {
      id: agent.id,
      userId: agent.userId || agent.id,
      name: agent.name,
      email: agent.email,
      status: (agent.status as AgentStatus) || 'ACTIVE',
      managerId: agent.managerId || null,
      managerName: agent.managerName || null,
      managerEmail: agent.managerEmail || null,
      department: agent.department || null,
      clientsCount: agent.clientsCount || 0,
      assignedNumbersCount: agent.assignedNumbersCount || 0,
      commissionRate: agent.commissionRate || 0.05,
      earnings: agent.earnings || 0,
      permissions: agent.permissions || permissions,
      lastLoginAt: agent.lastLoginAt || null,
      createdAt: agent.createdAt,
      organization: 'SMS Hub Global',
    };
  }

  /**
   * Reassign agent to a manager via API
   */
  public async assignManager(
    agentId: string,
    managerId: string | null
  ): Promise<AgentItem> {
    const a = await apiClient.assignAgentManager(agentId, managerId);
    const agent = a.agent || a;

    const item: AgentItem = {
      id: agent.id,
      userId: agent.userId || agent.id,
      name: agent.name,
      email: agent.email,
      status: (agent.status as AgentStatus) || 'ACTIVE',
      managerId: agent.managerId || null,
      managerName: agent.managerName || null,
      managerEmail: agent.managerEmail || null,
      department: agent.department || null,
      clientsCount: agent.clientsCount || 0,
      assignedNumbersCount: agent.assignedNumbersCount || 0,
      commissionRate: agent.commissionRate || 0.05,
      earnings: agent.earnings || 0,
      permissions: agent.permissions || [],
      lastLoginAt: agent.lastLoginAt || null,
      createdAt: agent.createdAt,
      organization: 'SMS Hub Global',
    };

    return item;
  }

  /**
   * Fetch clients assigned to agent via API
   */
  public async fetchAgentClients(agentId: string): Promise<AgentClientSummary[]> {
    try {
      const clients = await apiClient.getAgentClients(agentId);
      return Array.isArray(clients) ? clients : [];
    } catch {
      return [];
    }
  }

  /**
   * Fetch numbers assigned to agent's clients via API
   */
  public async fetchAgentNumbers(agentId: string): Promise<AgentNumberSummary[]> {
    try {
      const numbers = await apiClient.getAgentNumbers(agentId);
      return Array.isArray(numbers) ? numbers : [];
    } catch {
      return [];
    }
  }

  /**
   * Fetch agent statistics & earnings via API
   */
  public async fetchAgentStatistics(agentId: string): Promise<any> {
    try {
      return await apiClient.getAgentStatistics(agentId);
    } catch {
      return { totalRevenue: 0, commissionEarned: 0, activeClients: 0, totalMessages: 0 };
    }
  }

  /**
   * Fetch agent recent activity audit logs via API
   */
  public async fetchAgentActivity(agentId: string): Promise<any[]> {
    try {
      const act = await apiClient.getAgentActivity(agentId);
      return Array.isArray(act) ? act : [];
    } catch {
      return [];
    }
  }
}

export const agentsService = new AgentsService();
