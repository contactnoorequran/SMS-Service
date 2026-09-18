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

// Initial realistic fictional demo managers seed
const INITIAL_MANAGERS_SEED: ManagerDetail[] = [
  {
    id: 'mgr-001',
    userId: 'usr-002',
    name: 'Sarah Khan',
    email: 'sarah.khan@smshub.local',
    department: 'Operations',
    status: 'ACTIVE',
    maxAgents: 10,
    assignedAgentsCount: 7,
    availableSlots: 3,
    capacityPercentage: 70,
    capacityStatus: 'AVAILABLE',
    permissions: [
      'users.read',
      'numbers.read',
      'numbers.assign',
      'providers.read',
      'messages.read',
      'rates.read',
      'dashboard.read',
      'reports.generate',
    ],
    createdAt: '2026-01-10T08:30:00.000Z',
    lastLoginAt: '2026-09-15T19:45:00.000Z',
    agents: [
      {
        id: 'ag-101',
        userId: 'usr-ag-101',
        name: 'Liam O’Connor',
        email: 'liam.o@smshub.local',
        status: 'ACTIVE',
        assignedAt: '2026-01-15T10:00:00.000Z',
        clientsCount: 14,
      },
      {
        id: 'ag-102',
        userId: 'usr-ag-102',
        name: 'Amira El-Sayed',
        email: 'amira.e@smshub.local',
        status: 'ACTIVE',
        assignedAt: '2026-01-20T11:30:00.000Z',
        clientsCount: 9,
      },
      {
        id: 'ag-103',
        userId: 'usr-ag-103',
        name: 'Chen Wei',
        email: 'chen.wei@smshub.local',
        status: 'ACTIVE',
        assignedAt: '2026-02-01T09:15:00.000Z',
        clientsCount: 18,
      },
      {
        id: 'ag-104',
        userId: 'usr-ag-104',
        name: 'Lucas Vance',
        email: 'lucas.v@smshub.local',
        status: 'ACTIVE',
        assignedAt: '2026-02-14T14:20:00.000Z',
        clientsCount: 6,
      },
      {
        id: 'ag-105',
        userId: 'usr-ag-105',
        name: 'Sophia Rossi',
        email: 'sophia.r@smshub.local',
        status: 'ACTIVE',
        assignedAt: '2026-03-05T08:45:00.000Z',
        clientsCount: 11,
      },
      {
        id: 'ag-106',
        userId: 'usr-ag-106',
        name: 'David Becker',
        email: 'david.b@smshub.local',
        status: 'ACTIVE',
        assignedAt: '2026-03-22T16:00:00.000Z',
        clientsCount: 5,
      },
      {
        id: 'ag-107',
        userId: 'usr-ag-107',
        name: 'Zoe Martinez',
        email: 'zoe.m@smshub.local',
        status: 'ACTIVE',
        assignedAt: '2026-04-10T12:10:00.000Z',
        clientsCount: 8,
      },
    ],
    recentActivity: [
      {
        id: 'act-1',
        action: 'AGENT_ASSIGNED',
        description: 'Assigned Zoe Martinez to Operations team',
        timestamp: '2026-09-14T14:30:00.000Z',
      },
      {
        id: 'act-2',
        action: 'STATUS_VERIFIED',
        description: 'Completed quarterly agent workload audit',
        timestamp: '2026-09-12T09:15:00.000Z',
      },
    ],
  },
  {
    id: 'mgr-002',
    userId: 'usr-003',
    name: 'Ahmed Malik',
    email: 'ahmed.malik@smshub.local',
    department: 'Telecom',
    status: 'ACTIVE',
    maxAgents: 15,
    assignedAgentsCount: 12,
    availableSlots: 3,
    capacityPercentage: 80,
    capacityStatus: 'NEAR_CAPACITY',
    permissions: [
      'users.read',
      'numbers.read',
      'numbers.assign',
      'providers.read',
      'messages.read',
      'rates.read',
      'dashboard.read',
      'reports.generate',
    ],
    createdAt: '2026-01-18T10:00:00.000Z',
    lastLoginAt: '2026-09-15T21:10:00.000Z',
    agents: [
      {
        id: 'ag-108',
        userId: 'usr-ag-108',
        name: 'Priya Sharma',
        email: 'priya.s@smshub.local',
        status: 'ACTIVE',
        assignedAt: '2026-01-25T10:00:00.000Z',
        clientsCount: 22,
      },
      {
        id: 'ag-109',
        userId: 'usr-ag-109',
        name: 'Marcus Brody',
        email: 'marcus.b@smshub.local',
        status: 'ACTIVE',
        assignedAt: '2026-02-05T13:00:00.000Z',
        clientsCount: 16,
      },
      {
        id: 'ag-110',
        userId: 'usr-ag-110',
        name: 'Fariha Qadir',
        email: 'fariha.q@smshub.local',
        status: 'ACTIVE',
        assignedAt: '2026-02-12T08:00:00.000Z',
        clientsCount: 12,
      },
    ],
    recentActivity: [
      {
        id: 'act-3',
        action: 'CAPACITY_WARNING',
        description: 'Team capacity reached 80% threshold',
        timestamp: '2026-09-15T11:00:00.000Z',
      },
    ],
  },
  {
    id: 'mgr-003',
    userId: 'usr-004',
    name: 'Elena Rostova',
    email: 'elena.rostova@smshub.local',
    department: 'Carrier Routing',
    status: 'ACTIVE',
    maxAgents: 25,
    assignedAgentsCount: 24,
    availableSlots: 1,
    capacityPercentage: 96,
    capacityStatus: 'NEAR_CAPACITY',
    permissions: [
      'users.read',
      'numbers.read',
      'numbers.assign',
      'providers.read',
      'messages.read',
      'rates.read',
      'dashboard.read',
      'reports.generate',
    ],
    createdAt: '2025-11-20T09:00:00.000Z',
    lastLoginAt: '2026-09-15T22:05:00.000Z',
    agents: [
      {
        id: 'ag-111',
        userId: 'usr-ag-111',
        name: 'Tariq Nabil',
        email: 'tariq.n@smshub.local',
        status: 'ACTIVE',
        assignedAt: '2025-12-01T10:00:00.000Z',
        clientsCount: 30,
      },
      {
        id: 'ag-112',
        userId: 'usr-ag-112',
        name: 'Carlos Mendez',
        email: 'carlos.m@smshub.local',
        status: 'ACTIVE',
        assignedAt: '2026-01-05T14:30:00.000Z',
        clientsCount: 19,
      },
    ],
    recentActivity: [
      {
        id: 'act-4',
        action: 'AGENT_REASSIGNED',
        description: 'Reassigned 2 routing agents for EU traffic',
        timestamp: '2026-09-13T17:20:00.000Z',
      },
    ],
  },
  {
    id: 'mgr-004',
    userId: 'usr-005',
    name: 'Daniel Smith',
    email: 'daniel.smith@smshub.local',
    department: 'Enterprise Support',
    status: 'ACTIVE',
    maxAgents: 8,
    assignedAgentsCount: 8,
    availableSlots: 0,
    capacityPercentage: 100,
    capacityStatus: 'FULL',
    permissions: [
      'users.read',
      'numbers.read',
      'messages.read',
      'dashboard.read',
      'reports.generate',
    ],
    createdAt: '2026-02-15T11:45:00.000Z',
    lastLoginAt: '2026-09-14T16:30:00.000Z',
    agents: [
      {
        id: 'ag-113',
        userId: 'usr-ag-113',
        name: 'Aisha Al-Nuaimi',
        email: 'aisha.n@smshub.local',
        status: 'ACTIVE',
        assignedAt: '2026-02-20T09:00:00.000Z',
        clientsCount: 15,
      },
    ],
    recentActivity: [
      {
        id: 'act-5',
        action: 'CAPACITY_REACHED',
        description: 'Maximum agent allocation limit reached (8/8)',
        timestamp: '2026-09-10T12:00:00.000Z',
      },
    ],
  },
  {
    id: 'mgr-005',
    userId: 'usr-006',
    name: 'Olivia Wilson',
    email: 'olivia.wilson@smshub.local',
    department: 'Financial Clearing',
    status: 'SUSPENDED',
    maxAgents: 12,
    assignedAgentsCount: 3,
    availableSlots: 9,
    capacityPercentage: 25,
    capacityStatus: 'AVAILABLE',
    permissions: [
      'users.read',
      'rates.read',
      'rates.manage',
      'wallet.read',
      'dashboard.read',
    ],
    createdAt: '2026-02-28T14:10:00.000Z',
    lastLoginAt: '2026-08-30T10:15:00.000Z',
    agents: [
      {
        id: 'ag-114',
        userId: 'usr-ag-114',
        name: 'James Peterson',
        email: 'james.p@smshub.local',
        status: 'ACTIVE',
        assignedAt: '2026-03-01T10:00:00.000Z',
        clientsCount: 8,
      },
    ],
    recentActivity: [
      {
        id: 'act-6',
        action: 'STATUS_SUSPENDED',
        description: 'Account suspended pending security review',
        timestamp: '2026-09-01T08:00:00.000Z',
      },
    ],
  },
  {
    id: 'mgr-006',
    userId: 'usr-007',
    name: 'Zayed Al-Hassan',
    email: 'zayed.h@smshub.local',
    department: 'Regional Operations',
    status: 'PENDING',
    maxAgents: 15,
    assignedAgentsCount: 0,
    availableSlots: 15,
    capacityPercentage: 0,
    capacityStatus: 'AVAILABLE',
    permissions: [
      'users.read',
      'numbers.read',
      'dashboard.read',
    ],
    createdAt: '2026-09-12T16:00:00.000Z',
    lastLoginAt: null,
    agents: [],
    recentActivity: [
      {
        id: 'act-7',
        action: 'PROFILE_CREATED',
        description: 'Manager profile created, awaiting compliance signoff',
        timestamp: '2026-09-12T16:00:00.000Z',
      },
    ],
  },
];

