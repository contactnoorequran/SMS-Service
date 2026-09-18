/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ManagerItem,
  ManagerDetail,
  ManagerAgentItem,
  ManagerKpiSummary,
  ManagerFilterState,
  CreateManagerPayload,
  UpdateManagerPayload,
  ManagerStatus,
  CapacityStatus,
  AgentPoolItem,
} from '../types/managers';
import { apiClient } from './api';

// Helper to determine capacity status & percentage
export function calculateCapacity(assigned: number, max: number): {
  percentage: number;
  available: number;
  status: CapacityStatus;
} {
  const safeMax = Math.max(1, max);
  const safeAssigned = Math.max(0, assigned);
  const percentage = Math.min(100, Math.round((safeAssigned / safeMax) * 100));
  const available = Math.max(0, safeMax - safeAssigned);

  let status: CapacityStatus = 'AVAILABLE';
  if (percentage >= 100) {
    status = 'FULL';
  } else if (percentage >= 80) {
    status = 'NEAR_CAPACITY';
  }

  return { percentage, available, status };
}

export class ManagersService {
  /**
   * Calculate summary KPIs strictly from actual manager records
   */
  public calculateKpis(list: ManagerItem[]): ManagerKpiSummary {
    const totalManagers = list.length;
    const activeManagers = list.filter((m) => m.status === 'ACTIVE').length;
    const suspendedManagers = list.filter((m) => m.status === 'SUSPENDED').length;

    let totalAssignedAgents = 0;
    let totalMaxCapacity = 0;

    list.forEach((m) => {
      totalAssignedAgents += m.assignedAgentsCount;
      totalMaxCapacity += m.maxAgents;
    });

    const availableCapacity = Math.max(0, totalMaxCapacity - totalAssignedAgents);

    return {
      totalManagers,
      activeManagers,
      suspendedManagers,
      availableCapacity,
      totalAssignedAgents,
      totalMaxCapacity,
    };
  }

  /**
   * Fetch all unique departments from backend
   */
  public async fetchDepartments(): Promise<string[]> {
    try {
      const depts = await apiClient.getManagerDepartments();
      if (Array.isArray(depts)) return depts;
    } catch {
      // ignore
    }
    return [];
  }

  /**
   * Fetch filtered and sorted list of managers directly from API
   */
  public async fetchManagers(
    filters?: Partial<ManagerFilterState>
  ): Promise<{
    items: ManagerItem[];
    total: number;
    kpis: ManagerKpiSummary;
    departments: string[];
  }> {
    const response = await apiClient.getManagers({
      search: filters?.search,
      status: filters?.status,
      department: filters?.department,
      page: filters?.page,
      limit: filters?.limit,
      sortBy: filters?.sortBy,
      sortDir: filters?.sortDir,
    });

    const rawList = response?.items && Array.isArray(response.items) ? response.items : [];

    const items: ManagerItem[] = rawList.map((m: any) => {
      const cap = calculateCapacity(m.agentsCount || 0, m.maxAgents || 10);
      return {
        id: m.id,
        userId: m.userId || m.id,
        name: m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.username || 'Manager',
        email: m.email,
        department: m.department || '',
        status: (m.status as ManagerStatus) || 'ACTIVE',
        maxAgents: m.maxAgents || 10,
        assignedAgentsCount: m.agentsCount || 0,
        availableSlots: cap.available,
        capacityPercentage: cap.percentage,
        capacityStatus: cap.status,
        permissions: m.permissions || [],
        createdAt: m.createdAt || new Date().toISOString(),
        lastLoginAt: m.lastLoginAt || null,
      };
    });

    const kpis = this.calculateKpis(items);
    const departments = await this.fetchDepartments();

    return {
      items,
      total: response?.total ?? items.length,
      kpis,
      departments,
    };
  }

