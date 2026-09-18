import crypto from 'crypto';
import { env } from '../config/env';
import { AuthTokenPayload, UserRole, UserStatus } from '../types/auth';
import {
  CreateManagerDTO,
  ManagerAgentItem,
  ManagerClientItem,
  ManagerDetail,
  ManagerListItem,
  ManagerListQuery,
  PaginatedManagers,
  UpdateManagerDTO,
} from '../types/manager';
import { UserRepository, StoredUser } from './user.repository';
import { PasswordService } from './password.service';
import { PermissionsService, ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from './permissions.service';
import { AuditService } from './audit.service';
import { getPrismaClient } from '../db/prisma';
import { Logger } from '../utils/logger';

const logger = new Logger('ManagerService');

interface StoredManagerRecord {
  id: string; // Manager profile ID
  userId: string; // User ID
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  department: string;
  status: UserStatus;
  maxAgents: number;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  agents: ManagerAgentItem[];
  clients: ManagerClientItem[];
}

// In-memory persistent registry for manager profiles
const managerRegistry: Map<string, StoredManagerRecord> = new Map();
let isInitialized = false;
let initPromise: Promise<void> | null = null;

export class ManagerService {
  /**
   * Initializes seed managers and links them with agents and clients.
   */
  static async initializeSeedManagers(): Promise<void> {
    if (isInitialized) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      await UserRepository.initializeSeedUsers();
      logger.info('Initializing Manager Management profiles and hierarchy...');

    // Find Elena Rostova (the primary Operations Manager from seed)
    const elenaUser = await UserRepository.findByEmail(env.SEED_MANAGER_EMAIL);
    const elenaUserId = elenaUser?.id || crypto.randomUUID();

    const initialManagers: StoredManagerRecord[] = [
      {
        id: 'mgr-profile-001',
        userId: elenaUserId,
        username: 'elena.rostova',
        firstName: 'Elena',
        lastName: 'Rostova',
        email: env.SEED_MANAGER_EMAIL.toLowerCase(),
        contact: '+1 (202) 555-0144',
        department: 'Carrier Operations & Routing',
        status: 'ACTIVE',
        maxAgents: 50,
        permissions: [...DEFAULT_ROLE_PERMISSIONS.MANAGER],
        createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        lastLoginAt: new Date(Date.now() - 14 * 60000).toISOString(),
        agents: [
          {
            id: 'agent-prof-001',
            userId: 'user-agent-marcus',
            name: 'Marcus Brody',
            firstName: 'Marcus',
            lastName: 'Brody',
            email: env.SEED_AGENT_EMAIL.toLowerCase(),
            contact: '+1 (202) 555-0188',
            status: 'ACTIVE',
            commissionRate: 0.05,
            clientsCount: 12,
            createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          },
          {
            id: 'agent-prof-002',
            userId: 'user-agent-priya',
            name: 'Priya Sharma',
            firstName: 'Priya',
            lastName: 'Sharma',
            email: 'p.sharma@sms-telecom.net',
            contact: '+91 98200 11223',
            status: 'ACTIVE',
            commissionRate: 0.045,
            clientsCount: 8,
            createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
          },
        ],
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
            createdAt: new Date(Date.now() - 28 * 86400000).toISOString(),
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
            createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
          },
        ],
      },
      {
        id: 'mgr-profile-002',
        userId: 'usr-mgr-viktor-kraus',
        username: 'viktor.kraus',
        firstName: 'Viktor',
        lastName: 'Kraus',
        email: 'viktor.kraus@sms-platform.internal',
        contact: '+44 20 7946 0912',
        department: 'EMEA Routing & Gateway Delivery',
        status: 'ACTIVE',
        maxAgents: 35,
        permissions: [
          'users.view',
          'users.create',
          'users.update',
          'providers.view',
          'numbers.view',
          'numbers.assign',
          'sms.view',
          'reports.view',
          'billing.view',
        ],
        createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        lastLoginAt: new Date(Date.now() - 3 * 3600000).toISOString(),
        agents: [
          {
            id: 'agent-prof-003',
            userId: 'user-agent-liam',
            name: "Liam O'Connor",
            firstName: 'Liam',
            lastName: "O'Connor",
            email: 'liam.oc@route-uk.co',
            contact: '+44 7700 900123',
            status: 'ACTIVE',
            commissionRate: 0.06,
            clientsCount: 15,
            createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
          },
        ],
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
      },
      {
        id: 'mgr-profile-003',
        userId: 'usr-mgr-sarah-jenkins',
        username: 'sarah.jenkins',
        firstName: 'Sarah',
        lastName: 'Jenkins',
        email: 's.jenkins@sms-platform.internal',
        contact: '+1 (202) 555-0199',
        department: 'Compliance, Risk & KYC',
        status: 'PENDING',
        maxAgents: 20,
        permissions: ['users.view', 'sms.view', 'reports.view', 'audit.view'],
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        lastLoginAt: null,
        agents: [],
        clients: [],
      },
      {
        id: 'mgr-profile-004',
        userId: 'usr-mgr-daisuke-sato',
        username: 'daisuke.sato',
        firstName: 'Daisuke',
        lastName: 'Sato',
        email: 'd.sato@sms-platform.internal',
        contact: '+81 3 5555 0177',
        department: 'APAC Operations & SMPP Hub',
        status: 'SUSPENDED',
        maxAgents: 40,
        permissions: ['users.view', 'providers.view', 'sms.view', 'reports.view'],
        createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
        lastLoginAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        agents: [
          {
            id: 'agent-prof-004',
            userId: 'user-agent-meiling',
            name: 'Mei-Ling Zhou',
            firstName: 'Mei-Ling',
            lastName: 'Zhou',
            email: 'ml.zhou@pacific-sms.sg',
            contact: '+65 6789 0123',
            status: 'ACTIVE',
            commissionRate: 0.05,
            clientsCount: 5,
            createdAt: new Date(Date.now() - 70 * 86400000).toISOString(),
          },
        ],
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
            createdAt: new Date(Date.now() - 65 * 86400000).toISOString(),
          },
        ],
      },
    ];

    for (const m of initialManagers) {
      managerRegistry.set(m.id, m);

      // Ensure user account exists in UserRepository so they can be authenticated or checked
      const existingUser = await UserRepository.findByEmail(m.email);
      if (!existingUser) {
        try {
          await UserRepository.createUser({
            email: m.email,
            passwordRaw: env.SEED_MANAGER_PASSWORD,
            role: 'MANAGER',
            firstName: m.firstName,
            lastName: m.lastName,
            status: m.status,
          });
        } catch {
          // Ignore if already created
        }
      }
    }

    isInitialized = true;
    logger.info(`Manager repository successfully initialized with ${managerRegistry.size} manager profiles.`);
    })();

    return initPromise;
  }

  /**
   * Helper to format a manager record into a clean ManagerListItem.
   */
  private static toListItem(m: StoredManagerRecord): ManagerListItem {
    return {
      id: m.id,
      userId: m.userId,
      username: m.username,
      firstName: m.firstName,
      lastName: m.lastName,
      name: `${m.firstName} ${m.lastName}`.trim(),
      email: m.email,
      contact: m.contact,
      department: m.department,
      status: m.status,
      maxAgents: m.maxAgents,
      agentsCount: m.agents.length,
      clientsCount: m.clients.length,
      permissions: m.permissions,
      lastLoginAt: m.lastLoginAt,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    };
  }

  /**
   * Helper to format full details including activity summary, agents, clients, and audit logs.
   */
  private static async toDetail(m: StoredManagerRecord): Promise<ManagerDetail> {
    const listItem = this.toListItem(m);

    // Fetch related audit logs for this manager
    const activityLogs = await AuditService.getLogsForEntity(m.userId);

    const totalLogins = activityLogs.filter(
      (a) => a.action === 'LOGIN_SUCCESS' || a.action === 'AUTH_LOGIN'
    ).length;

    const activitySummary = {
      totalAgents: m.agents.length,
      totalClients: m.clients.length,
      totalLogins: Math.max(totalLogins, m.lastLoginAt ? 3 : 0),
      recentActionsCount: activityLogs.length,
      lastActive: m.lastLoginAt || m.updatedAt,
    };

    return {
      ...listItem,
      activitySummary,
      agents: m.agents,
      clients: m.clients,
      recentActivity: activityLogs,
    };
  }

  /**
   * Lists managers with search, filters, sorting, and pagination.
   */
  static async listManagers(query: ManagerListQuery = {}): Promise<PaginatedManagers> {
    await this.initializeSeedManagers();

    const {
      search = '',
      status = 'ALL',
      department = 'ALL',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortDir = 'desc',
    } = query;

    const allManagers = Array.from(managerRegistry.values());

    // Compute platform-wide stats across all managers
    const stats = {
      total: allManagers.length,
      active: allManagers.filter((m) => m.status === 'ACTIVE').length,
      suspended: allManagers.filter((m) => m.status === 'SUSPENDED').length,
      pending: allManagers.filter((m) => m.status === 'PENDING').length,
      totalAgentsManaged: allManagers.reduce((acc, m) => acc + m.agents.length, 0),
      totalClientsManaged: allManagers.reduce((acc, m) => acc + m.clients.length, 0),
    };

    // Filter by search terms
    let filtered = allManagers.filter((m) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;

      const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
      return (
        m.username.toLowerCase().includes(q) ||
        fullName.includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.contact.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q)
      );
    });

    // Filter by status
    if (status && status !== 'ALL') {
      filtered = filtered.filter((m) => m.status === status);
    }

    // Filter by department
    if (department && department !== 'ALL') {
      filtered = filtered.filter((m) => m.department.toLowerCase() === department.toLowerCase());
    }

    // Sort
    filtered.sort((a, b) => {
      let valA: any = a[sortBy as keyof StoredManagerRecord] ?? '';
      let valB: any = b[sortBy as keyof StoredManagerRecord] ?? '';

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

    // Pagination
    const validPage = Math.max(1, page);
    const validLimit = Math.max(1, Math.min(100, limit));
    const total = filtered.length;
    const totalPages = Math.ceil(total / validLimit) || 1;
    const startIndex = (validPage - 1) * validLimit;
    const paginated = filtered.slice(startIndex, startIndex + validLimit);

    return {
      items: paginated.map((m) => this.toListItem(m)),
      total,
      page: validPage,
      limit: validLimit,
      totalPages,
      stats,
    };
  }

  /**
   * Retrieves single manager details by ID.
   */
  static async getManagerById(id: string): Promise<ManagerDetail | null> {
    await this.initializeSeedManagers();
    const record = managerRegistry.get(id);
    if (!record) return null;
    return this.toDetail(record);
  }

  /**
   * Retrieves single manager details by user ID.
   */
  static async getManagerByUserId(userId: string): Promise<ManagerDetail | null> {
    await this.initializeSeedManagers();
    for (const record of managerRegistry.values()) {
      if (record.userId === userId) {
        return this.toDetail(record);
      }
    }
    return null;
  }

  /**
   * Creates a new manager profile and user account.
   */
  static async createManager(
    dto: CreateManagerDTO,
    actor: AuthTokenPayload,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<{ manager: ManagerDetail; generatedPassword?: string }> {
    await this.initializeSeedManagers();

    const normalizedEmail = dto.email.toLowerCase().trim();
    const normalizedUsername = dto.username.toLowerCase().trim();

    // Check uniqueness of email and username
    for (const m of managerRegistry.values()) {
      if (m.email.toLowerCase() === normalizedEmail) {
        throw new Error(`A manager with email '${dto.email}' already exists.`);
      }
      if (m.username.toLowerCase() === normalizedUsername) {
        throw new Error(`A manager with username '${dto.username}' already exists.`);
      }
    }

    // Determine password
    let rawPassword = dto.password?.trim();
    let generatedPassword: string | undefined;

    if (!rawPassword) {
      // Auto-generate strong 16-character secure random password
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
      let randomPass = '';
      for (let i = 0; i < 16; i++) {
        randomPass += chars.charAt(crypto.randomInt(0, chars.length));
      }
      rawPassword = randomPass;
      generatedPassword = randomPass;
    }

    // Create user in UserRepository (handles bcrypt password hashing)
    const user = await UserRepository.createUser({
      email: normalizedEmail,
      passwordRaw: rawPassword,
      role: 'MANAGER',
      firstName: dto.firstName,
      lastName: dto.lastName,
      status: dto.status || 'ACTIVE',
    });

    const managerId = `mgr-${crypto.randomUUID().slice(0, 8)}`;
    const nowIso = new Date().toISOString();

    const permissions =
      dto.permissions && dto.permissions.length > 0
        ? Array.from(new Set(dto.permissions))
        : [...DEFAULT_ROLE_PERMISSIONS.MANAGER];

    const newManagerRecord: StoredManagerRecord = {
      id: managerId,
      userId: user.id,
      username: normalizedUsername,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: normalizedEmail,
      contact: dto.contact.trim(),
      department: dto.department.trim(),
      status: dto.status || 'ACTIVE',
      maxAgents: dto.maxAgents || 50,
      permissions,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastLoginAt: null,
      agents: [],
      clients: [],
    };

    managerRegistry.set(managerId, newManagerRecord);

    // Audit Logging
    await AuditService.recordEvent({
      userId: actor.userId,
      email: actor.email,
      action: 'MANAGER_CREATED',
      entityType: 'MANAGER',
      entityId: managerId,
      reason: `Manager account '${normalizedUsername}' created in department '${newManagerRecord.department}'`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: {
        managerId,
        userId: user.id,
        username: normalizedUsername,
        email: normalizedEmail,
        department: newManagerRecord.department,
        status: newManagerRecord.status,
        actorRole: actor.role,
      },
    });

    const detail = await this.toDetail(newManagerRecord);
    return { manager: detail, generatedPassword };
  }

  /**
   * Updates manager details (name, username, contact, department, maxAgents).
   */
  static async updateManager(
    id: string,
    dto: UpdateManagerDTO,
    actor: AuthTokenPayload,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<ManagerDetail> {
    await this.initializeSeedManagers();

    const record = managerRegistry.get(id);
    if (!record) {
      throw new Error(`Manager with ID '${id}' not found.`);
    }

    const previousState = {
      username: record.username,
      name: `${record.firstName} ${record.lastName}`,
      contact: record.contact,
      department: record.department,
      maxAgents: record.maxAgents,
    };

    // Check username uniqueness if changed
    if (dto.username) {
      const normalizedUsername = dto.username.toLowerCase().trim();
      if (normalizedUsername !== record.username) {
        for (const [otherId, m] of managerRegistry.entries()) {
          if (otherId !== id && m.username.toLowerCase() === normalizedUsername) {
            throw new Error(`Username '${dto.username}' is already in use by another manager.`);
          }
        }
        record.username = normalizedUsername;
      }
    }

    if (dto.firstName) record.firstName = dto.firstName.trim();
    if (dto.lastName) record.lastName = dto.lastName.trim();
    if (dto.contact) record.contact = dto.contact.trim();
    if (dto.department) record.department = dto.department.trim();
    if (dto.maxAgents !== undefined) record.maxAgents = Math.max(1, dto.maxAgents);

    record.updatedAt = new Date().toISOString();

    // Audit Logging
    await AuditService.recordEvent({
      userId: actor.userId,
      email: actor.email,
      action: 'MANAGER_UPDATED',
      entityType: 'MANAGER',
      entityId: id,
      reason: `Manager '${record.username}' profile updated`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: {
        managerId: id,
        previousState,
        newState: {
          username: record.username,
          name: `${record.firstName} ${record.lastName}`,
          contact: record.contact,
          department: record.department,
          maxAgents: record.maxAgents,
        },
      },
    });

    return this.toDetail(record);
  }

  /**
   * Enables, disables, or suspends a manager.
   */
  static async updateStatus(
    id: string,
    newStatus: UserStatus,
    reason: string | undefined,
    actor: AuthTokenPayload,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<ManagerDetail> {
    await this.initializeSeedManagers();

    const record = managerRegistry.get(id);
    if (!record) {
      throw new Error(`Manager with ID '${id}' not found.`);
    }

    // Prohibit self-suspension
    if (record.userId === actor.userId) {
      throw new Error('Action prohibited: You cannot modify your own manager account status.');
    }

    const previousStatus = record.status;
    record.status = newStatus;
    record.updatedAt = new Date().toISOString();

    // Update UserRepository status so authentication blocks suspended users immediately
    await UserRepository.updateStatus(record.userId, newStatus);

    // Audit Logging
    await AuditService.recordEvent({
      userId: actor.userId,
      email: actor.email,
      action: 'MANAGER_STATUS_CHANGED',
      entityType: 'MANAGER',
      entityId: id,
      reason: reason || `Manager status changed from ${previousStatus} to ${newStatus}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: {
        managerId: id,
        userId: record.userId,
        previousStatus,
        newStatus,
        notes: reason,
      },
    });

    return this.toDetail(record);
  }

  /**
   * Securely resets a manager's password.
   * Never stores plaintext password. Returns temporary password for one-time display.
   */
  static async resetPassword(
    id: string,
    options: { newPassword?: string; autoGenerate?: boolean },
    actor: AuthTokenPayload,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<{ temporaryPassword?: string }> {
    await this.initializeSeedManagers();

    const record = managerRegistry.get(id);
    if (!record) {
      throw new Error(`Manager with ID '${id}' not found.`);
    }

    let rawPassword = options.newPassword?.trim();
    let temporaryPassword: string | undefined;

    if (options.autoGenerate || !rawPassword) {
      // Auto-generate strong password
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

    // Hash securely with bcrypt
    const passwordHash = await PasswordService.hash(rawPassword);

    // Update in UserRepository memory and Prisma
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

    // Audit Logging
    await AuditService.recordEvent({
      userId: actor.userId,
      email: actor.email,
      action: 'MANAGER_PASSWORD_RESET',
      entityType: 'MANAGER',
      entityId: id,
      reason: `Password reset executed by Super Admin '${actor.email}'`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: {
        managerId: id,
        userId: record.userId,
        email: record.email,
        wasAutoGenerated: !!options.autoGenerate || !options.newPassword,
      },
    });

    return { temporaryPassword };
  }

  /**
   * Assigns granular permissions to a manager.
   */
  static async updatePermissions(
    id: string,
    permissions: string[],
    actor: AuthTokenPayload,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<ManagerDetail> {
    await this.initializeSeedManagers();

    const record = managerRegistry.get(id);
    if (!record) {
      throw new Error(`Manager with ID '${id}' not found.`);
    }

    // Validate that all permissions are legitimate permission codes or '*'
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

    // Update in UserRepository
    const storedUser = await UserRepository.findByEmail(record.email);
    if (storedUser) {
      storedUser.customPermissions = record.permissions;
    }

    // Audit Logging
    await AuditService.recordEvent({
      userId: actor.userId,
      email: actor.email,
      action: 'MANAGER_PERMISSIONS_UPDATED',
      entityType: 'MANAGER',
      entityId: id,
      reason: `Assigned permissions modified for manager '${record.username}'`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: {
        managerId: id,
        previousPermissions,
        newPermissions: record.permissions,
        added: record.permissions.filter((p) => !previousPermissions.includes(p)),
        removed: previousPermissions.filter((p) => !record.permissions.includes(p)),
      },
    });

    return this.toDetail(record);
  }

  /**
   * Returns list of unique departments.
   */
  static async getDepartments(): Promise<string[]> {
    await this.initializeSeedManagers();
    const depts = new Set<string>();
    for (const m of managerRegistry.values()) {
      if (m.department) depts.add(m.department);
    }
    return Array.from(depts).sort();
  }

  /**
   * Returns available permissions for assignment.
   */
  static getAvailablePermissions() {
    return ALL_PERMISSIONS;
  }
}

// Auto-initialize seed managers on module load
ManagerService.initializeSeedManagers().catch((err) => {
  logger.error('Failed to initialize seed managers', err);
});
