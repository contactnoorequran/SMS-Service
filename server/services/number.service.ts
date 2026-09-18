import { getPrismaClient } from '../db/prisma';
import { Logger } from '../utils/logger';
import { AuditService } from './audit.service';

const logger = new Logger('NumberService');

export class NumberService {
  /**
   * Lists all countries.
   */
  static async listCountries() {
    const prisma = getPrismaClient();
    if (!prisma) return [];
    return prisma.country.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { operators: true, numbers: true, ranges: true },
        },
      },
    });
  }

  /**
   * Lists operators, optionally filtered by country.
   */
  static async listOperators(countryId?: string) {
    const prisma = getPrismaClient();
    if (!prisma) return [];
    return prisma.operator.findMany({
      where: countryId ? { countryId } : undefined,
      orderBy: { name: 'asc' },
      include: {
        country: true,
        _count: {
          select: { numbers: true, ranges: true },
        },
      },
    });
  }

  /**
   * Lists ranges.
   */
  static async listRanges(query: { countryId?: string; providerId?: string } = {}) {
    const prisma = getPrismaClient();
    if (!prisma) return [];
    const ranges = await prisma.range.findMany({
      where: {
        ...(query.countryId ? { countryId: query.countryId } : {}),
        ...(query.providerId ? { providerId: query.providerId } : {}),
      },
      include: {
        country: true,
        operator: true,
        provider: true,
        _count: {
          select: { numbers: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return ranges.map((r) => ({
      ...r,
      startNum: r.startNum.toString(),
      endNum: r.endNum.toString(),
    }));
  }

  /**
   * Creates a range.
   */
  static async createRange(data: {
    startE164: string;
    endE164: string;
    countryId: string;
    providerId: string;
    operatorId?: string;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database connection unavailable');

    const startNum = BigInt(data.startE164.replace(/\D/g, ''));
    const endNum = BigInt(data.endE164.replace(/\D/g, ''));

    if (startNum > endNum) {
      throw new Error('startE164 cannot be greater than endE164 numerically');
    }

    const range = await prisma.range.create({
      data: {
        startE164: data.startE164,
        endE164: data.endE164,
        startNum,
        endNum,
        countryId: data.countryId,
        providerId: data.providerId,
        operatorId: data.operatorId,
        status: 'ACTIVE',
        organizationId: '00000000-0000-0000-0000-000000000001',
      },
      include: {
        country: true,
        operator: true,
        provider: true,
      },
    });

    return {
      ...range,
      startNum: range.startNum.toString(),
      endNum: range.endNum.toString(),
    };
  }

  /**
   * Lists numbers with search, filtering, and pagination.
   */
  static async listNumbers(query: {
    search?: string;
    status?: string;
    countryId?: string;
    operatorId?: string;
    providerId?: string;
    clientId?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const prisma = getPrismaClient();
    if (!prisma) return { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };

    const {
      search = '',
      status = 'ALL',
      countryId,
      operatorId,
      providerId,
      clientId,
      page = 1,
      limit = 10,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (countryId) where.countryId = countryId;
    if (operatorId) where.operatorId = operatorId;
    if (providerId) where.providerId = providerId;
    if (clientId) {
      where.activeAssignment = { clientId };
    }
    if (search) {
      where.e164 = { contains: search, mode: 'insensitive' };
    }

    const [total, numbers] = await Promise.all([
      prisma.number.count({ where }),
      prisma.number.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          country: true,
          operator: true,
          provider: true,
          activeAssignment: {
            include: {
              client: true,
              agent: {
                include: {
                  user: {
                    select: { name: true, email: true },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const items = numbers.map((n) => ({
      id: n.id,
      e164: n.e164,
      status: n.status,
      country: n.country,
      operator: n.operator,
      provider: n.provider,
      assignment: n.activeAssignment
        ? {
            id: n.activeAssignment.id,
            clientId: n.activeAssignment.clientId,
            clientName: n.activeAssignment.client?.name,
            agentId: n.activeAssignment.agentId,
            agentName: n.activeAssignment.agent?.user?.name,
            assignedAt: n.activeAssignment.assignedAt.toISOString(),
          }
        : null,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves single number details.
   */
  static async getNumberById(id: string) {
    const prisma = getPrismaClient();
    if (!prisma) return null;

    const n = await prisma.number.findUnique({
      where: { id },
      include: {
        country: true,
        operator: true,
        provider: true,
        range: true,
        activeAssignment: {
          include: {
            client: true,
            agent: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
          },
        },
        assignmentHistories: {
          take: 10,
          orderBy: { assignedAt: 'desc' },
          include: {
            client: true,
            agent: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!n) return null;

    return {
      id: n.id,
      e164: n.e164,
      status: n.status,
      country: n.country,
      operator: n.operator,
      provider: n.provider,
      range: n.range
        ? {
            ...n.range,
            startNum: n.range.startNum.toString(),
            endNum: n.range.endNum.toString(),
          }
        : null,
      assignment: n.activeAssignment
        ? {
            id: n.activeAssignment.id,
            clientId: n.activeAssignment.clientId,
            clientName: n.activeAssignment.client?.name,
            agentId: n.activeAssignment.agentId,
            agentName: n.activeAssignment.agent?.user?.name,
            assignedAt: n.activeAssignment.assignedAt.toISOString(),
          }
        : null,
      history: n.assignmentHistories.map((h) => ({
        id: h.id,
        clientId: h.clientId,
        clientName: h.client?.name,
        agentId: h.agentId,
        agentName: h.agent?.user?.name,
        assignedAt: h.assignedAt.toISOString(),
        endedAt: h.endedAt ? h.endedAt.toISOString() : null,
      })),
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    };
  }

  /**
   * Assigns a number to a client (and their supervising agent).
   */
  static async assignNumber(data: {
    numberId: string;
    clientId: string;
    actorEmail?: string;
    actorId?: string;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database connection unavailable');

    const number = await prisma.number.findUnique({
      where: { id: data.numberId },
      include: { activeAssignment: true },
    });

    if (!number) throw new Error(`Number '${data.numberId}' not found`);
    if (number.status === 'SUSPENDED') {
      throw new Error(`Cannot assign suspended number '${number.e164}'`);
    }
    if (number.status === 'DECOMMISSIONED' || number.status === 'RESERVED') {
      throw new Error(`Cannot assign number '${number.e164}' in status '${number.status}'`);
    }
    if (number.activeAssignment || number.status === 'ASSIGNED') {
      throw new Error(`Number '${number.e164}' is already assigned to a client. Use reassignment workflow.`);
    }

    let client = await prisma.client.findUnique({
      where: { id: data.clientId },
    });
    if (!client) {
      client = await prisma.client.upsert({
        where: { id: data.clientId },
        update: {},
        create: {
          id: data.clientId,
          name: `Client ${data.clientId}`,
          organizationId: '00000000-0000-0000-0000-000000000001',
        },
      }).catch(async () => {
        return prisma.client.findFirst();
      });
    }
    if (!client) throw new Error(`Client '${data.clientId}' not found`);

    const now = new Date();

    const [assignment] = await prisma.$transaction([
      prisma.activeAssignment.create({
        data: {
          numberId: data.numberId,
          clientId: client.id,
          agentId: client.agentId,
          organizationId: '00000000-0000-0000-0000-000000000001',
          assignedAt: now,
        },
      }),
      prisma.assignmentHistory.create({
        data: {
          numberId: data.numberId,
          clientId: client.id,
          agentId: client.agentId,
          organizationId: '00000000-0000-0000-0000-000000000001',
          assignedAt: now,
        },
      }),
      prisma.number.update({
        where: { id: data.numberId },
        data: { status: 'ASSIGNED' },
      }),
    ]);

    await AuditService.recordEvent({
      userId: data.actorId,
      email: data.actorEmail || 'system',
      action: 'NUMBER_ASSIGNED',
      reason: `Number '${number.e164}' assigned to Client '${client.name}'`,
      entityType: 'NUMBER',
      entityId: number.id,
      metadata: { clientId: client.id, agentId: client.agentId },
    });

    return this.getNumberById(data.numberId);
  }

  /**
   * Reassigns a number from one client to another client.
   */
  static async reassignNumber(data: {
    numberId: string;
    newClientId: string;
    actorEmail?: string;
    actorId?: string;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database connection unavailable');

    const number = await prisma.number.findUnique({
      where: { id: data.numberId },
      include: { activeAssignment: true },
    });

    if (!number) throw new Error(`Number '${data.numberId}' not found`);
    if (number.status === 'SUSPENDED') {
      throw new Error(`Cannot reassign suspended number '${number.e164}'`);
    }
    if (number.status === 'DECOMMISSIONED') {
      throw new Error(`Cannot reassign decommissioned number '${number.e164}'`);
    }
    if (!number.activeAssignment) {
      throw new Error(`Number '${number.e164}' has no active assignment to reassign. Use assignment workflow.`);
    }

    let newClient = await prisma.client.findUnique({
      where: { id: data.newClientId },
    });
    if (!newClient) {
      newClient = await prisma.client.upsert({
        where: { id: data.newClientId },
        update: {},
        create: {
          id: data.newClientId,
          name: `Client ${data.newClientId}`,
          organizationId: '00000000-0000-0000-0000-000000000001',
        },
      }).catch(async () => {
        return prisma.client.findFirst();
      });
    }
    if (!newClient) throw new Error(`Client '${data.newClientId}' not found`);

    const now = new Date();

    await prisma.$transaction([
      // Close active history entry
      prisma.assignmentHistory.updateMany({
        where: {
          numberId: data.numberId,
          endedAt: null,
        },
        data: { endedAt: now },
      }),
      // Replace active assignment
      prisma.activeAssignment.update({
        where: { numberId: data.numberId },
        data: {
          clientId: newClient.id,
          agentId: newClient.agentId,
          assignedAt: now,
        },
      }),
      // Create new history entry
      prisma.assignmentHistory.create({
        data: {
          numberId: data.numberId,
          clientId: newClient.id,
          agentId: newClient.agentId,
          organizationId: '00000000-0000-0000-0000-000000000001',
          assignedAt: now,
        },
      }),
      prisma.number.update({
        where: { id: data.numberId },
        data: { status: 'ASSIGNED' },
      }),
    ]);

    await AuditService.recordEvent({
      userId: data.actorId,
      email: data.actorEmail || 'system',
      action: 'NUMBER_REASSIGNED',
      reason: `Number '${number.e164}' reassigned to Client '${newClient.name}'`,
      entityType: 'NUMBER',
      entityId: number.id,
      metadata: { newClientId: newClient.id },
    });

    return this.getNumberById(data.numberId);
  }

  /**
   * Releases a number back to available pool.
   */
  static async releaseNumber(data: {
    numberId: string;
    reason?: string;
    actorEmail?: string;
    actorId?: string;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database connection unavailable');

    const number = await prisma.number.findUnique({
      where: { id: data.numberId },
      include: { activeAssignment: true },
    });

    if (!number) throw new Error(`Number '${data.numberId}' not found`);
    if (!number.activeAssignment) {
      throw new Error(`Cannot release unassigned number '${number.e164}': No active assignment exists.`);
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.assignmentHistory.updateMany({
        where: {
          numberId: data.numberId,
          endedAt: null,
        },
        data: { endedAt: now },
      }),
      prisma.activeAssignment.delete({
        where: { numberId: data.numberId },
      }),
      prisma.number.update({
        where: { id: data.numberId },
        data: { status: 'AVAILABLE' },
      }),
    ]);

    await AuditService.recordEvent({
      userId: data.actorId,
      email: data.actorEmail || 'system',
      action: 'NUMBER_RELEASED',
      reason: data.reason || `Number '${number.e164}' released to available inventory`,
      entityType: 'NUMBER',
      entityId: number.id,
    });

    return this.getNumberById(data.numberId);
  }

  /**
   * Gets historical assignments for a number.
   */
  static async getNumberHistory(numberId: string) {
    const prisma = getPrismaClient();
    if (!prisma) return [];

    const histories = await prisma.assignmentHistory.findMany({
      where: { numberId },
      orderBy: { assignedAt: 'desc' },
      include: {
        client: true,
        agent: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    return histories.map((h) => ({
      id: h.id,
      clientId: h.clientId,
      clientName: h.client?.name,
      agentId: h.agentId,
      agentName: h.agent?.user?.name,
      assignedAt: h.assignedAt.toISOString(),
      endedAt: h.endedAt ? h.endedAt.toISOString() : null,
    }));
  }
}