// Pool of mock agents that can be assigned / unassigned
const INITIAL_AGENT_POOL: AgentPoolItem[] = [
  {
    id: 'ag-101',
    name: 'Liam O’Connor',
    email: 'liam.o@smshub.local',
    status: 'ACTIVE',
    assignedManagerId: 'mgr-001',
    assignedManagerName: 'Sarah Khan',
    clientsCount: 14,
  },
  {
    id: 'ag-102',
    name: 'Amira El-Sayed',
    email: 'amira.e@smshub.local',
    status: 'ACTIVE',
    assignedManagerId: 'mgr-001',
    assignedManagerName: 'Sarah Khan',
    clientsCount: 9,
  },
  {
    id: 'ag-103',
    name: 'Chen Wei',
    email: 'chen.wei@smshub.local',
    status: 'ACTIVE',
    assignedManagerId: 'mgr-001',
    assignedManagerName: 'Sarah Khan',
    clientsCount: 18,
  },
  {
    id: 'ag-108',
    name: 'Priya Sharma',
    email: 'priya.s@smshub.local',
    status: 'ACTIVE',
    assignedManagerId: 'mgr-002',
    assignedManagerName: 'Ahmed Malik',
    clientsCount: 22,
  },
  {
    id: 'ag-109',
    name: 'Marcus Brody',
    email: 'marcus.b@smshub.local',
    status: 'ACTIVE',
    assignedManagerId: 'mgr-002',
    assignedManagerName: 'Ahmed Malik',
    clientsCount: 16,
  },
  {
    id: 'ag-201',
    name: 'Nadia Rostova',
    email: 'nadia.r@smshub.local',
    status: 'ACTIVE',
    assignedManagerId: null,
    assignedManagerName: null,
    clientsCount: 0,
  },
  {
    id: 'ag-202',
    name: 'Alexander Lind',
    email: 'alex.lind@smshub.local',
    status: 'ACTIVE',
    assignedManagerId: null,
    assignedManagerName: null,
    clientsCount: 0,
  },
  {
    id: 'ag-203',
    name: 'Khadija Mansoor',
    email: 'khadija.m@smshub.local',
    status: 'ACTIVE',
    assignedManagerId: null,
    assignedManagerName: null,
    clientsCount: 0,
  },
];

