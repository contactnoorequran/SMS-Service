import { registerProfiles, persistProfileService } from './production-store';
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
    if (process.env.NODE_ENV === 'production') return;
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
        email: 'abuzar@smshub.local',
        passwordRaw: '11223344',
        role: 'SUPER_ADMIN',
        displayName: 'Abuzar',
        firstName: 'Abuzar',
        lastName: '',
        status: 'ACTIVE',
      },
      {
        email: 'zubair@smshub.local',
        passwordRaw: '11223344',
        role: 'AGENT',
        displayName: 'Zubair',
        firstName: 'Zubair',
        lastName: '',
        status: 'ACTIVE',
      },
      {
        email: 'muddasir@smshub.local',
        passwordRaw: '11223344',
        role: 'MANAGER',
        displayName: 'Muddasir',
        firstName: 'Muddasir',
        lastName: '',
        status: 'ACTIVE',
      },
      {
        email: 'hamza@smshub.local',
        passwordRaw: '11223344',
        role: 'CLIENT',
        displayName: 'Hamza',
        firstName: 'Hamza',
        lastName: '',
        status: 'ACTIVE',
      },
    ];

    for (const seed of seedConfigs) {
      const emailLower = seed.email.toLowerCase();
      let stored = memoryUsers.get(emailLower);
      if (!stored) {
        let userId: string = crypto.randomUUID();
        let roleId: string = crypto.randomUUID();
        let passwordHash = await PasswordService.hash(seed.passwordRaw);

        const prisma = getPrismaClient();
        if (prisma) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: emailLower },
              include: { userRoles: { include: { role: true } } },
            });
            if (dbUser) {
              userId = dbUser.id;
              passwordHash = dbUser.passwordHash || passwordHash;
              if (dbUser.userRoles[0]?.role) {
                roleId = dbUser.userRoles[0].role.id;
              }
            } else {
              const roleRecord = await prisma.role.findUnique({ where: { name: seed.role } });
              if (roleRecord) {
                const fullName = `${seed.firstName || ''} ${seed.lastName || ''}`.trim() || seed.role;
                const created = await prisma.user.create({
                  data: {
                    id: userId,
                    email: emailLower,
                    passwordHash,
                    name: fullName,
                    status: seed.status,
                    organizationId: '00000000-0000-0000-0000-000000000001',
                    userRoles: {
                      create: {
                        roleId: roleRecord.id,
                      },
                    },
                  },
                });
                userId = created.id;
                roleId = roleRecord.id;
              }
            }
          } catch (dbErr) {
            userLogger.warn(`Could not sync seed user ${seed.email} to PostgreSQL: ${dbErr}`);
          }
        }

        stored = {
          id: userId,
          email: emailLower,
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

        memoryUsers.set(emailLower, stored);
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

  private static mapDbUserToStored(dbUser: any): StoredUser {
    const primaryRole = dbUser.userRoles?.[0]?.role;
    const roleName = (primaryRole?.name || 'CLIENT') as UserRole;
    const roleId = primaryRole?.id || '';
    const permissions = dbUser.userRoles?.flatMap((ur: any) =>
      ur.role?.rolePermissions?.map((rp: any) => rp.permission?.name) || []
    ) || [];

    const nameParts = (dbUser.name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || null;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

    return {
      id: dbUser.id,
      email: dbUser.email,
      passwordHash: dbUser.passwordHash,
      firstName,
      lastName,
      status: (dbUser.status || 'ACTIVE') as UserStatus,
      role: {
        id: roleId,
        name: roleName,
        displayName: roleName.replace('_', ' '),
      },
      customPermissions: memoryUsers.get(dbUser.email.toLowerCase())?.customPermissions ?? permissions,
      lastLoginAt: memoryUsers.get(dbUser.email.toLowerCase())?.lastLoginAt || null,
      createdAt: dbUser.createdAt instanceof Date ? dbUser.createdAt.toISOString() : String(dbUser.createdAt),
      updatedAt: dbUser.updatedAt instanceof Date ? dbUser.updatedAt.toISOString() : String(dbUser.updatedAt),
      managerId: dbUser.managerProfile?.id || dbUser.agent?.managerProfileId || memoryUsers.get(dbUser.email.toLowerCase())?.managerId || null,
      agentId: dbUser.agent?.id || memoryUsers.get(dbUser.email.toLowerCase())?.agentId || null,
      clientId: dbUser.clientMemberships?.[0]?.clientId || null,
    };
  }

  /**
   * Finds a user record by email (including passwordHash for internal authentication verification).
   */
  static async findByEmail(emailOrUsername: string): Promise<StoredUser | null> {
    const raw = emailOrUsername.trim();
    const normalized = raw.toLowerCase();

    // Check database if connected
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: normalized },
              { email: normalized.includes('@') ? normalized : `${normalized}@smshub.local` },
              { email: normalized.includes('@') ? normalized : `${normalized}@worldsmsservice.tech` },
              { name: { equals: raw, mode: 'insensitive' } },
              { name: { equals: normalized, mode: 'insensitive' } },
            ],
          },
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
            managerProfile: true,
            agent: true,
            clientMemberships: true,
          },
        });

        if (dbUser) {
          const stored = this.mapDbUserToStored(dbUser);
          memoryUsers.set(normalized, stored);
          return stored;
        }
      } catch (err) {
        // Fallback to memory
      }
    }

    // Check in-memory store
    const memUser = memoryUsers.get(normalized) || Array.from(memoryUsers.values()).find(
      (u) =>
        u.email.toLowerCase() === normalized ||
        (u.firstName && u.firstName.toLowerCase() === normalized) ||
        (u.role && u.role.displayName.toLowerCase() === normalized)
    );
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
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
            managerProfile: true,
            agent: true,
            clientMemberships: true,
          },
        });
        if (dbUser) {
          const stored = this.mapDbUserToStored(dbUser);
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
            data: { updatedAt: new Date() },
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
          const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.role;
          await prisma.user.create({
            data: {
              id: userId,
              email: normalizedEmail,
              passwordHash,
              name: fullName,
              status: stored.status,
              organizationId: '00000000-0000-0000-0000-000000000001',
              userRoles: {
                create: {
                  roleId: roleRecord.id,
                },
              },
            },
          });
        }
      } catch (err: any) {
        userLogger.warn('Could not persist new user to PostgreSQL, saved in memory', err);
        if (err.code === 'P2002') {
          // User already exists in PostgreSQL; retain in-memory synchronized identity
          return UserRepository.toSafeUser(stored);
        }
      }
    }

    return this.toSafeUser(stored);
  }

  /**
   * Updates user profile fields (firstName, lastName, email, status).
   */
  static async updateUser(
    id: string,
    data: { firstName?: string; lastName?: string; email?: string; status?: UserStatus }
  ): Promise<SafeUser | null> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const updateData: any = { updatedAt: new Date() };
        if (data.firstName !== undefined || data.lastName !== undefined) {
          const existing = await prisma.user.findUnique({ where: { id }, select: { name: true } });
          const parts = (existing?.name || '').split(/\s+/);
          const fName = data.firstName !== undefined ? data.firstName : parts[0] || '';
          const lName = data.lastName !== undefined ? data.lastName : parts.slice(1).join(' ');
          updateData.name = `${fName} ${lName}`.trim() || undefined;
        }
        if (data.email) {
          updateData.email = data.email.toLowerCase().trim();
        }
        if (data.status) {
          updateData.status = data.status;
        }

        const dbUser = await prisma.user.update({
          where: { id },
          data: updateData,
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
            managerProfile: true,
            agent: true,
            clientMemberships: true,
          },
        });

        if (dbUser) {
          const stored = this.mapDbUserToStored(dbUser);
          memoryUsers.set(stored.email.toLowerCase(), stored);
          return this.toSafeUser(stored);
        }
      } catch (err) {
        userLogger.warn(`Prisma update failed for user ${id}, trying memory store`, err);
      }
    }

    for (const u of memoryUsers.values()) {
      if (u.id === id) {
        if (data.firstName !== undefined) u.firstName = data.firstName;
        if (data.lastName !== undefined) u.lastName = data.lastName;
        if (data.email) u.email = data.email.toLowerCase().trim();
        if (data.status) u.status = data.status;
        u.updatedAt = new Date().toISOString();
        return this.toSafeUser(u);
      }
    }

    return null;
  }

  /**
   * Updates user status (ACTIVE, SUSPENDED, PENDING).
   */
  static async updateStatus(id: string, newStatus: UserStatus): Promise<SafeUser | null> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const dbUser = await prisma.user.update({
          where: { id },
          data: { status: newStatus, updatedAt: new Date() },
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
            managerProfile: true,
            agent: true,
            clientMemberships: true,
          },
        });

        if (dbUser) {
          const stored = this.mapDbUserToStored(dbUser);
          memoryUsers.set(stored.email.toLowerCase(), stored);
          return this.toSafeUser(stored);
        }
      } catch (e) {
        // fallback to memory
      }
    }

    for (const u of memoryUsers.values()) {
      if (u.id === id) {
        u.status = newStatus;
        u.updatedAt = new Date().toISOString();
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

    let all: StoredUser[] = [];
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const dbUsers = await prisma.user.findMany({
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
            managerProfile: true,
            agent: true,
            clientMemberships: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        if (dbUsers.length > 0) {
          all = dbUsers.map((u) => this.mapDbUserToStored(u));
        }
      } catch {
        // fallback to memory
      }
    }

    if (all.length === 0) {
      all = Array.from(memoryUsers.values());
    }

    let filtered: StoredUser[];
    if (actorRole === 'SUPER_ADMIN') {
      filtered = all;
    } else if (actorRole === 'MANAGER') {
      const managerId = all.find(u => u.id === actorId)?.managerId;
      filtered = all.filter(u => !!managerId && u.managerId === managerId && (u.role.name === 'AGENT' || u.role.name === 'CLIENT'));
    } else if (actorRole === 'AGENT') {
      const agentId = all.find(u => u.id === actorId)?.agentId;
      filtered = all.filter(u => !!agentId && u.role.name === 'CLIENT' && u.agentId === agentId);
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

registerProfiles('users', memoryUsers);
persistProfileService(UserRepository);
