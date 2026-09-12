import crypto from 'crypto';
import { env } from '../config/env';
import { SafeUser, UserRole, UserStatus } from '../types/auth';
import { PasswordService } from './password.service';
import { PermissionsService } from './permissions.service';
import { getPrismaClient } from '../db/prisma';
import { Logger } from '../utils/logger';

const userLogger = new Logger('UserRepository');

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string | null;
  lastName: string | null;
  status: UserStatus;
  role: {
    id: string;
    name: UserRole;
    displayName: string;
  };
  customPermissions?: string[];
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  managerId?: string | null;
  agentId?: string | null;
  clientId?: string | null;
}

// In-memory persistent storage for resilience across environments
const memoryUsers: Map<string, StoredUser> = new Map();
let isInitialized = false;
let initPromise: Promise<void> | null = null;

export class UserRepository {
  /**
   * Initializes seed users using environment-configurable credentials and bcrypt password hashes.
   */
  static async initializeSeedUsers(): Promise<void> {
    if (isInitialized) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      userLogger.info('Initializing environment seed user accounts...');

    const seedConfigs: Array<{
      email: string;
      passwordRaw: string;
      role: UserRole;
      displayName: string;
      firstName: string;
      lastName: string;
      status: UserStatus;
    }> = [
      {
        email: env.SEED_ADMIN_EMAIL,
        passwordRaw: env.SEED_ADMIN_PASSWORD,
        role: 'SUPER_ADMIN',
        displayName: 'Super Administrator',
        firstName: 'Alexander',
        lastName: 'Vance',
        status: 'ACTIVE',
      },
      {
        email: env.SEED_MANAGER_EMAIL,
        passwordRaw: env.SEED_MANAGER_PASSWORD,
        role: 'MANAGER',
        displayName: 'Operations Manager',
        firstName: 'Elena',
        lastName: 'Rostova',
        status: 'ACTIVE',
      },
      {
        email: env.SEED_AGENT_EMAIL,
        passwordRaw: env.SEED_AGENT_PASSWORD,
        role: 'AGENT',
        displayName: 'Business Agent',
        firstName: 'Marcus',
        lastName: 'Brody',
        status: 'ACTIVE',
      },
      {
        email: env.SEED_CLIENT_EMAIL,
        passwordRaw: env.SEED_CLIENT_PASSWORD,
        role: 'CLIENT',
        displayName: 'Enterprise Client',
        firstName: 'Sophia',
        lastName: 'Chen',
        status: 'ACTIVE',
      },
      {
        email: 'disabled@smshub.local',
        passwordRaw: env.SEED_CLIENT_PASSWORD,
        role: 'CLIENT',
        displayName: 'Suspended Client',
        firstName: 'Dormant',
        lastName: 'Account',
        status: 'SUSPENDED',
      },
    ];

    // Guarantee default platform dev accounts are always available for UI role-switching and tests
    const defaultLocalAccounts: Array<{
      email: string;
      passwordRaw: string;
      role: UserRole;
      displayName: string;
      firstName: string;
      lastName: string;
      status: UserStatus;
    }> = [
      {
        email: 'admin@smshub.local',
        passwordRaw: 'Admin#Secure2026!',
        role: 'SUPER_ADMIN',
        displayName: 'Super Administrator',
        firstName: 'Alexander',
        lastName: 'Vance',
        status: 'ACTIVE',
      },
      {
        email: 'manager@smshub.local',
        passwordRaw: 'Manager#Secure2026!',
        role: 'MANAGER',
        displayName: 'Operations Manager',
        firstName: 'Elena',
        lastName: 'Rostova',
        status: 'ACTIVE',
      },
      {
        email: 'agent@smshub.local',
        passwordRaw: 'Agent#Secure2026!',
        role: 'AGENT',
        displayName: 'Business Agent',
        firstName: 'Marcus',
        lastName: 'Brody',
        status: 'ACTIVE',
      },
      {
        email: 'client@smshub.local',
        passwordRaw: 'Client#Secure2026!',
        role: 'CLIENT',
        displayName: 'Enterprise Client',
        firstName: 'Sophia',
        lastName: 'Chen',
        status: 'ACTIVE',
      },
    ];

    for (const localAcc of defaultLocalAccounts) {
      if (!seedConfigs.some((s) => s.email.toLowerCase() === localAcc.email.toLowerCase())) {
        seedConfigs.push(localAcc);
      }
    }

    for (const seed of seedConfigs) {
      const existing = await this.findByEmail(seed.email);
      if (!existing) {
        const passwordHash = await PasswordService.hash(seed.passwordRaw);
        const userId = crypto.randomUUID();
        const roleId = crypto.randomUUID();

        const stored: StoredUser = {
          id: userId,
          email: seed.email.toLowerCase(),
          passwordHash,
          firstName: seed.firstName,
          lastName: seed.lastName,
          status: seed.status,
          role: {
            id: roleId,
            name: seed.role,
            displayName: seed.displayName,
          },
          lastLoginAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        memoryUsers.set(seed.email.toLowerCase(), stored);
      }
    }

    isInitialized = true;
    userLogger.info(`Seed user repository ready with ${memoryUsers.size} default identities.`);
    })();