class ManagersService {
  private managers: ManagerDetail[] = JSON.parse(JSON.stringify(INITIAL_MANAGERS_SEED));
  private agentPool: AgentPoolItem[] = JSON.parse(JSON.stringify(INITIAL_AGENT_POOL));

  /**
   * Calculate KPIs dynamically across all managers
   */
  public calculateKpis(list: ManagerItem[] = this.managers): ManagerKpiSummary {
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
   * Fetch all unique departments
   */
  public async fetchDepartments(): Promise<string[]> {
    const set = new Set<string>();
    this.managers.forEach((m) => set.add(m.department));
    return Array.from(set).sort();
  }

  /**
   * Fetch filtered and sorted list of managers
   */
  public async fetchManagers(
    filters?: Partial<ManagerFilterState>
  ): Promise<{
    items: ManagerItem[];
    total: number;
    kpis: ManagerKpiSummary;
    departments: string[];
  }> {
    // Try querying backend first if running
    try {
      const response = await apiClient.getManagers({
        search: filters?.search,
        status: filters?.status,
        department: filters?.department,
        page: filters?.page,
        limit: filters?.limit,
        sortBy: filters?.sortBy,
        sortDir: filters?.sortDir,
      });

      if (response && response.items && Array.isArray(response.items) && response.items.length > 0) {
        // Map backend items to ManagerItem
        const items: ManagerItem[] = response.items.map((m: any) => {
          const cap = calculateCapacity(m.agentsCount || 0, m.maxAgents || 10);
          return {
            id: m.id,
            userId: m.userId || m.id,
            name: m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.username || 'Manager',
            email: m.email,
            department: m.department || 'Operations',
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
        });

        const kpis = this.calculateKpis(items);
        const departments = await this.fetchDepartments();

        return { items, total: response.total || items.length, kpis, departments };
      }
    } catch {
      // Gracefully fall back to rich client-side mock registry
    }

    // Client-side filtering
    let list = [...this.managers];

    if (filters?.search && filters.search.trim() !== '') {
      const term = filters.search.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(term) ||
          m.email.toLowerCase().includes(term) ||
          m.department.toLowerCase().includes(term)
      );
    }

    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((m) => m.status === filters.status);
    }

    if (filters?.department && filters.department !== 'ALL') {
      list = list.filter((m) => m.department === filters.department);
    }

    if (filters?.capacityStatus && filters.capacityStatus !== 'ALL') {
      list = list.filter((m) => m.capacityStatus === filters.capacityStatus);
    }

    // Sorting
    const sortBy = filters?.sortBy || 'createdAt';
    const sortDir = filters?.sortDir || 'desc';

    list.sort((a, b) => {
      let valA: any = a[sortBy as keyof ManagerItem];
      let valB: any = b[sortBy as keyof ManagerItem];

      if (sortBy === 'capacity') {
        valA = a.capacityPercentage;
        valB = b.capacityPercentage;
      } else if (sortBy === 'agents') {
        valA = a.assignedAgentsCount;
        valB = b.assignedAgentsCount;
      } else if (sortBy === 'available') {
        valA = a.availableSlots;
        valB = b.availableSlots;
      }

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toString().toLowerCase();
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      if (typeof valA === 'number') {
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }

      return 0;
    });

    const total = list.length;
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const startIndex = (page - 1) * limit;
    const items = list.slice(startIndex, startIndex + limit);

    const kpis = this.calculateKpis(this.managers);
    const departments = await this.fetchDepartments();

    return { items, total, kpis, departments };
  }

