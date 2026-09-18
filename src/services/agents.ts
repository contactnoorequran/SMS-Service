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
import { apiClient } from './api';

// Initial Seed Managers for Agent assignment
const SEED_MANAGERS: ManagerSummary[] = [
  {
    id: 'mgr-001',
    userId: 'usr-002',
    name: 'Sarah Khan',
    email: 'sarah.khan@smshub.local',
    department: 'Operations',
    maxAgents: 10,
    assignedAgentsCount: 7,
    availableSlots: 3,
  },
  {
    id: 'mgr-002',
    userId: 'usr-003',
    name: 'Ahmed Malik',
    email: 'ahmed.malik@smshub.local',
    department: 'Telecom',
    maxAgents: 15,
    assignedAgentsCount: 12,
    availableSlots: 3,
  },
  {
    id: 'mgr-003',
    userId: 'usr-004',
    name: 'Elena Rostova',
    email: 'elena.rostova@smshub.local',
    department: 'Carrier Routing',
    maxAgents: 25,
    assignedAgentsCount: 24,
    availableSlots: 1,
  },
  {
    id: 'mgr-004',
    userId: 'usr-005',
    name: 'Daniel Smith',
    email: 'daniel.smith@smshub.local',
    department: 'Enterprise Support',
    maxAgents: 8,
    assignedAgentsCount: 8,
    availableSlots: 0,
  },
  {
    id: 'mgr-005',
    userId: 'usr-006',
    name: 'Olivia Wilson',
    email: 'olivia.wilson@smshub.local',
    department: 'Financial Clearing',
    maxAgents: 12,
    assignedAgentsCount: 3,
    availableSlots: 9,
  },
];

