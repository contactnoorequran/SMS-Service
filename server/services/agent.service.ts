import crypto from 'crypto';
import { env } from '../config/env';
import { AuthTokenPayload, UserRole, UserStatus } from '../types/auth';
import {
  AgentClientItem,
  AgentDetail,
  AgentListItem,
  AgentListQuery,
  AgentNumberItem,
  AgentStatistics,
  CreateAgentDTO,
  PaginatedAgents,
  UpdateAgentDTO,
} from '../types/agent';
import { UserRepository, StoredUser } from './user.repository';
import { ManagerService } from './manager.service';
import { PasswordService } from './password.service';
import { PermissionsService, ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from './permissions.service';
import { AuditService } from './audit.service';
import { getPrismaClient } from '../db/prisma';
import { Logger } from '../utils/logger';

const logger = new Logger('AgentService');

interface StoredAgentRecord {
  id: string; // Agent profile ID
  userId: string; // User ID
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  managerId: string | null;
  commissionRate: number; // e.g. 0.05
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  // Sub-resources
  clients: AgentClientItem[];
  numbers: AgentNumberItem[];
  smsCount: number;
  earnings: number;
  balance: number;
}

// In-memory persistent registry for agent profiles
const agentRegistry: Map<string, StoredAgentRecord> = new Map();
let isInitialized = false;

export class AgentService {
  /**
   * Initializes seed agents and links them with managers and clients.
   */
  static async initializeSeedAgents(): Promise<void> {
    if (isInitialized) return;

    await UserRepository.initializeSeedUsers();
    await ManagerService.initializeSeedManagers();
    logger.info('Initializing Agent Management profiles, client assignments, and number pools...');

    // Resolve seed users
    const marcusUser = await UserRepository.findByEmail(env.SEED_AGENT_EMAIL);
    const marcusUserId = marcusUser?.id || 'usr-agent-marcus-brody';

    const seedAgents: StoredAgentRecord[] = [
      {
        id: 'agent-prof-001',
        userId: marcusUserId,
        username: 'marcus.brody',
        firstName: 'Marcus',
        lastName: 'Brody',
        email: env.SEED_AGENT_EMAIL.toLowerCase(),
        contact: '+1 (202) 555-0188',
        managerId: 'mgr-profile-001', // Elena Rostova
        commissionRate: 0.05, // 5%
        status: 'ACTIVE',
        permissions: [...DEFAULT_ROLE_PERMISSIONS.AGENT],
        createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        lastLoginAt: new Date(Date.now() - 45 * 60000).toISOString(),
        smsCount: 142500,
        earnings: 7125.0,
        balance: 3450.0,
        clients: [
          {
            id: 'cli-prof-001',
            userId: 'user-client-sophia',
            name: 'Sophia Chen',
            email: env.SEED_CLIENT_EMAIL.toLowerCase(),
            companyName: 'NovaTech Global Enterprise',
            contact: '+1 (415) 555-0198',
            billingType: 'PREPAID',
            status: 'ACTIVE',
            assignedNumbersCount: 24,
            balance: 14850.0,
            createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
          },
          {
            id: 'cli-prof-002',
            userId: 'user-client-velocity',
            name: 'David Vance',
            email: 'security@velocity-pay.com',
            companyName: 'Velocity Payment Systems',
            contact: '+1 (212) 555-0145',
            billingType: 'PREPAID',
            status: 'ACTIVE',
            assignedNumbersCount: 32,
            balance: 35000.0,
            createdAt: new Date(Date.now() - 28 * 86400000).toISOString(),
          },
          {
            id: 'cli-prof-005',
            userId: 'user-client-swiftpay',
            name: 'Alicia Keyser',
            email: 'alicia@swiftpay-mobile.io',
            companyName: 'SwiftPay Mobile Authentication',
            contact: '+1 (650) 555-0133',
            billingType: 'PREPAID',
            status: 'ACTIVE',
            assignedNumbersCount: 12,
            balance: 8400.0,
            createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
          },
        ],
        numbers: [
          {
            id: 'num-001',
            e164Number: '+12025550181',
            country: 'United States',
            countryCode: 'US',
            operator: 'AT&T Mobility',
            status: 'ASSIGNED',
            clientId: 'cli-prof-001',
            clientName: 'NovaTech Global Enterprise',
            capabilities: 'SMS, 2FA, VOICE',
            assignedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          },
          {
            id: 'num-002',
            e164Number: '+12025550182',
            country: 'United States',
            countryCode: 'US',
            operator: 'Verizon Wireless',
            status: 'ASSIGNED',
            clientId: 'cli-prof-001',
            clientName: 'NovaTech Global Enterprise',
            capabilities: 'SMS',
            assignedAt: new Date(Date.now() - 25 * 86400000).toISOString(),
          },
          {
            id: 'num-003',
            e164Number: '+12025550183',
            country: 'United States',
            countryCode: 'US',
            operator: 'T-Mobile USA',
            status: 'ASSIGNED',
            clientId: 'cli-prof-002',
            clientName: 'Velocity Payment Systems',
            capabilities: 'SMS, 2FA',
            assignedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
          },
          {
            id: 'num-004',
            e164Number: '+12025550184',
            country: 'United States',
            countryCode: 'US',
            operator: 'AT&T Mobility',
            status: 'AVAILABLE',
            clientId: null,
            clientName: null,
            capabilities: 'SMS',
            assignedAt: null,
          },
          {
            id: 'num-005',
            e164Number: '+12025550185',
            country: 'United States',
            countryCode: 'US',
            operator: 'Verizon Wireless',
            status: 'AVAILABLE',
            clientId: null,
            clientName: null,
            capabilities: 'SMS, 2FA',
            assignedAt: null,
          },
        ],
      },
      {
        id: 'agent-prof-002',
        userId: 'usr-agent-priya-sharma',
        username: 'priya.sharma',
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'p.sharma@sms-telecom.net',
        contact: '+91 98200 11223',
        managerId: 'mgr-profile-001', // Elena Rostova
        commissionRate: 0.045, // 4.5%
        status: 'ACTIVE',
        permissions: [...DEFAULT_ROLE_PERMISSIONS.AGENT],
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        lastLoginAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        smsCount: 89200,
        earnings: 4014.0,
        balance: 1820.0,
        clients: [
          {
            id: 'cli-prof-006',
            userId: 'user-client-mumbaifin',
            name: 'Rajesh Nair',
            email: 'ops@mumbai-fintech.in',
            companyName: 'Mumbai FinTech Gateway',
            contact: '+91 22 2839 0122',
            billingType: 'PREPAID',
            status: 'ACTIVE',
            assignedNumbersCount: 18,
            balance: 6200.0,
            createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
          },
          {
            id: 'cli-prof-007',
            userId: 'user-client-delhiretail',
            name: 'Aarav Patel',
            email: 'admin@delhi-retail-otp.com',
            companyName: 'Delhi Retail Express',
            contact: '+91 11 4123 5566',
            billingType: 'POSTPAID',
            status: 'ACTIVE',
            assignedNumbersCount: 16,
            balance: 4800.0,
            createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
          },
        ],
        numbers: [
          {
            id: 'num-006',
            e164Number: '+919820055001',
            country: 'India',
            countryCode: 'IN',
            operator: 'Bharti Airtel',
            status: 'ASSIGNED',
            clientId: 'cli-prof-006',
            clientName: 'Mumbai FinTech Gateway',
            capabilities: 'SMS, 2FA',
            assignedAt: new Date(Date.now() - 22 * 86400000).toISOString(),
          },
          {
            id: 'num-007',
            e164Number: '+919820055002',
            country: 'India',
            countryCode: 'IN',
            operator: 'Reliance Jio',
            status: 'AVAILABLE',
            clientId: null,
            clientName: null,
            capabilities: 'SMS',
            assignedAt: null,
          },
        ],
      },
      {
        id: 'agent-prof-003',
        userId: 'usr-agent-liam-oconnor',
        username: 'liam.oconnor',
        firstName: 'Liam',
        lastName: "O'Connor",
        email: 'liam.oc@route-uk.co',
        contact: '+44 7700 900123',
        managerId: 'mgr-profile-002', // Viktor Kraus
        commissionRate: 0.06, // 6%
        status: 'ACTIVE',
        permissions: [...DEFAULT_ROLE_PERMISSIONS.AGENT],
        createdAt: new Date(Date.now() - 50 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        lastLoginAt: new Date(Date.now() - 6 * 3600000).toISOString(),
        smsCount: 115000,
        earnings: 6900.0,
        balance: 2950.0,
        clients: [
          {
            id: 'cli-prof-003',
            userId: 'user-client-apex',
            name: 'Hannah Abbott',
            email: 'ops@apex-logistics.io',
            companyName: 'Apex Freight & Logistics Ltd',
            contact: '+44 20 7183 4920',
            billingType: 'POSTPAID',
            status: 'ACTIVE',
            assignedNumbersCount: 16,
            balance: 8200.5,
            createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
          },
        ],
        numbers: [
          {
            id: 'num-008',
            e164Number: '+447700900124',
            country: 'United Kingdom',
            countryCode: 'GB',
            operator: 'Vodafone UK',
            status: 'ASSIGNED',
            clientId: 'cli-prof-003',
            clientName: 'Apex Freight & Logistics Ltd',
            capabilities: 'SMS, 2FA',
            assignedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          },
          {
            id: 'num-009',
            e164Number: '+447700900125',
            country: 'United Kingdom',
            countryCode: 'GB',
            operator: 'EE Limited',
            status: 'AVAILABLE',
            clientId: null,
            clientName: null,
            capabilities: 'SMS',
            assignedAt: null,
          },
        ],
      },
      {
        id: 'agent-prof-004',
        userId: 'usr-agent-meiling-zhou',
        username: 'meiling.zhou',
        firstName: 'Mei-Ling',
        lastName: 'Zhou',
        email: 'ml.zhou@pacific-sms.sg',
        contact: '+65 6789 0123',
        managerId: 'mgr-profile-004', // Daisuke Sato
        commissionRate: 0.05, // 5%
        status: 'ACTIVE',
        permissions: [...DEFAULT_ROLE_PERMISSIONS.AGENT],
        createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        lastLoginAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        smsCount: 45600,
        earnings: 2280.0,
        balance: 980.0,
        clients: [
          {
            id: 'cli-prof-004',
            userId: 'user-client-cloudotp',
            name: 'Kenji Takahashi',
            email: 'api@cloudotp.net',
            companyName: 'CloudOTP Global Auth Ltd',
            contact: '+81 3 4567 8901',
            billingType: 'PREPAID',
            status: 'ACTIVE',
            assignedNumbersCount: 8,
            balance: 4120.0,
            createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
          },
        ],
        numbers: [
          {
            id: 'num-010',
            e164Number: '+6567890124',
            country: 'Singapore',
            countryCode: 'SG',
            operator: 'Singtel Mobile',
            status: 'ASSIGNED',
            clientId: 'cli-prof-004',
            clientName: 'CloudOTP Global Auth Ltd',
            capabilities: 'SMS',
            assignedAt: new Date(Date.now() - 40 * 86400000).toISOString(),
          },
          {
            id: 'num-011',
            e164Number: '+6567890125',
            country: 'Singapore',
            countryCode: 'SG',
            operator: 'StarHub',
            status: 'AVAILABLE',
            clientId: null,
            clientName: null,
            capabilities: 'SMS, 2FA',
            assignedAt: null,
          },
        ],
      },
      {
        id: 'agent-prof-005',
        userId: 'usr-agent-tariq-mansoor',
        username: 'tariq.mansoor',
        firstName: 'Tariq',
        lastName: 'Mansoor',
        email: 'tariq.m@gulf-telecom.ae',
        contact: '+971 4 391 1111',
        managerId: null, // Unassigned agent
        commissionRate: 0.04, // 4%
        status: 'ACTIVE',
        permissions: [...DEFAULT_ROLE_PERMISSIONS.AGENT],
        createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        lastLoginAt: new Date(Date.now() - 12 * 3600000).toISOString(),
        smsCount: 28400,
        earnings: 1136.0,
        balance: 620.0,
        clients: [
          {
            id: 'cli-prof-008',
            userId: 'user-client-dubai-fin',
            name: 'Zayed Al-Fahim',
            email: 'zayed@dubai-fin.ae',
            companyName: 'Emirates Secure Gateway LLC',
            contact: '+971 4 800 2345',
            billingType: 'PREPAID',
            status: 'ACTIVE',
            assignedNumbersCount: 12,
            balance: 5500.0,
            createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
          },
        ],
        numbers: [
          {
            id: 'num-012',
            e164Number: '+971501234567',
            country: 'United Arab Emirates',
            countryCode: 'AE',
            operator: 'Etisalat UAE',
            status: 'ASSIGNED',
            clientId: 'cli-prof-008',
            clientName: 'Emirates Secure Gateway LLC',
            capabilities: 'SMS, 2FA',
            assignedAt: new Date(Date.now() - 18 * 86400000).toISOString(),
          },
        ],
      },
      {
        id: 'agent-prof-006',
        userId: 'usr-agent-clara-dubois',
        username: 'clara.dubois',
        firstName: 'Clara',
        lastName: 'Dubois',
        email: 'clara.dubois@eu-messaging.fr',
        contact: '+33 1 42 68 55 00',
        managerId: 'mgr-profile-002', // Viktor Kraus
        commissionRate: 0.055, // 5.5%
        status: 'SUSPENDED',
        permissions: ['users.view', 'sms.view'],
        createdAt: new Date(Date.now() - 70 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
        lastLoginAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        smsCount: 14000,
        earnings: 770.0,
        balance: 410.0,
        clients: [
          {
            id: 'cli-prof-009',
            userId: 'user-client-paris-ops',
            name: 'Jean-Luc Moreau',
            email: 'jl@paris-delivery.fr',
            companyName: 'Paris Express Messaging',
            contact: '+33 1 40 12 34 56',
            billingType: 'PREPAID',
            status: 'SUSPENDED',
            assignedNumbersCount: 8,
            balance: 1200.0,
            createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
          },
        ],
        numbers: [
          {
            id: 'num-013',
            e164Number: '+33612345678',
            country: 'France',
            countryCode: 'FR',
            operator: 'Orange France',
            status: 'ASSIGNED',
            clientId: 'cli-prof-009',
            clientName: 'Paris Express Messaging',
            capabilities: 'SMS',
            assignedAt: new Date(Date.now() - 50 * 86400000).toISOString(),
          },
        ],
      },
    ];

    for (const a of seedAgents) {
      agentRegistry.set(a.id, a);

      // Ensure user account exists in UserRepository for authentication
      const existingUser = await UserRepository.findByEmail(a.email);
      if (!existingUser) {
        try {
          await UserRepository.createUser({
            email: a.email,
            passwordRaw: env.SEED_AGENT_PASSWORD,
            role: 'AGENT',
            firstName: a.firstName,
            lastName: a.lastName,
            status: a.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
            managerId: a.managerId,
          });
        } catch {
          // ignore if existing
        }
      }
    }

    isInitialized = true;
    logger.info(`Agent repository initialized with ${agentRegistry.size} agent profiles.`);
  }

  /**
   * Helper: Resolves manager profile information for an agent record.
   */
  private static async getManagerInfo(managerId: string | null): Promise<{
    id: string;
    userId: string;
    name: string;
    email: string;
    department?: string;
  } | null> {
    if (!managerId) return null;
    const mgr = await ManagerService.getManagerById(managerId);
    if (!mgr) return null;
    return {
      id: mgr.id,
      userId: mgr.userId,
      name: mgr.name,
      email: mgr.email,
      department: mgr.department,
    };
  }

  /**
   * Helper: Resolves ManagerProfile ID associated with an actor (if actor is MANAGER).
   */
  static async resolveActorManagerId(actor: AuthTokenPayload): Promise<string | null> {
    if (actor.role !== 'MANAGER') return null;
    const mgr = await ManagerService.getManagerByUserId(actor.userId);
    if (mgr) return mgr.id;
    // Fallback: check by email
    const all = await ManagerService.listManagers({ limit: 100 });
    const match = all.items.find((m) => m.email.toLowerCase() === actor.email.toLowerCase());
    return match ? match.id : null;
  }

  /**
   * Scope Authorization Validator:
   * Enforces that the actor has legal permission to view or manage the targeted agent.
   * - Super Admin: unrestricted.
   * - Manager: target agent must have agent.managerId === actor's ManagerProfile ID.
   * - Agent: target agent must have agent.userId === actor.userId.
   * Throws Error if unauthorized.
   */
  static async assertAccess(
    agentId: string,
    actor: AuthTokenPayload,
    actionDesc: string = 'access'
  ): Promise<StoredAgentRecord> {
    await this.initializeSeedAgents();
    const agent = agentRegistry.get(agentId);
    if (!agent) {
      throw new Error(`Agent with ID '${agentId}' not found.`);
    }

    // 1. Super Admin: full access
    if (actor.role === 'SUPER_ADMIN') {
      return agent;
    }

    // 2. Manager: scoped to assigned agents
    if (actor.role === 'MANAGER') {
      const actorManagerId = await this.resolveActorManagerId(actor);
      if (!actorManagerId || agent.managerId !== actorManagerId) {
        throw new Error(
          `Forbidden: Insufficient scope. You can only ${actionDesc} agents assigned to your managerial portfolio.`
        );
      }
      return agent;
    }

    // 3. Agent: scoped exclusively to own account
    if (actor.role === 'AGENT') {
      if (agent.userId !== actor.userId) {
        throw new Error(
          `Forbidden: Access denied. Agents can only ${actionDesc} their own profile and authorized client resources.`
        );
      }
      return agent;
    }

    throw new Error('Forbidden: Unauthorized role.');
  }

  /**
   * Helper: Formats a StoredAgentRecord to AgentListItem.
   */
  private static async toListItem(a: StoredAgentRecord): Promise<AgentListItem> {
    const mgrInfo = await this.getManagerInfo(a.managerId);
    const assignedNumbers = a.numbers.filter((n) => n.status === 'ASSIGNED').length;
    const unassignedNumbers = a.numbers.filter((n) => n.status !== 'ASSIGNED').length;

    return {
      id: a.id,
      userId: a.userId,
      username: a.username,
      firstName: a.firstName,
      lastName: a.lastName,
      name: `${a.firstName} ${a.lastName}`.trim(),
      email: a.email,
      contact: a.contact,
      managerId: a.managerId,
      managerName: mgrInfo?.name || (a.managerId ? 'Assigned Manager' : 'Unassigned'),
      managerEmail: mgrInfo?.email || null,
      department: mgrInfo?.department || null,
      commissionRate: a.commissionRate,
      status: a.status,
      clientsCount: a.clients.length,
      assignedNumbersCount: assignedNumbers,
      unassignedNumbersCount: unassignedNumbers,
      smsCount: a.smsCount,
      earnings: a.earnings,
      balance: a.balance,
      permissions: a.permissions,
      lastLoginAt: a.lastLoginAt,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }

  /**
   * Helper: Formats full details including statistics, clients, numbers, and activity.
   */
  private static async toDetail(a: StoredAgentRecord): Promise<AgentDetail> {
    const listItem = await this.toListItem(a);
    const mgrInfo = await this.getManagerInfo(a.managerId);

    // Fetch related audit logs for this agent
    const activityLogs = await AuditService.getLogsForEntity(a.userId);

    const assignedNumbers = a.numbers.filter((n) => n.status === 'ASSIGNED').length;
    const unassignedNumbers = a.numbers.filter((n) => n.status !== 'ASSIGNED').length;

    const statistics: AgentStatistics = {
      totalClients: a.clients.length,
      assignedNumbers,
      unassignedNumbers,
      smsCount: a.smsCount,
      earnings: a.earnings,
      currentBalance: a.balance,
      currency: 'USD',
    };

    return {
      ...listItem,
      manager: mgrInfo,
      statistics,
      clients: a.clients,
      numbers: a.numbers,
      recentActivity: activityLogs,
    };
  }

  /**
   * Lists agents with backend scoping, search, filters, and pagination.
   */
  static async listAgents(query: AgentListQuery = {}, actor: AuthTokenPayload): Promise<PaginatedAgents> {
    await this.initializeSeedAgents();

    const {
      search = '',
      status = 'ALL',
      managerId = 'ALL',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = query;

    let allAgents = Array.from(agentRegistry.values());
    let isScopedToManager = false;
    let actorManagerName: string | undefined;
    let actorManagerId: string | undefined;

    // 1. Enforce Backend Role Scoping
    if (actor.role === 'MANAGER') {
      const resolvedMgrId = await this.resolveActorManagerId(actor);
      isScopedToManager = true;
      actorManagerId = resolvedMgrId || undefined;
      const mgr = resolvedMgrId ? await ManagerService.getManagerById(resolvedMgrId) : null;
      actorManagerName = mgr?.name || actor.email;

      // Filter exclusively to this manager's assigned agents!
      allAgents = allAgents.filter((a) => a.managerId === resolvedMgrId);
    } else if (actor.role === 'AGENT') {
      // Agent only sees themselves in list
      allAgents = allAgents.filter((a) => a.userId === actor.userId);
    }

    // Platform-wide/Scope stats calculation
    const stats = {
      total: allAgents.length,
      active: allAgents.filter((a) => a.status === 'ACTIVE').length,
      inactive: allAgents.filter((a) => a.status === 'INACTIVE').length,
      suspended: allAgents.filter((a) => a.status === 'SUSPENDED').length,
      totalClients: allAgents.reduce((acc, a) => acc + a.clients.length, 0),
      totalNumbers: allAgents.reduce((acc, a) => acc + a.numbers.length, 0),
      totalEarnings: allAgents.reduce((acc, a) => acc + a.earnings, 0),
      totalSms: allAgents.reduce((acc, a) => acc + a.smsCount, 0),
    };

    // 2. Filter by search query
    let filtered = allAgents.filter((a) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;

      const fullName = `${a.firstName} ${a.lastName}`.toLowerCase();
      return (
        a.username.toLowerCase().includes(q) ||
        fullName.includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.contact.toLowerCase().includes(q)
      );
    });

    // 3. Filter by status
    if (status && status !== 'ALL') {
      filtered = filtered.filter((a) => a.status === status);
    }

    // 4. Filter by manager (Super Admin only can filter by arbitrary manager)
    if (managerId && managerId !== 'ALL' && actor.role === 'SUPER_ADMIN') {
      if (managerId === 'UNASSIGNED') {
        filtered = filtered.filter((a) => !a.managerId);
      } else {
        filtered = filtered.filter((a) => a.managerId === managerId);
      }
    }

    // 5. Sort
    filtered.sort((a, b) => {
      let valA: any = a[sortBy as keyof StoredAgentRecord] ?? '';
      let valB: any = b[sortBy as keyof StoredAgentRecord] ?? '';

      if (sortBy === 'name') {
        valA = `${a.firstName} ${a.lastName}`.toLowerCase();
        valB = `${b.firstName} ${b.lastName}`.toLowerCase();
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB as string).toLowerCase();
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    // 6. Pagination
    const validPage = Math.max(1, page);
    const validLimit = Math.max(1, Math.min(100, limit));
    const total = filtered.length;
    const totalPages = Math.ceil(total / validLimit) || 1;
    const startIndex = (validPage - 1) * validLimit;
    const paginated = filtered.slice(startIndex, startIndex + validLimit);

    const items = await Promise.all(paginated.map((a) => this.toListItem(a)));

    return {
      items,
      total,
      page: validPage,
      limit: validLimit,
      totalPages,
      stats,
      scopeInfo: {
        actorRole: actor.role,
        isScopedToManager,
        managerName: actorManagerName,
        managerId: actorManagerId,
      },
    };
  }

  /**
   * Retrieves single agent details by ID (enforcing scope).
   */
  static async getAgentById(id: string, actor: AuthTokenPayload): Promise<AgentDetail> {
    const record = await this.assertAccess(id, actor, 'view');
    return this.toDetail(record);
  }

  /**
   * Retrieves single agent by User ID (enforcing scope).
   */
  static async getAgentByUserId(userId: string, actor: AuthTokenPayload): Promise<AgentDetail | null> {
    await this.initializeSeedAgents();
    for (const record of agentRegistry.values()) {
      if (record.userId === userId) {
        await this.assertAccess(record.id, actor, 'view');
        return this.toDetail(record);
      }
    }
    return null;
  }

  /**
   * Creates a new agent (enforcing scope and manager allocation limits).
   */
  static async createAgent(
    dto: CreateAgentDTO,
    actor: AuthTokenPayload,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<{ agent: AgentDetail; generatedPassword?: string }> {
    await this.initializeSeedAgents();

    // 1. Role enforcement: Only Super Admin and Manager can create agents
    if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'MANAGER') {
      throw new Error('Forbidden: Only Super Administrators and Managers can create agent accounts.');
    }

    let assignedManagerId: string | null = dto.managerId || null;

    // 2. Manager scope enforcement: Manager can ONLY create agent in their own scope!
    if (actor.role === 'MANAGER') {
      const actorManagerId = await this.resolveActorManagerId(actor);
      if (!actorManagerId) {
        throw new Error('Manager profile could not be resolved for current user.');
      }
      if (dto.managerId && dto.managerId !== actorManagerId) {
        throw new Error('Forbidden: Managers cannot create or assign agents outside their own scope.');
      }
      assignedManagerId = actorManagerId;
    }

    const normalizedEmail = dto.email.toLowerCase().trim();
    const normalizedUsername = dto.username.toLowerCase().trim();

    // Check uniqueness
    for (const a of agentRegistry.values()) {
      if (a.email.toLowerCase() === normalizedEmail) {
        throw new Error(`An agent with email '${dto.email}' already exists.`);
      }
      if (a.username.toLowerCase() === normalizedUsername) {
        throw new Error(`An agent with username '${dto.username}' already exists.`);
      }
    }

    // Password generation
    let rawPassword = dto.password?.trim();
    let generatedPassword: string | undefined;

    if (!rawPassword) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
      let randomPass = '';
      for (let i = 0; i < 16; i++) {
        randomPass += chars.charAt(crypto.randomInt(0, chars.length));
      }
      rawPassword = randomPass;
      generatedPassword = randomPass;
    }

    // Create user in UserRepository (hashes password)
    const user = await UserRepository.createUser({
      email: normalizedEmail,
      passwordRaw: rawPassword,
      role: 'AGENT',
      firstName: dto.firstName,
      lastName: dto.lastName,
      status: dto.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
      managerId: assignedManagerId,
    });

    const agentId = `agent-${crypto.randomUUID().slice(0, 8)}`;
    const nowIso = new Date().toISOString();

    const permissions =
      dto.permissions && dto.permissions.length > 0
        ? Array.from(new Set(dto.permissions))
        : [...DEFAULT_ROLE_PERMISSIONS.AGENT];

    const newAgentRecord: StoredAgentRecord = {
      id: agentId,
      userId: user.id,
      username: normalizedUsername,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: normalizedEmail,
      contact: dto.contact.trim(),
      managerId: assignedManagerId,
      commissionRate: dto.commissionRate !== undefined ? Number(dto.commissionRate) : 0.05,
      status: dto.status || 'ACTIVE',
      permissions,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastLoginAt: null,
      clients: [],
      numbers: [],
      smsCount: 0,
      earnings: 0.0,
      balance: 0.0,
    };

    agentRegistry.set(agentId, newAgentRecord);

    // Audit Log
    await AuditService.recordEvent({
      userId: actor.userId,
      email: actor.email,
      action: 'AGENT_CREATED',
      entityType: 'AGENT',
      entityId: agentId,
      reason: `Agent account '${normalizedUsername}' created by ${actor.role} '${actor.email}'`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: {
        agentId,
        userId: user.id,
        username: normalizedUsername,
        email: normalizedEmail,
        managerId: assignedManagerId,
        commissionRate: newAgentRecord.commissionRate,
        status: newAgentRecord.status,
        actorRole: actor.role,
      },
    });

    const detail = await this.toDetail(newAgentRecord);
    return { agent: detail, generatedPassword };
  }

  /**
   * Updates agent profile (enforcing scope).
   */
  static async updateAgent(
    id: string,
    dto: UpdateAgentDTO,
    actor: AuthTokenPayload,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<AgentDetail> {
    const record = await this.assertAccess(id, actor, 'edit');

    const previousState = {
      name: `${record.firstName} ${record.lastName}`,
      contact: record.contact,
      commissionRate: record.commissionRate,
      managerId: record.managerId,
      status: record.status,
    };

    if (dto.firstName) record.firstName = dto.firstName.trim();
    if (dto.lastName) record.lastName = dto.lastName.trim();
    if (dto.contact) record.contact = dto.contact.trim();
    if (dto.commissionRate !== undefined) {
      record.commissionRate = Math.max(0, Math.min(1, Number(dto.commissionRate)));
    }
    if (dto.status) record.status = dto.status;

    // Manager re-assignment rule:
    if (dto.managerId !== undefined) {
      if (actor.role !== 'SUPER_ADMIN') {
        // Manager cannot reassign to another manager
        const actorManagerId = await this.resolveActorManagerId(actor);
        if (dto.managerId !== actorManagerId) {
          throw new Error('Forbidden: Only Super Administrators can reassign agents between managers.');
        }
      } else {
        record.managerId = dto.managerId || null;
      }
    }

    record.updatedAt = new Date().toISOString();

    // Audit Log
    await AuditService.recordEvent({
      userId: actor.userId,
      email: actor.email,
      action: 'AGENT_UPDATED',
      entityType: 'AGENT',
      entityId: id,
      reason: `Agent '${record.username}' profile updated by ${actor.role}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: {
        agentId: id,
        previousState,
        newState: {
          name: `${record.firstName} ${record.lastName}`,
          contact: record.contact,
          commissionRate: record.commissionRate,
          managerId: record.managerId,
          status: record.status,
        },
      },
    });

    return this.toDetail(record);
  }

  /**
   * Updates agent status (Enable / Disable / Suspend) with scope enforcement.
   */
  static async updateStatus(
    id: string,
    newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
    reason: string | undefined,
    actor: AuthTokenPayload,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<AgentDetail> {
    const record = await this.assertAccess(id, actor, 'modify status of');

    if (actor.role === 'AGENT') {
      throw new Error('Forbidden: Agents cannot modify account status.');
    }

    const previousStatus = record.status;
    record.status = newStatus;
    record.updatedAt = new Date().toISOString();

    // Update UserRepository status so login is blocked if SUSPENDED
    const userRepoStatus: UserStatus = newStatus === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE';
    await UserRepository.updateStatus(record.userId, userRepoStatus);

    // Audit Log
    await AuditService.recordEvent({
      userId: actor.userId,
      email: actor.email,
      action: 'AGENT_STATUS_CHANGED',
      entityType: 'AGENT',
      entityId: id,
      reason: reason || `Agent status changed from ${previousStatus} to ${newStatus}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: {
        agentId: id,
        userId: record.userId,
        previousStatus,
        newStatus,
        reason,
        actorRole: actor.role,
      },
    });

    return this.toDetail(record);
  }

  /**
   * Securely resets agent password with scope enforcement.
   */
  static async resetPassword(
    id: string,
    options: { newPassword?: string; autoGenerate?: boolean },
    actor: AuthTokenPayload,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<{ temporaryPassword?: string }> {
    const record = await this.assertAccess(id, actor, 'reset password for');

    if (actor.role === 'AGENT') {
      throw new Error('Forbidden: Agents cannot reset their own password via administrative endpoint.');
    }

    let rawPassword = options.newPassword?.trim();
    let temporaryPassword: string | undefined;

    if (options.autoGenerate || !rawPassword) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
      let randomPass = '';
      for (let i = 0; i < 16; i++) {
        randomPass += chars.charAt(crypto.randomInt(0, chars.length));
      }
      rawPassword = randomPass;
      temporaryPassword = randomPass;
    } else {
      if (rawPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long.');
      }
    }

    const passwordHash = await PasswordService.hash(rawPassword);

    const storedUser = await UserRepository.findByEmail(record.email);
    if (storedUser) {
      storedUser.passwordHash = passwordHash;
      storedUser.updatedAt = new Date().toISOString();

      const prisma = getPrismaClient();
      if (prisma) {
        try {
          await prisma.user.update({
            where: { email: record.email },
            data: { passwordHash },
          });
        } catch {
          // fallback
        }
      }
    }

    record.updatedAt = new Date().toISOString();

    // Audit Log
    await AuditService.recordEvent({
      userId: actor.userId,
      email: actor.email,
      action: 'AGENT_PASSWORD_RESET',
      entityType: 'AGENT',
      entityId: id,
      reason: `Password reset executed for agent '${record.username}' by ${actor.role}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: {
        agentId: id,
        userId: record.userId,
        email: record.email,
        wasAutoGenerated: !!options.autoGenerate || !options.newPassword,
        actorRole: actor.role,
      },
    });

    return { temporaryPassword };
  }

  /**
   * Assigns granular permissions to an agent with scope enforcement.
   */
  static async updatePermissions(
    id: string,
    permissions: string[],
    actor: AuthTokenPayload,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<AgentDetail> {
    const record = await this.assertAccess(id, actor, 'assign permissions to');

    if (actor.role === 'AGENT') {
      throw new Error('Forbidden: Agents cannot modify permission configurations.');
    }

    const validCodes = new Set(ALL_PERMISSIONS.map((p) => p.code));
    const sanitizedPermissions: string[] = [];

    for (const code of permissions) {
      if (validCodes.has(code as any) || code === '*') {
        sanitizedPermissions.push(code);
      }
    }

    const previousPermissions = [...record.permissions];
    record.permissions = Array.from(new Set(sanitizedPermissions));
    record.updatedAt = new Date().toISOString();

    const storedUser = await UserRepository.findByEmail(record.email);
    if (storedUser) {
      storedUser.customPermissions = record.permissions;
    }

    // Audit Log
    await AuditService.recordEvent({
      userId: actor.userId,
      email: actor.email,
      action: 'AGENT_PERMISSIONS_UPDATED',
      entityType: 'AGENT',
      entityId: id,
      reason: `Permissions modified for agent '${record.username}' by ${actor.role}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: {
        agentId: id,
        previousPermissions,
        newPermissions: record.permissions,
        actorRole: actor.role,
      },
    });

    return this.toDetail(record);
  }

  /**
   * Assigns an agent to a manager (Super Admin only).
   */
  static async assignManager(
    id: string,
    targetManagerId: string | null,
    actor: AuthTokenPayload,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<AgentDetail> {
    await this.assertAccess(id, actor, 'reassign manager for');

    if (actor.role !== 'SUPER_ADMIN') {
      throw new Error('Forbidden: Only Super Administrators can reassign agents between managers.');
    }

    const record = agentRegistry.get(id)!;
    const previousManagerId = record.managerId;

    if (targetManagerId) {
      const targetMgr = await ManagerService.getManagerById(targetManagerId);
      if (!targetMgr) {
        throw new Error(`Target manager with ID '${targetManagerId}' does not exist.`);
      }
    }

    record.managerId = targetManagerId;
    record.updatedAt = new Date().toISOString();

    // Audit Log
    await AuditService.recordEvent({
      userId: actor.userId,
      email: actor.email,
      action: 'AGENT_MANAGER_REASSIGNED',
      entityType: 'AGENT',
      entityId: id,
      reason: `Agent '${record.username}' manager reassigned from '${previousManagerId}' to '${targetManagerId}'`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: {
        agentId: id,
        previousManagerId,
        newManagerId: targetManagerId,
        actorRole: actor.role,
      },
    });

    return this.toDetail(record);
  }

  /**
   * Retrieves agent client list with scope enforcement.
   */
  static async getClients(id: string, actor: AuthTokenPayload): Promise<AgentClientItem[]> {
    const record = await this.assertAccess(id, actor, 'view clients for');
    return record.clients;
  }

  /**
   * Retrieves agent number inventory with scope enforcement.
   */
  static async getNumbers(id: string, actor: AuthTokenPayload): Promise<AgentNumberItem[]> {
    const record = await this.assertAccess(id, actor, 'view numbers for');
    return record.numbers;
  }

  /**
   * Retrieves agent statistics with scope enforcement.
   */
  static async getStatistics(id: string, actor: AuthTokenPayload): Promise<AgentStatistics> {
    const record = await this.assertAccess(id, actor, 'view statistics for');
    const assignedNumbers = record.numbers.filter((n) => n.status === 'ASSIGNED').length;
    const unassignedNumbers = record.numbers.filter((n) => n.status !== 'ASSIGNED').length;

    return {
      totalClients: record.clients.length,
      assignedNumbers,
      unassignedNumbers,
      smsCount: record.smsCount,
      earnings: record.earnings,
      currentBalance: record.balance,
      currency: 'USD',
    };
  }

  /**
   * Retrieves agent activity audit logs with scope enforcement.
   */
  static async getActivity(id: string, actor: AuthTokenPayload) {
    const record = await this.assertAccess(id, actor, 'view activity for');
    return AuditService.getLogsForEntity(record.userId);
  }
}

// Auto-initialize seed agents on module load
AgentService.initializeSeedAgents().catch((err) => {
  logger.error('Failed to initialize seed agents', err);
});