  /**
   * Fetch single manager with full details from API
   */
  public async fetchManagerById(id: string): Promise<ManagerDetail | null> {
    const response = await apiClient.getManagerById(id);
    if (!response) return null;

    const cap = calculateCapacity(response.agentsCount || response.agents?.length || 0, response.maxAgents || 10);

    return {
      id: response.id,
      userId: response.userId || response.id,
      name: response.name || `${response.firstName || ''} ${response.lastName || ''}`.trim() || 'Manager',
      email: response.email,
      department: response.department || '',
      status: response.status as ManagerStatus,
      maxAgents: response.maxAgents || 10,
      assignedAgentsCount: response.agentsCount || response.agents?.length || 0,
      availableSlots: cap.available,
      capacityPercentage: cap.percentage,
      capacityStatus: cap.status,
      permissions: response.permissions || [],
      createdAt: response.createdAt,
      lastLoginAt: response.lastLoginAt || null,
      agents: (response.agents || []).map((a: any) => ({
        id: a.id,
        userId: a.userId || a.id,
        name: a.name || `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'Agent',
        email: a.email,
        status: a.status || 'ACTIVE',
        assignedAt: a.assignedAt || a.createdAt || new Date().toISOString(),
        clientsCount: a.clientsCount || 0,
      })),
      recentActivity: (response.recentActivity || []).map((act: any) => ({
        id: act.id,
        action: act.action,
        description: act.description,
        timestamp: act.timestamp || act.createdAt,
      })),
    };
  }

  /**
   * Create a new manager via API
   */
  public async createManager(payload: CreateManagerPayload): Promise<ManagerItem> {
    const res = await apiClient.createManager({
      username: payload.email.split('@')[0],
      name: payload.name,
      email: payload.email,
      department: payload.department,
      maxAgents: payload.maxAgents,
      status: payload.status,
      password: payload.password,
    });

    const m = res.manager;
    const cap = calculateCapacity(0, m.maxAgents || payload.maxAgents || 10);

    return {
      id: m.id,
      userId: m.userId || m.id,
      name: m.name || payload.name,
      email: m.email || payload.email,
      department: m.department || payload.department,
      status: m.status as ManagerStatus,
      maxAgents: m.maxAgents || payload.maxAgents,
      assignedAgentsCount: 0,
      availableSlots: cap.available,
      capacityPercentage: 0,
      capacityStatus: 'AVAILABLE',
      permissions: m.permissions || payload.permissions || [],
      createdAt: m.createdAt || new Date().toISOString(),
      lastLoginAt: null,
    };
  }

  /**
   * Update manager profile & configuration via API
   */
  public async updateManager(id: string, payload: UpdateManagerPayload): Promise<ManagerItem> {
    const m = await apiClient.updateManager(id, {
      name: payload.name,
      department: payload.department,
      maxAgents: payload.maxAgents,
      status: payload.status,
    });

    const cap = calculateCapacity(m.agentsCount || 0, m.maxAgents || 10);

    return {
      id: m.id,
      userId: m.userId || m.id,
      name: m.name,
      email: m.email,
      department: m.department || '',
      status: m.status as ManagerStatus,
      maxAgents: m.maxAgents || 10,
      assignedAgentsCount: m.agentsCount || 0,
      availableSlots: cap.available,
      capacityPercentage: cap.percentage,
      capacityStatus: cap.status,
      permissions: m.permissions || [],
      createdAt: m.createdAt,
      lastLoginAt: m.lastLoginAt || null,
    };
  }

  /**
   * Update manager lifecycle status via API
   */
  public async updateStatus(id: string, status: ManagerStatus, reason?: string): Promise<ManagerItem> {
    const m = await apiClient.updateManagerStatus(id, status, reason);
    const cap = calculateCapacity(m.agentsCount || 0, m.maxAgents || 10);

    return {
      id: m.id,
      userId: m.userId || m.id,
      name: m.name,
      email: m.email,
      department: m.department || '',
      status: m.status as ManagerStatus,
      maxAgents: m.maxAgents || 10,
      assignedAgentsCount: m.agentsCount || 0,
      availableSlots: cap.available,
      capacityPercentage: cap.percentage,
      capacityStatus: cap.status,
      permissions: m.permissions || [],
      createdAt: m.createdAt,
      lastLoginAt: m.lastLoginAt || null,
    };
  }

  public async updateManagerStatus(id: string, status: ManagerStatus, reason?: string): Promise<ManagerItem> {
    return this.updateStatus(id, status, reason);
  }

  /**
   * Reset manager password via API
   */
  public async resetPassword(
    id: string,
    options: { newPassword?: string; autoGenerate?: boolean }
  ): Promise<{ temporaryPassword?: string }> {
    return apiClient.resetManagerPassword(id, options);
  }

  /**
   * Update manager granular permissions via API
   */
  public async updatePermissions(id: string, permissions: string[]): Promise<ManagerItem> {
    const m = await apiClient.updateManagerPermissions(id, permissions);
    const cap = calculateCapacity(m.agentsCount || 0, m.maxAgents || 10);

    return {
      id: m.id,
      userId: m.userId || m.id,
      name: m.name,
      email: m.email,
      department: m.department || '',
      status: m.status as ManagerStatus,
      maxAgents: m.maxAgents || 10,
      assignedAgentsCount: m.agentsCount || 0,
      availableSlots: cap.available,
      capacityPercentage: cap.percentage,
      capacityStatus: cap.status,
      permissions: m.permissions || permissions,
      createdAt: m.createdAt,
      lastLoginAt: m.lastLoginAt || null,
    };
  }

  /**
   * Fetch available unassigned agents pool from API
   */
  public async fetchAvailableAgentsPool(): Promise<AgentPoolItem[]> {
    try {
      const res = await apiClient.getAgents();
      const agents = res?.items && Array.isArray(res.items) ? res.items : Array.isArray(res) ? res : [];
      return agents.map((a: any) => ({
        id: a.id,
        name: a.name || `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'Agent',
        email: a.email,
        status: a.status || 'ACTIVE',
        assignedManagerId: a.managerId || null,
        assignedManagerName: a.managerName || null,
        clientsCount: a.clientsCount || 0,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Assign an available agent to a manager via API
   */
  public async assignAgentToManager(
    managerId: string,
    agentId: string
  ): Promise<{ success: boolean; manager: ManagerItem }> {
    await apiClient.assignAgentManager(agentId, managerId);
    const updated = await this.fetchManagerById(managerId);
    if (!updated) throw new Error('Manager not found');
    return { success: true, manager: updated };
  }

  /**
   * Unassign an agent from a manager via API
   */
  public async unassignAgentFromManager(
    managerId: string,
    agentId: string
  ): Promise<{ success: boolean; manager: ManagerItem }> {
    await apiClient.assignAgentManager(agentId, null);
    const updated = await this.fetchManagerById(managerId);
    if (!updated) throw new Error('Manager not found');
    return { success: true, manager: updated };
  }

  /**
   * Effective manager permissions from RBAC
   */
  public async fetchManagerPermissions(): Promise<string[]> {
    return [
      'users.read',
      'numbers.read',
      'numbers.assign',
      'providers.read',
      'messages.read',
      'rates.read',
      'dashboard.read',
      'reports.generate',
    ];
  }
}

export const managersService = new ManagersService();