// Initial Realistic Fictional Demo Agents
const INITIAL_AGENTS_SEED: AgentDetail[] = [
  {
    id: 'ag-101',
    userId: 'usr-ag-101',
    name: 'Liam O’Connor',
    email: 'liam.o@smshub.local',
    status: 'ACTIVE',
    managerId: 'mgr-001',
    managerName: 'Sarah Khan',
    managerEmail: 'sarah.khan@smshub.local',
    department: 'Operations',
    clientsCount: 14,
    assignedNumbersCount: 28,
    commissionRate: 0.05,
    earnings: 1420.5,
    permissions: ['clients.read', 'numbers.read', 'messages.read', 'cdr.read', 'rates.read'],
    lastLoginAt: '2026-09-15T21:30:00.000Z',
    createdAt: '2026-01-15T10:00:00.000Z',
    organization: 'SMS Hub Global',
    manager: SEED_MANAGERS[0],
    clients: [
      {
        id: 'cl-001',
        name: 'Alpha Express Logistics',
        email: 'billing@alphaexpress.com',
        companyName: 'Alpha Express Ltd',
        status: 'ACTIVE',
        billingType: 'POSTPAID',
        assignedNumbersCount: 6,
        balance: 2450.0,
        assignedAt: '2026-01-20T12:00:00.000Z',
      },
      {
        id: 'cl-002',
        name: 'Nexus FinTech UK',
        email: 'ops@nexusfin.co.uk',
        companyName: 'Nexus FinTech Limited',
        status: 'ACTIVE',
        billingType: 'PREPAID',
        assignedNumbersCount: 8,
        balance: 180.5,
        assignedAt: '2026-02-05T09:30:00.000Z',
      },
    ],
    numbers: [
      {
        id: 'num-01',
        e164Number: '+447911123456',
        country: 'United Kingdom',
        countryCode: 'GB',
        operator: 'Vodafone UK',
        status: 'ASSIGNED',
        clientId: 'cl-001',
        clientName: 'Alpha Express Logistics',
        assignedAt: '2026-01-22T10:00:00.000Z',
      },
      {
        id: 'num-02',
        e164Number: '+447911654321',
        country: 'United Kingdom',
        countryCode: 'GB',
        operator: 'EE UK',
        status: 'ASSIGNED',
        clientId: 'cl-002',
        clientName: 'Nexus FinTech UK',
        assignedAt: '2026-02-06T11:00:00.000Z',
      },
    ],
    commission: {
      earned: 1420.5,
      pending: 285.0,
      paid: 1135.5,
      rate: 0.05,
      currentPeriod: 'September 2026',
      historical: [
        { month: 'Apr 2026', amount: 180.0, messageCount: 36000 },
        { month: 'May 2026', amount: 220.5, messageCount: 44100 },
        { month: 'Jun 2026', amount: 245.0, messageCount: 49000 },
        { month: 'Jul 2026', amount: 290.0, messageCount: 58000 },
        { month: 'Aug 2026', amount: 310.0, messageCount: 62000 },
        { month: 'Sep 2026', amount: 175.0, messageCount: 35000 },
      ],
    },
    recentActivity: [
      {
        id: 'act-1',
        action: 'CLIENT_ASSIGNED',
        description: 'Allocated Nexus FinTech UK account to portfolio',
        timestamp: '2026-09-14T18:20:00.000Z',
      },
      {
        id: 'act-2',
        action: 'COMMISSION_ACCRUED',
        description: 'Monthly volume commission credited ($175.00)',
        timestamp: '2026-09-12T08:00:00.000Z',
      },
    ],
  },
  {
    id: 'ag-102',
    userId: 'usr-ag-102',
    name: 'Amira El-Sayed',
    email: 'amira.e@smshub.local',
    status: 'ACTIVE',
    managerId: 'mgr-001',
    managerName: 'Sarah Khan',
    managerEmail: 'sarah.khan@smshub.local',
    department: 'Operations',
    clientsCount: 9,
    assignedNumbersCount: 18,
    commissionRate: 0.045,
    earnings: 890.0,
    permissions: ['clients.read', 'numbers.read', 'messages.read', 'cdr.read', 'rates.read'],
    lastLoginAt: '2026-09-15T18:10:00.000Z',
    createdAt: '2026-01-20T11:30:00.000Z',
    organization: 'SMS Hub Global',
    manager: SEED_MANAGERS[0],
    clients: [],
    numbers: [],
    commission: {
      earned: 890.0,
      pending: 140.0,
      paid: 750.0,
      rate: 0.045,
      currentPeriod: 'September 2026',
      historical: [],
    },
    recentActivity: [],
  },
  {
    id: 'ag-103',
    userId: 'usr-ag-103',
    name: 'Chen Wei',
    email: 'chen.wei@smshub.local',
    status: 'ACTIVE',
    managerId: 'mgr-001',
    managerName: 'Sarah Khan',
    managerEmail: 'sarah.khan@smshub.local',
    department: 'Operations',
    clientsCount: 18,
    assignedNumbersCount: 42,
    commissionRate: 0.05,
    earnings: 2150.0,
    permissions: ['clients.read', 'numbers.read', 'messages.read', 'cdr.read', 'rates.read'],
    lastLoginAt: '2026-09-15T20:00:00.000Z',
    createdAt: '2026-02-01T09:15:00.000Z',
    organization: 'SMS Hub Global',
    manager: SEED_MANAGERS[0],
    clients: [],
    numbers: [],
    commission: {
      earned: 2150.0,
      pending: 320.0,
      paid: 1830.0,
      rate: 0.05,
      currentPeriod: 'September 2026',
      historical: [],
    },
    recentActivity: [],
  },
  {
    id: 'ag-104',
    userId: 'usr-ag-104',
    name: 'Lucas Vance',
    email: 'lucas.v@smshub.local',
    status: 'ACTIVE',
    managerId: 'mgr-001',
    managerName: 'Sarah Khan',
    managerEmail: 'sarah.khan@smshub.local',
    department: 'Operations',
    clientsCount: 6,
    assignedNumbersCount: 12,
    commissionRate: 0.04,
    earnings: 560.0,
    permissions: ['clients.read', 'numbers.read', 'messages.read', 'cdr.read'],
    lastLoginAt: '2026-09-14T15:20:00.000Z',
    createdAt: '2026-02-14T14:20:00.000Z',
    organization: 'SMS Hub Global',
    manager: SEED_MANAGERS[0],
    clients: [],
    numbers: [],
    commission: {
      earned: 560.0,
      pending: 90.0,
      paid: 470.0,
      rate: 0.04,
      currentPeriod: 'September 2026',
      historical: [],
    },
    recentActivity: [],
  },
  {
    id: 'ag-108',
    userId: 'usr-ag-108',
    name: 'Priya Sharma',
    email: 'priya.s@smshub.local',
    status: 'ACTIVE',
    managerId: 'mgr-002',
    managerName: 'Ahmed Malik',
    managerEmail: 'ahmed.malik@smshub.local',
    department: 'Telecom',
    clientsCount: 22,
    assignedNumbersCount: 56,
    commissionRate: 0.06,
    earnings: 3200.0,
    permissions: ['clients.read', 'numbers.read', 'numbers.assign', 'messages.read', 'cdr.read', 'rates.read'],
    lastLoginAt: '2026-09-15T22:15:00.000Z',
    createdAt: '2026-01-25T10:00:00.000Z',
    organization: 'SMS Hub Global',
    manager: SEED_MANAGERS[1],
    clients: [],
    numbers: [],
    commission: {
      earned: 3200.0,
      pending: 480.0,
      paid: 2720.0,
      rate: 0.06,
      currentPeriod: 'September 2026',
      historical: [],
    },
    recentActivity: [],
  },
  {
    id: 'ag-109',
    userId: 'usr-ag-109',
    name: 'Marcus Brody',
    email: 'marcus.b@smshub.local',
    status: 'ACTIVE',
    managerId: 'mgr-002',
    managerName: 'Ahmed Malik',
    managerEmail: 'ahmed.malik@smshub.local',
    department: 'Telecom',
    clientsCount: 16,
    assignedNumbersCount: 34,
    commissionRate: 0.05,
    earnings: 1840.0,
    permissions: ['clients.read', 'numbers.read', 'messages.read', 'cdr.read', 'rates.read'],
    lastLoginAt: '2026-09-15T19:50:00.000Z',
    createdAt: '2026-02-05T13:00:00.000Z',
    organization: 'SMS Hub Global',
    manager: SEED_MANAGERS[1],
    clients: [],
    numbers: [],
    commission: {
      earned: 1840.0,
      pending: 250.0,
      paid: 1590.0,
      rate: 0.05,
      currentPeriod: 'September 2026',
      historical: [],
    },
    recentActivity: [],
  },
  {
    id: 'ag-112',
    userId: 'usr-ag-112',
    name: 'Carlos Mendez',
    email: 'carlos.m@smshub.local',
    status: 'ACTIVE',
    managerId: 'mgr-003',
    managerName: 'Elena Rostova',
    managerEmail: 'elena.rostova@smshub.local',
    department: 'Carrier Routing',
    clientsCount: 19,
    assignedNumbersCount: 45,
    commissionRate: 0.05,
    earnings: 2410.0,
    permissions: ['clients.read', 'numbers.read', 'messages.read', 'cdr.read', 'rates.read'],
    lastLoginAt: '2026-09-15T17:40:00.000Z',
    createdAt: '2026-01-05T14:30:00.000Z',
    organization: 'SMS Hub Global',
    manager: SEED_MANAGERS[2],
    clients: [],
    numbers: [],
    commission: {
      earned: 2410.0,
      pending: 360.0,
      paid: 2050.0,
      rate: 0.05,
      currentPeriod: 'September 2026',
      historical: [],
    },
    recentActivity: [],
  },
  {
    id: 'ag-113',
    userId: 'usr-ag-113',
    name: 'Aisha Al-Nuaimi',
    email: 'aisha.n@smshub.local',
    status: 'ACTIVE',
    managerId: 'mgr-004',
    managerName: 'Daniel Smith',
    managerEmail: 'daniel.smith@smshub.local',
    department: 'Enterprise Support',
    clientsCount: 15,
    assignedNumbersCount: 30,
    commissionRate: 0.05,
    earnings: 1650.0,
    permissions: ['clients.read', 'numbers.read', 'messages.read', 'cdr.read'],
    lastLoginAt: '2026-09-14T16:00:00.000Z',
    createdAt: '2026-02-20T09:00:00.000Z',
    organization: 'SMS Hub Global',
    manager: SEED_MANAGERS[3],
    clients: [],
    numbers: [],
    commission: {
      earned: 1650.0,
      pending: 220.0,
      paid: 1430.0,
      rate: 0.05,
      currentPeriod: 'September 2026',
      historical: [],
    },
    recentActivity: [],
  },
  {
    id: 'ag-114',
    userId: 'usr-ag-114',
    name: 'James Peterson',
    email: 'james.p@smshub.local',
    status: 'SUSPENDED',
    managerId: 'mgr-005',
    managerName: 'Olivia Wilson',
    managerEmail: 'olivia.wilson@smshub.local',
    department: 'Financial Clearing',
    clientsCount: 8,
    assignedNumbersCount: 14,
    commissionRate: 0.04,
    earnings: 720.0,
    permissions: ['clients.read', 'numbers.read', 'messages.read'],
    lastLoginAt: '2026-08-30T10:15:00.000Z',
    createdAt: '2026-03-01T10:00:00.000Z',
    organization: 'SMS Hub Global',
    manager: SEED_MANAGERS[4],
    clients: [],
    numbers: [],
    commission: {
      earned: 720.0,
      pending: 0,
      paid: 720.0,
      rate: 0.04,
      currentPeriod: 'September 2026',
      historical: [],
    },
    recentActivity: [],
  },
  {
    id: 'ag-201',
    userId: 'usr-ag-201',
    name: 'Nadia Rostova',
    email: 'nadia.r@smshub.local',
    status: 'PENDING',
    managerId: null,
    managerName: null,
    managerEmail: null,
    department: null,
    clientsCount: 0,
    assignedNumbersCount: 0,
    commissionRate: 0.04,
    earnings: 0.0,
    permissions: ['clients.read', 'numbers.read'],
    lastLoginAt: null,
    createdAt: '2026-09-12T14:00:00.000Z',
    organization: 'SMS Hub Global',
    manager: null,
    clients: [],
    numbers: [],
    commission: {
      earned: 0.0,
      pending: 0,
      paid: 0,
      rate: 0.04,
      currentPeriod: 'September 2026',
      historical: [],
    },
    recentActivity: [],
  },
];