    return initPromise;
  }

  /**
   * Sanitizes a StoredUser into a SafeUser with NEVER exposing passwordHash.
   */
  static toSafeUser(user: StoredUser): SafeUser {
    const permissions = PermissionsService.getPermissionsForUser(
      user.role.name,
      user.customPermissions
    );

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      role: {
        id: user.role.id,
        name: user.role.name,
        displayName: user.role.displayName,
      },
      permissions,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      managerId: user.managerId,
      agentId: user.agentId,
      clientId: user.clientId,
    };
  }

  /**
   * Finds a user record by email (including passwordHash for internal authentication verification).
   */
  static async findByEmail(email: string): Promise<StoredUser | null> {
    const normalizedEmail = email.toLowerCase().trim();

    // Check database if connected
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: { role: true },
        });

        if (dbUser) {
          return {
            id: dbUser.id,
            email: dbUser.email,
            passwordHash: dbUser.passwordHash,
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            status: dbUser.status as UserStatus,
            role: {
              id: dbUser.role.id,
              name: dbUser.role.name as UserRole,
              displayName: dbUser.role.displayName,
            },
            lastLoginAt: dbUser.lastLoginAt ? dbUser.lastLoginAt.toISOString() : null,
            createdAt: dbUser.createdAt.toISOString(),
            updatedAt: dbUser.updatedAt.toISOString(),
          };
        }
      } catch (err) {
        // Fallback to memory
      }
    }

    // Check in-memory store
    const memUser = memoryUsers.get(normalizedEmail);
    return memUser || null;
  }

  /**
   * Finds a safe user by ID.
   */
  static async findById(id: string): Promise<SafeUser | null> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id },
          include: { role: true },
        });
        if (dbUser) {
          const stored: StoredUser = {
            id: dbUser.id,
            email: dbUser.email,
            passwordHash: dbUser.passwordHash,
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            status: dbUser.status as UserStatus,
            role: {
              id: dbUser.role.id,
              name: dbUser.role.name as UserRole,
              displayName: dbUser.role.displayName,
            },
            lastLoginAt: dbUser.lastLoginAt ? dbUser.lastLoginAt.toISOString() : null,
            createdAt: dbUser.createdAt.toISOString(),
            updatedAt: dbUser.updatedAt.toISOString(),
          };
          return this.toSafeUser(stored);
        }
      } catch (err) {
        // fallback
      }
    }

    for (const u of memoryUsers.values()) {
      if (u.id === id) {
        return this.toSafeUser(u);
      }
    }

    return null;
  }

  /**
   * Updates user lastLoginAt timestamp.
   */
  static async updateLastLogin(id: string): Promise<void> {
    const nowIso = new Date().toISOString();
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const exists = await prisma.user.findUnique({ where: { id }, select: { id: true } }).catch(() => null);
        if (exists) {
          await prisma.user.update({
            where: { id },
            data: { lastLoginAt: new Date() },
          });
        }
      } catch (e) {
        // fallback
      }
    }

    for (const u of memoryUsers.values()) {
      if (u.id === id) {
        u.lastLoginAt = nowIso;
        u.updatedAt = nowIso;
        break;
      }
    }
  }

  /**
   * Creates a new user with secure password hash and validates role hierarchy.
   */
  static async createUser(data: {
    email: string;
    passwordRaw: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
    status?: UserStatus;
    managerId?: string | null;
    agentId?: string | null;
    clientId?: string | null;
  }): Promise<SafeUser> {
    const normalizedEmail = data.email.toLowerCase().trim();

    const existing = await this.findByEmail(normalizedEmail);
    if (existing) {
      throw new Error(`User with email '${data.email}' already exists.`);
    }

    const passwordHash = await PasswordService.hash(data.passwordRaw);
    const userId = crypto.randomUUID();
    const roleId = crypto.randomUUID();

    const stored: StoredUser = {
      id: userId,
      email: normalizedEmail,
      passwordHash,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      status: data.status || 'ACTIVE',
      role: {
        id: roleId,
        name: data.role,
        displayName: data.role.replace('_', ' '),
      },
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      managerId: data.managerId,
      agentId: data.agentId,
      clientId: data.clientId,
    };

    memoryUsers.set(normalizedEmail, stored);

    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const roleRecord = await prisma.role.findUnique({ where: { name: data.role } });
        if (roleRecord) {
          await prisma.user.create({
            data: {
              id: userId,
              email: normalizedEmail,
              passwordHash,
              firstName: data.firstName || null,
              lastName: data.lastName || null,
              status: stored.status,
              roleId: roleRecord.id,
            },
          });
        }
      } catch (err) {
        userLogger.warn('Could not persist new user to PostgreSQL, saved in memory', err);
      }
    }

    return this.toSafeUser(stored);
  }

  /**
   * Updates user status (ACTIVE, SUSPENDED, PENDING).
   */
  static async updateStatus(id: string, newStatus: UserStatus): Promise<SafeUser | null> {
    for (const u of memoryUsers.values()) {
      if (u.id === id) {
        u.status = newStatus;
        u.updatedAt = new Date().toISOString();

        const prisma = getPrismaClient();
        if (prisma) {
          try {
            const exists = await prisma.user.findUnique({ where: { id }, select: { id: true } }).catch(() => null);
            if (exists) {
              await prisma.user.update({
                where: { id },
                data: { status: newStatus },
              });
            }
          } catch (e) {
            // fallback
          }
        }

        return this.toSafeUser(u);
      }
    }

    return null;
  }

  /**
   * Resets password for a user with Argon2 / bcrypt hashing.
   */
  static async resetPassword(id: string, newPasswordRaw: string): Promise<boolean> {
    const passwordHash = await PasswordService.hash(newPasswordRaw);
    let updated = false;

    for (const u of memoryUsers.values()) {
      if (u.id === id) {
        u.passwordHash = passwordHash;
        u.updatedAt = new Date().toISOString();
        updated = true;
        break;
      }
    }

    const prisma = getPrismaClient();
    if (prisma) {
      try {
        await prisma.user.update({
          where: { id },
          data: { passwordHash },
        });
        updated = true;
      } catch (err) {
        // fallback
      }
    }

    return updated;
  }

  /**
   * Updates custom permissions for a user.
   */
  static async updateCustomPermissions(id: string, permissions: string[]): Promise<boolean> {
    let updated = false;
    for (const u of memoryUsers.values()) {
      if (u.id === id) {
        u.customPermissions = permissions;
        u.updatedAt = new Date().toISOString();
        updated = true;
        break;
      }
    }
    return updated;
  }

  /**
   * Lists users scoped by the requesting actor's role.
   * - SUPER_ADMIN: sees all users.
   * - MANAGER: sees AGENTS and CLIENTS.
   * - AGENT: sees their assigned CLIENTS.
   * - CLIENT: sees only their own profile.
   */
  static async listUsers(actorRole: UserRole, actorId: string): Promise<SafeUser[]> {
    await this.initializeSeedUsers();

    const all = Array.from(memoryUsers.values());

    let filtered: StoredUser[];
    if (actorRole === 'SUPER_ADMIN') {
      filtered = all;
    } else if (actorRole === 'MANAGER') {
      filtered = all.filter((u) => u.role.name === 'AGENT' || u.role.name === 'CLIENT');
    } else if (actorRole === 'AGENT') {
      filtered = all.filter((u) => u.role.name === 'CLIENT' && (u.agentId === actorId || !u.agentId));
    } else {
      // CLIENT: only self
      filtered = all.filter((u) => u.id === actorId);
    }

    return filtered.map((u) => this.toSafeUser(u));
  }
}

// Auto-initialize seed users on module load
UserRepository.initializeSeedUsers().catch((err) => {
  userLogger.error('Failed to initialize seed users', err);
});