  /**
   * Fetch single manager with full details (profile, capacity, assigned agents, activity)
   */
  public async fetchManagerById(id: string): Promise<ManagerDetail | null> {
    try {
      const response = await apiClient.getManagerById(id);
      if (response) {
        const cap = calculateCapacity(
          response.agents?.length || response.agentsCount || 0,
          response.maxAgents || 10
        );
        return {
          id: response.id,
          userId: response.userId || response.id,
          name: response.name || `${response.firstName || ''} ${response.lastName || ''}`.trim() || 'Manager',
          email: response.email,
          department: response.department || 'Operations',
          status: response.status as ManagerStatus,
          maxAgents: response.maxAgents || 10,
          assignedAgentsCount: response.agents?.length || response.agentsCount || 0,
          availableSlots: cap.available,
          capacityPercentage: cap.percentage,
          capacityStatus: cap.status,
          permissions: response.permissions || [],
          createdAt: response.createdAt,
          lastLoginAt: response.lastLoginAt || null,
          agents: response.agents || [],
          recentActivity: response.recentActivity || [],
        };
      }
    } catch {
      // Fallback
    }

    const found = this.managers.find((m) => m.id === id || m.userId === id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  /**
   * Create a new manager
   */
  public async createManager(payload: CreateManagerPayload): Promise<ManagerItem> {
    const cap = calculateCapacity(0, payload.maxAgents || 10);
    const newId = `mgr-${Date.now().toString(36)}`;
    const newUserId = `usr-${Date.now().toString(36)}`;

    const newManager: ManagerDetail = {
      id: newId,
      userId: newUserId,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      department: payload.department.trim(),
      status: payload.status,
      maxAgents: Math.max(1, payload.maxAgents),
      assignedAgentsCount: 0,
      availableSlots: cap.available,
      capacityPercentage: 0,
      capacityStatus: 'AVAILABLE',
      permissions: payload.permissions || [
        'users.read',
        'numbers.read',
        'numbers.assign',
        'providers.read',
        'messages.read',
        'rates.read',
        'dashboard.read',
        'reports.generate',
      ],
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      agents: [],
      recentActivity: [
        {
          id: `act-${Date.now()}`,
          action: 'CREATED',
          description: 'Manager profile registered in system',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    // Try creating via API if available
    try {
      await apiClient.createManager({
        username: payload.email.split('@')[0],
        name: payload.name,
        email: payload.email,
        department: payload.department,
        maxAgents: payload.maxAgents,
        status: payload.status,
        password: payload.password,
      });
    } catch {
      // Local persistent fallback
    }

    this.managers.unshift(newManager);
    return newManager;
  }

  /**
   * Update manager profile & configuration
   */
  public async updateManager(id: string, payload: UpdateManagerPayload): Promise<ManagerItem> {
    const target = this.managers.find((m) => m.id === id);
    if (!target) {
      throw new Error(`Manager with ID '${id}' not found`);
    }

    if (payload.name) target.name = payload.name.trim();
    if (payload.department) target.department = payload.department.trim();
    if (payload.maxAgents !== undefined) {
      target.maxAgents = Math.max(target.assignedAgentsCount, payload.maxAgents);
    }
    if (payload.status) target.status = payload.status;
    if (payload.permissions) target.permissions = payload.permissions;

    const cap = calculateCapacity(target.assignedAgentsCount, target.maxAgents);
    target.availableSlots = cap.available;
    target.capacityPercentage = cap.percentage;
    target.capacityStatus = cap.status;

    target.recentActivity.unshift({
      id: `act-${Date.now()}`,
      action: 'UPDATED',
      description: 'Manager profile updated by administrator',
      timestamp: new Date().toISOString(),
    });

    try {
      await apiClient.updateManager(id, {
        name: payload.name,
        department: payload.department,
        maxAgents: payload.maxAgents,
      });
    } catch {
      // Fallback
    }

    return target;
  }

  /**
   * Update manager account status with optional audit reason
   */
  public async updateManagerStatus(
    id: string,
    status: ManagerStatus,
    reason?: string
  ): Promise<ManagerItem> {
    const target = this.managers.find((m) => m.id === id);
    if (!target) {
      throw new Error(`Manager with ID '${id}' not found`);
    }

    const previousStatus = target.status;
    target.status = status;

    target.recentActivity.unshift({
      id: `act-${Date.now()}`,
      action: `STATUS_${status}`,
      description: `Status changed from ${previousStatus} to ${status}${reason ? `: ${reason}` : ''}`,
      timestamp: new Date().toISOString(),
    });

    try {
      await apiClient.updateManagerStatus(id, status, reason);
    } catch {
      // Fallback
    }

    return target;
  }

  /**
   * Fetch assigned agents for a manager
   */
  public async fetchManagerAgents(managerId: string): Promise<ManagerAgentItem[]> {
    const target = this.managers.find((m) => m.id === managerId);
    return target ? [...target.agents] : [];
  }

  /**
   * Fetch available agent pool
   */
  public async fetchAvailableAgentsPool(): Promise<AgentPoolItem[]> {
    return [...this.agentPool];
  }

  /**
   * Assign an available agent to a manager
   */
  public async assignAgentToManager(
    managerId: string,
    agentId: string
  ): Promise<{ success: boolean; manager: ManagerItem }> {
    const manager = this.managers.find((m) => m.id === managerId);
    if (!manager) {
      throw new Error(`Manager with ID '${managerId}' not found`);
    }

    if (manager.assignedAgentsCount >= manager.maxAgents) {
      throw new Error(`Manager has reached maximum agent capacity (${manager.maxAgents} agents)`);
    }

    const agent = this.agentPool.find((a) => a.id === agentId);
    if (!agent) {
      throw new Error(`Agent with ID '${agentId}' not found`);
    }

    // Check if already assigned
    const alreadyAssigned = manager.agents.some((a) => a.id === agentId);
    if (alreadyAssigned) {
      return { success: true, manager };
    }

    // Add to manager's agents
    const newAssignedAgent: ManagerAgentItem = {
      id: agent.id,
      userId: `usr-${agent.id}`,
      name: agent.name,
      email: agent.email,
      status: agent.status,
      assignedAt: new Date().toISOString(),
      clientsCount: agent.clientsCount || 0,
    };

    manager.agents.unshift(newAssignedAgent);
    manager.assignedAgentsCount = manager.agents.length;

    const cap = calculateCapacity(manager.assignedAgentsCount, manager.maxAgents);
    manager.availableSlots = cap.available;
    manager.capacityPercentage = cap.percentage;
    manager.capacityStatus = cap.status;

    // Update agent pool
    agent.assignedManagerId = manager.id;
    agent.assignedManagerName = manager.name;

    manager.recentActivity.unshift({
      id: `act-${Date.now()}`,
      action: 'AGENT_ASSIGNED',
      description: `Assigned agent ${agent.name} to team`,
      timestamp: new Date().toISOString(),
    });

    return { success: true, manager };
  }

  /**
   * Unassign an agent from a manager
   */
  public async unassignAgentFromManager(
    managerId: string,
    agentId: string
  ): Promise<{ success: boolean; manager: ManagerItem }> {
    const manager = this.managers.find((m) => m.id === managerId);
    if (!manager) {
      throw new Error(`Manager with ID '${managerId}' not found`);
    }

    const agentIndex = manager.agents.findIndex((a) => a.id === agentId);
    if (agentIndex === -1) {
      return { success: true, manager };
    }

    const unassigned = manager.agents.splice(agentIndex, 1)[0];
    manager.assignedAgentsCount = manager.agents.length;

    const cap = calculateCapacity(manager.assignedAgentsCount, manager.maxAgents);
    manager.availableSlots = cap.available;
    manager.capacityPercentage = cap.percentage;
    manager.capacityStatus = cap.status;

    // Update agent pool
    const poolAgent = this.agentPool.find((a) => a.id === agentId);
    if (poolAgent) {
      poolAgent.assignedManagerId = null;
      poolAgent.assignedManagerName = null;
    }

    manager.recentActivity.unshift({
      id: `act-${Date.now()}`,
      action: 'AGENT_UNASSIGNED',
      description: `Unassigned agent ${unassigned.name} from team`,
      timestamp: new Date().toISOString(),
    });

    return { success: true, manager };
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