class AgentsService {
  private agents: AgentDetail[] = JSON.parse(JSON.stringify(INITIAL_AGENTS_SEED));
  private managers: ManagerSummary[] = JSON.parse(JSON.stringify(SEED_MANAGERS));

  /**
   * Calculate KPIs dynamically
   */
  public calculateKpis(list: AgentItem[] = this.agents): AgentKpiSummary {
    const totalAgents = list.length;
    const activeAgents = list.filter((a) => a.status === 'ACTIVE').length;
    const suspendedAgents = list.filter((a) => a.status === 'SUSPENDED').length;

    let totalClientsManaged = 0;
    let totalAssignedNumbers = 0;
    let totalCommissionEarned = 0;

    list.forEach((a) => {
      totalClientsManaged += a.clientsCount;
      totalAssignedNumbers += a.assignedNumbersCount;
      totalCommissionEarned += a.earnings;
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
   * Fetch managers list with capacity
   */
  public async fetchManagers(): Promise<ManagerSummary[]> {
    return JSON.parse(JSON.stringify(this.managers));
  }

  /**
   * Fetch filtered and paginated list of agents
   */
  public async fetchAgents(filters?: Partial<AgentFilterState>): Promise<{
    items: AgentItem[];
    total: number;
    kpis: AgentKpiSummary;
  }> {
    // Try live API if available
    try {
      const response = await apiClient.getAgents({
        search: filters?.search,
        status: filters?.status,
        managerId: filters?.managerId,
        page: filters?.page,
        limit: filters?.limit,
        sortBy: filters?.sortBy,
        sortDir: filters?.sortDir,
      });
      if (response && response.items && Array.isArray(response.items) && response.items.length > 0) {
        const items: AgentItem[] = response.items.map((a: any) => ({
          id: a.id,
          userId: a.userId || a.id,
          name: a.name || `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'Agent',
          email: a.email,
          status: a.status as AgentStatus,
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
          createdAt: a.createdAt,
          organization: 'SMS Hub Global',
        }));

        const kpis = this.calculateKpis(items);
        return { items, total: response.data.total || items.length, kpis };
      }
    } catch {
      // Fallback to client-side mock
    }

    let list = [...this.agents];

    // Search filter
    if (filters?.search && filters.search.trim() !== '') {
      const term = filters.search.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(term) ||
          a.email.toLowerCase().includes(term) ||
          (a.managerName && a.managerName.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((a) => a.status === filters.status);
    }

    // Manager filter
    if (filters?.managerId && filters.managerId !== 'ALL') {
      if (filters.managerId === 'UNASSIGNED') {
        list = list.filter((a) => !a.managerId);
      } else {
        list = list.filter((a) => a.managerId === filters.managerId);
      }
    }

    // Client count range filter
    if (filters?.clientCountRange && filters.clientCountRange !== 'ALL') {
      switch (filters.clientCountRange) {
        case '0':
          list = list.filter((a) => a.clientsCount === 0);
          break;
        case '1-10':
          list = list.filter((a) => a.clientsCount >= 1 && a.clientsCount <= 10);
          break;
        case '11-20':
          list = list.filter((a) => a.clientsCount >= 11 && a.clientsCount <= 20);
          break;
        case '20+':
          list = list.filter((a) => a.clientsCount > 20);
          break;
      }
    }

    // Sorting
    const sortBy = filters?.sortBy || 'createdAt';
    const sortDir = filters?.sortDir || 'desc';

    list.sort((a, b) => {
      let valA: any = a[sortBy as keyof AgentItem];
      let valB: any = b[sortBy as keyof AgentItem];

      if (sortBy === 'manager') {
        valA = a.managerName || '';
        valB = b.managerName || '';
      } else if (sortBy === 'clients') {
        valA = a.clientsCount;
        valB = b.clientsCount;
      } else if (sortBy === 'numbers') {
        valA = a.assignedNumbersCount;
        valB = b.assignedNumbersCount;
      } else if (sortBy === 'earnings') {
        valA = a.earnings;
        valB = b.earnings;
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

    const kpis = this.calculateKpis(this.agents);

    return { items, total, kpis };
  }

  /**
   * Fetch single agent with comprehensive details
   */
  public async fetchAgentById(id: string): Promise<AgentDetail | null> {
    try {
      const response = await apiClient.getAgentById(id);
      if (response && response.agent) {
        const a = response.agent;
        return {
          id: a.id,
          userId: a.userId || a.id,
          name: a.name || `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'Agent',
          email: a.email,
          status: a.status as AgentStatus,
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
          createdAt: a.createdAt,
          organization: 'SMS Hub Global',
          manager: a.manager || null,
          clients: a.clients || [],
          numbers: a.numbers || [],
          commission: a.commission || {
            earned: a.earnings || 0,
            pending: 0,
            paid: a.earnings || 0,
            rate: a.commissionRate || 0.05,
            currentPeriod: 'September 2026',
            historical: [],
          },
          recentActivity: a.recentActivity || [],
        };
      }
    } catch {
      // Fallback
    }

    const found = this.agents.find((a) => a.id === id || a.userId === id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  /**
   * Create a new agent profile
   */
  public async createAgent(payload: CreateAgentPayload): Promise<AgentItem> {
    const newId = `ag-${Date.now().toString(36)}`;
    const newUserId = `usr-${Date.now().toString(36)}`;

    let managerName: string | null = null;
    let managerEmail: string | null = null;
    let department: string | null = null;
    let managerObj: ManagerSummary | null = null;

    if (payload.managerId) {
      const mgr = this.managers.find((m) => m.id === payload.managerId);
      if (mgr) {
        managerName = mgr.name;
        managerEmail = mgr.email;
        department = mgr.department;
        managerObj = mgr;
        mgr.assignedAgentsCount += 1;
        mgr.availableSlots = Math.max(0, mgr.maxAgents - mgr.assignedAgentsCount);
      }
    }

    const newAgent: AgentDetail = {
      id: newId,
      userId: newUserId,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      status: payload.status,
      managerId: payload.managerId || null,
      managerName,
      managerEmail,
      department,
      clientsCount: 0,
      assignedNumbersCount: 0,
      commissionRate: payload.commissionRate || 0.05,
      earnings: 0.0,
      permissions: ['clients.read', 'numbers.read', 'messages.read', 'cdr.read'],
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      organization: 'SMS Hub Global',
      manager: managerObj,
      clients: [],
      numbers: [],
      commission: {
        earned: 0.0,
        pending: 0.0,
        paid: 0.0,
        rate: payload.commissionRate || 0.05,
        currentPeriod: 'September 2026',
        historical: [],
      },
      recentActivity: [
        {
          id: `act-${Date.now()}`,
          action: 'CREATED',
          description: 'Agent profile created in platform',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    try {
      await apiClient.createAgent({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        managerId: payload.managerId,
        status: payload.status,
      });
    } catch {
      // Local fallback
    }

    this.agents.unshift(newAgent);
    return newAgent;
  }

  /**
   * Update agent details
   */
  public async updateAgent(id: string, payload: UpdateAgentPayload): Promise<AgentItem> {
    const target = this.agents.find((a) => a.id === id);
    if (!target) {
      throw new Error(`Agent with ID '${id}' not found`);
    }

    if (payload.name) target.name = payload.name.trim();
    if (payload.status) target.status = payload.status;
    if (payload.commissionRate !== undefined) target.commissionRate = payload.commissionRate;

    if (payload.managerId !== undefined && payload.managerId !== target.managerId) {
      // Handle manager update
      if (payload.managerId) {
        const newMgr = this.managers.find((m) => m.id === payload.managerId);
        if (newMgr) {
          target.managerId = newMgr.id;
          target.managerName = newMgr.name;
          target.managerEmail = newMgr.email;
          target.department = newMgr.department;
          target.manager = newMgr;
        }
      } else {
        target.managerId = null;
        target.managerName = null;
        target.managerEmail = null;
        target.department = null;
        target.manager = null;
      }
    }

    target.recentActivity.unshift({
      id: `act-${Date.now()}`,
      action: 'UPDATED',
      description: 'Agent profile updated by administrator',
      timestamp: new Date().toISOString(),
    });

    try {
      await apiClient.updateAgent(id, payload);
    } catch {
      // Fallback
    }

    return target;
  }

  /**
   * Update agent status with reason
   */
  public async updateAgentStatus(
    id: string,
    status: AgentStatus,
    reason?: string
  ): Promise<AgentItem> {
    const target = this.agents.find((a) => a.id === id);
    if (!target) {
      throw new Error(`Agent with ID '${id}' not found`);
    }

    const prev = target.status;
    target.status = status;

    target.recentActivity.unshift({
      id: `act-${Date.now()}`,
      action: `STATUS_${status}`,
      description: `Status changed from ${prev} to ${status}${reason ? `: ${reason}` : ''}`,
      timestamp: new Date().toISOString(),
    });

    try {
      await apiClient.updateAgentStatus(id, status, reason);
    } catch {
      // Fallback
    }

    return target;
  }

  /**
   * Assign or reassign manager to an agent
   */
  public async assignManager(agentId: string, managerId: string | null): Promise<AgentItem> {
    const agent = this.agents.find((a) => a.id === agentId);
    if (!agent) {
      throw new Error(`Agent with ID '${agentId}' not found`);
    }

    const previousManagerName = agent.managerName || 'Unassigned';

    if (managerId) {
      const newMgr = this.managers.find((m) => m.id === managerId);
      if (!newMgr) {
        throw new Error(`Manager with ID '${managerId}' not found`);
      }

      agent.managerId = newMgr.id;
      agent.managerName = newMgr.name;
      agent.managerEmail = newMgr.email;
      agent.department = newMgr.department;
      agent.manager = newMgr;

      agent.recentActivity.unshift({
        id: `act-${Date.now()}`,
        action: 'MANAGER_REASSIGNED',
        description: `Reassigned from ${previousManagerName} to ${newMgr.name}`,
        timestamp: new Date().toISOString(),
      });
    } else {
      agent.managerId = null;
      agent.managerName = null;
      agent.managerEmail = null;
      agent.department = null;
      agent.manager = null;

      agent.recentActivity.unshift({
        id: `act-${Date.now()}`,
        action: 'MANAGER_UNASSIGNED',
        description: `Unassigned from manager ${previousManagerName}`,
        timestamp: new Date().toISOString(),
      });
    }

    try {
      await apiClient.assignAgentManager(agentId, managerId);
    } catch {
      // Fallback
    }

    return agent;
  }

  /**
   * Fetch clients managed by an agent
   */
  public async fetchAgentClients(agentId: string): Promise<AgentClientSummary[]> {
    const agent = this.agents.find((a) => a.id === agentId);
    return agent ? [...agent.clients] : [];
  }

  /**
   * Fetch phone numbers allocated to an agent
   */
  public async fetchAgentNumbers(agentId: string): Promise<AgentNumberSummary[]> {
    const agent = this.agents.find((a) => a.id === agentId);
    return agent ? [...agent.numbers] : [];
  }

  /**
   * Fetch commission history & summary
   */
  public async fetchAgentCommission(agentId: string): Promise<AgentCommissionSummary | null> {
    const agent = this.agents.find((a) => a.id === agentId);
    return agent ? agent.commission : null;
  }
}

export const agentsService = new AgentsService();
