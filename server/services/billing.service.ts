import { getPrismaClient } from '../db/prisma';
import { Logger } from '../utils/logger';
import { AuditService } from './audit.service';

const logger = new Logger('BillingService');

export class BillingService {
  /**
   * Micro-unit conversion helpers:
   * 1 standard currency unit (e.g. 1.00 USD) = 1,000,000 micro-units
   */
  static toMicrounits(amountDecimal: number): bigint {
    return BigInt(Math.round(amountDecimal * 1_000_000));
  }

  static fromMicrounits(microunits: bigint | number): number {
    return Number(microunits) / 1_000_000;
  }

  /**
   * Transactionally executes the complete billing cycle for an inbound SMS message:
   * 1. Finds active rates
   * 2. Calculates provider cost, client charge, agent commission, platform profit (all BigInt micro-units)
   * 3. Creates BillingEvent
   * 4. Creates Cdr
   * 5. Creates BillingTransaction & LedgerEntry for Client debit, Agent credit, Platform credit
   * 6. Atomically updates Wallet balances
   */
  static async processInboundBilling(message: {
    id: string;
    organizationId: string;
    providerId: string;
    numberId: string;
    clientId?: string | null;
    agentId?: string | null;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database connection unavailable');

    // Default rate values if no custom rate card is defined:
    // Provider cost: 4,500 micro-units ($0.0045)
    // Client charge: 9,500 micro-units ($0.0095)
    // Agent commission: 250 micro-units ($0.00025)
    // Platform profit: 4,750 micro-units ($0.00475)
    let providerCostMicrounits = 4500n;
    let clientChargeMicrounits = 9500n;
    let agentCommissionMicrounits = message.agentId ? 250n : 0n;
    let platformMarginMicrounits = clientChargeMicrounits - providerCostMicrounits - agentCommissionMicrounits;

    const currency = 'USD';
    const now = new Date();

    // Check if custom rate cards exist with effective date validation
    const [providerRate, clientRate] = await Promise.all([
      prisma.rate.findFirst({
        where: {
          providerId: message.providerId,
          isActive: true,
          effectiveFrom: { lte: now },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
        },
        orderBy: [{ priority: 'desc' }, { effectiveFrom: 'desc' }],
      }),
      message.clientId
        ? prisma.rate.findFirst({
            where: {
              clientId: message.clientId,
              isActive: true,
              effectiveFrom: { lte: now },
              OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
            },
            orderBy: [{ priority: 'desc' }, { effectiveFrom: 'desc' }],
          })
        : null,
    ]);

    if (providerRate) {
      providerCostMicrounits = providerRate.amountMicrounits;
    }
    if (clientRate) {
      clientChargeMicrounits = clientRate.amountMicrounits;
      platformMarginMicrounits = clientChargeMicrounits - providerCostMicrounits - agentCommissionMicrounits;
    }

    return prisma.$transaction(async (tx) => {
      // 0. Idempotency Check: Prevent duplicate billing events for the same message
      const existingBilling = await tx.billingEvent.findFirst({
        where: { inboundMessageId: message.id, status: 'BILLED' },
        include: { cdr: true },
      });
      if (existingBilling) {
        logger.info(`Idempotent skip: BillingEvent already processed for message ${message.id}`);
        return {
          billingEvent: existingBilling,
          cdr: existingBilling.cdr,
          duplicate: true,
        };
      }

      // 1. Create BillingEvent
      const billingEvent = await tx.billingEvent.create({
        data: {
          organizationId: message.organizationId,
          inboundMessageId: message.id,
          providerId: message.providerId,
          numberId: message.numberId,
          clientId: message.clientId,
          agentId: message.agentId,
          providerCostMicrounits,
          clientChargeMicrounits,
          agentCommissionMicrounits,
          platformMarginMicrounits,
          currency,
          status: 'BILLED',
          createdAt: now,
        },
      });

      // 2. Create CDR
      const cdr = await tx.cdr.create({
        data: {
          organizationId: message.organizationId,
          inboundMessageId: message.id,
          providerId: message.providerId,
          numberId: message.numberId,
          clientId: message.clientId,
          agentId: message.agentId,
          billingEventId: billingEvent.id,
          providerCostMicrounits,
          clientChargeMicrounits,
          agentCommissionMicrounits,
          platformProfitMicrounits: platformMarginMicrounits,
          currency,
          createdAt: now,
        },
      });

      // 3. Client Wallet Debit
      if (message.clientId) {
        let clientWallet = await tx.wallet.findUnique({
          where: { clientId: message.clientId },
        });

        if (!clientWallet) {
          clientWallet = await tx.wallet.create({
            data: {
              organizationId: message.organizationId,
              clientId: message.clientId,
              balanceMicrounits: 0n,
              currency,
            },
          });
        }

        const clientTx = await tx.billingTransaction.create({
          data: {
            organizationId: message.organizationId,
            walletId: clientWallet.id,
            amountMicrounits: -clientChargeMicrounits,
            currency,
            status: 'COMPLETED',
            description: `Inbound SMS charge for message ${message.id}`,
            createdAt: now,
          },
        });

        await tx.ledgerEntry.create({
          data: {
            organizationId: message.organizationId,
            walletId: clientWallet.id,
            amountMicrounits: clientChargeMicrounits,
            currency,
            type: 'DEBIT',
            sourceType: 'BILLING_EVENT',
            sourceId: billingEvent.id,
            billingTransactionId: clientTx.id,
            billingEventId: billingEvent.id,
            createdAt: now,
          },
        });

        await tx.wallet.update({
          where: { id: clientWallet.id },
          data: {
            balanceMicrounits: { decrement: clientChargeMicrounits },
          },
        });
      }

      // 4. Agent Commission Credit
      if (message.agentId && agentCommissionMicrounits > 0n) {
        let agentWallet = await tx.wallet.findUnique({
          where: { agentId: message.agentId },
        });

        if (!agentWallet) {
          agentWallet = await tx.wallet.create({
            data: {
              organizationId: message.organizationId,
              agentId: message.agentId,
              balanceMicrounits: 0n,
              currency,
            },
          });
        }

        const agentTx = await tx.billingTransaction.create({
          data: {
            organizationId: message.organizationId,
            walletId: agentWallet.id,
            amountMicrounits: agentCommissionMicrounits,
            currency,
            status: 'COMPLETED',
            description: `Agent commission for inbound SMS message ${message.id}`,
            createdAt: now,
          },
        });

        await tx.ledgerEntry.create({
          data: {
            organizationId: message.organizationId,
            walletId: agentWallet.id,
            amountMicrounits: agentCommissionMicrounits,
            currency,
            type: 'CREDIT',
            sourceType: 'BILLING_EVENT',
            sourceId: billingEvent.id,
            billingTransactionId: agentTx.id,
            billingEventId: billingEvent.id,
            createdAt: now,
          },
        });

        await tx.wallet.update({
          where: { id: agentWallet.id },
          data: {
            balanceMicrounits: { increment: agentCommissionMicrounits },
          },
        });
      }

      // 5. Platform Profit Credit
      const platformWallet = await tx.wallet.findFirst({
        where: { isPlatform: true },
      });

      if (platformWallet && platformMarginMicrounits > 0n) {
        const platformTx = await tx.billingTransaction.create({
          data: {
            organizationId: message.organizationId,
            walletId: platformWallet.id,
            amountMicrounits: platformMarginMicrounits,
            currency,
            status: 'COMPLETED',
            description: `Platform profit margin for message ${message.id}`,
            createdAt: now,
          },
        });

        await tx.ledgerEntry.create({
          data: {
            organizationId: message.organizationId,
            walletId: platformWallet.id,
            amountMicrounits: platformMarginMicrounits,
            currency,
            type: 'CREDIT',
            sourceType: 'BILLING_EVENT',
            sourceId: billingEvent.id,
            billingTransactionId: platformTx.id,
            billingEventId: billingEvent.id,
            createdAt: now,
          },
        });

        await tx.wallet.update({
          where: { id: platformWallet.id },
          data: {
            balanceMicrounits: { increment: platformMarginMicrounits },
          },
        });
      }

      // 6. Update message billingStatus to BILLED
      await tx.inboundMessage.update({
        where: { id: message.id },
        data: { billingStatus: 'BILLED' },
      });

      return { billingEvent, cdr };
    }, { maxWait: 15000, timeout: 30000 });
  }

  /**
   * Lists rates.
   */
  static async listRates(query: { clientId?: string; providerId?: string } = {}) {
    const prisma = getPrismaClient();
    if (!prisma) return [];

    const rates = await prisma.rate.findMany({
      where: {
        ...(query.clientId ? { clientId: query.clientId } : {}),
        ...(query.providerId ? { providerId: query.providerId } : {}),
      },
      include: {
        provider: true,
        client: true,
        country: true,
        operator: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rates.map((r) => ({
      ...r,
      amountMicrounits: r.amountMicrounits.toString(),
      amountDecimal: Number(r.amountMicrounits) / 1_000_000,
    }));
  }

  /**
   * Creates a new rate.
   */
  static async createRate(data: {
    type: 'INBOUND' | 'OUTBOUND' | 'DELIVERY_REPORT';
    amountMicrounits?: bigint;
    amountDecimal?: number;
    currency?: string;
    providerId?: string;
    clientId?: string;
    countryId?: string;
    operatorId?: string;
    rangeId?: string;
    effectiveFrom?: Date;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database connection unavailable');

    const amountMicrounits = data.amountMicrounits !== undefined
      ? data.amountMicrounits
      : this.toMicrounits(data.amountDecimal || 0);

    const rate = await prisma.rate.create({
      data: {
        organizationId: '00000000-0000-0000-0000-000000000001',
        type: data.type,
        amountMicrounits,
        currency: data.currency || 'USD',
        providerId: data.providerId,
        clientId: data.clientId,
        countryId: data.countryId,
        operatorId: data.operatorId,
        rangeId: data.rangeId,
        effectiveFrom: data.effectiveFrom || new Date(),
        isActive: true,
      },
    });

    return {
      ...rate,
      amountMicrounits: rate.amountMicrounits.toString(),
      amountDecimal: Number(rate.amountMicrounits) / 1_000_000,
    };
  }

  /**
   * Lists all multi-party wallets (Platform, Client, Agent, Provider).
   */
  static async listWallets() {
    const prisma = getPrismaClient();
    if (!prisma) return [];

    const wallets = await prisma.wallet.findMany({
      include: {
        client: true,
        agent: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        provider: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return wallets.map((w) => {
      let ownerName = 'Platform Master Treasury';
      let ownerType = 'PLATFORM';

      if (w.client) {
        ownerName = w.client.name;
        ownerType = 'CLIENT';
      } else if (w.agent) {
        ownerName = w.agent.user?.name || 'Agent Portfolio';
        ownerType = 'AGENT';
      } else if (w.provider) {
        ownerName = w.provider.name;
        ownerType = 'PROVIDER';
      }

      return {
        id: w.id,
        isPlatform: w.isPlatform,
        ownerType,
        ownerName,
        clientId: w.clientId,
        agentId: w.agentId,
        providerId: w.providerId,
        balanceMicrounits: w.balanceMicrounits.toString(),
        balanceDecimal: Number(w.balanceMicrounits) / 1_000_000,
        currency: w.currency,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
      };
    });
  }

  /**
   * Retrieves ledger entries for a wallet.
   */
  static async getWalletLedger(walletId: string, limit = 50) {
    const prisma = getPrismaClient();
    if (!prisma) return [];

    const entries = await prisma.ledgerEntry.findMany({
      where: { walletId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        billingTransaction: true,
      },
    });

    return entries.map((e) => ({
      id: e.id,
      walletId: e.walletId,
      amountMicrounits: e.amountMicrounits.toString(),
      amountDecimal: Number(e.amountMicrounits) / 1_000_000,
      currency: e.currency,
      type: e.type,
      sourceType: e.sourceType,
      sourceId: e.sourceId,
      description: e.billingTransaction?.description,
      createdAt: e.createdAt.toISOString(),
    }));
  }

  /**
   * Manual balance adjustment (Credit or Debit) with full ledger audit.
   */
  static async adjustBalance(data: {
    walletId: string;
    amountDecimal: number;
    type: 'CREDIT' | 'DEBIT';
    description: string;
    actorEmail?: string;
    actorId?: string;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database connection unavailable');

    const wallet = await prisma.wallet.findUnique({
      where: { id: data.walletId },
    });
    if (!wallet) throw new Error(`Wallet '${data.walletId}' not found`);

    const amountMicrounits = this.toMicrounits(data.amountDecimal);
    const now = new Date();

    const signedAmount = data.type === 'CREDIT' ? amountMicrounits : -amountMicrounits;

    const result = await prisma.$transaction(async (tx) => {
      const billingTx = await tx.billingTransaction.create({
        data: {
          organizationId: wallet.organizationId,
          walletId: wallet.id,
          amountMicrounits: signedAmount,
          currency: wallet.currency,
          status: 'COMPLETED',
          description: data.description,
          createdAt: now,
        },
      });

      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          organizationId: wallet.organizationId,
          walletId: wallet.id,
          amountMicrounits,
          currency: wallet.currency,
          type: data.type,
          sourceType: 'OTHER',
          billingTransactionId: billingTx.id,
          createdAt: now,
        },
      });

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balanceMicrounits: { increment: signedAmount },
        },
      });

      return { billingTx, ledgerEntry, updatedWallet };
    }, { maxWait: 15000, timeout: 30000 });

    await AuditService.recordEvent({
      userId: data.actorId,
      email: data.actorEmail || 'system',
      action: 'WALLET_BALANCE_ADJUSTED',
      reason: `${data.type} of $${data.amountDecimal} applied to wallet ${wallet.id}: ${data.description}`,
      entityType: 'WALLET',
      entityId: wallet.id,
      metadata: { amountMicrounits: amountMicrounits.toString(), type: data.type },
    });

    return {
      walletId: result.updatedWallet.id,
      newBalanceMicrounits: result.updatedWallet.balanceMicrounits.toString(),
      newBalanceDecimal: Number(result.updatedWallet.balanceMicrounits) / 1_000_000,
    };
  }

  /**
   * Creates a payment request.
   */
  static async createPaymentRequest(data: {
    walletId: string;
    requesterId: string;
    amountDecimal: number;
    reason?: string;
    reference?: string;
    actorEmail?: string;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database connection unavailable');

    const wallet = await prisma.wallet.findUnique({ where: { id: data.walletId } });
    if (!wallet) throw new Error(`Wallet '${data.walletId}' not found`);

    const amountMicrounits = this.toMicrounits(data.amountDecimal);
    if (amountMicrounits <= 0n) throw new Error('Payment request amount must be greater than zero');

    const request = await prisma.paymentRequest.create({
      data: {
        organizationId: wallet.organizationId,
        walletId: wallet.id,
        requesterId: data.requesterId,
        amountMicrounits,
        currency: wallet.currency,
        status: 'PENDING',
        reason: data.reason,
        reference: data.reference,
      },
      include: {
        requester: { select: { id: true, email: true, name: true } },
      },
    });

    await AuditService.recordEvent({
      userId: data.requesterId,
      email: data.actorEmail || 'user',
      action: 'PAYMENT_REQUEST_CREATED',
      reason: `Payment request for $${data.amountDecimal} created`,
      entityType: 'PAYMENT_REQUEST',
      entityId: request.id,
    });

    return {
      ...request,
      amountMicrounits: request.amountMicrounits.toString(),
      amountDecimal: Number(request.amountMicrounits) / 1_000_000,
    };
  }

  /**
   * Lists payment requests with optional status and wallet filtering.
   */
  static async listPaymentRequests(query: { walletId?: string; status?: string } = {}) {
    const prisma = getPrismaClient();
    if (!prisma) return [];

    const requests = await prisma.paymentRequest.findMany({
      where: {
        ...(query.walletId ? { walletId: query.walletId } : {}),
        ...(query.status && query.status !== 'ALL' ? { status: query.status } : {}),
      },
      include: {
        requester: { select: { id: true, email: true, name: true } },
        approver: { select: { id: true, email: true, name: true } },
        wallet: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => ({
      ...r,
      amountMicrounits: r.amountMicrounits.toString(),
      amountDecimal: Number(r.amountMicrounits) / 1_000_000,
    }));
  }

  /**
   * Approves a payment request and applies credit to the wallet with immutable ledger entry.
   * Rejects client self-approval or unauthorized role.
   */
  static async approvePaymentRequest(data: {
    id: string;
    approverId: string;
    approverRole: string;
    approverEmail?: string;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database connection unavailable');

    if (data.approverRole !== 'SUPER_ADMIN' && data.approverRole !== 'MANAGER') {
      throw new Error('Forbidden: Only administrators or managers can approve payment requests.');
    }

    const req = await prisma.paymentRequest.findUnique({
      where: { id: data.id },
      include: { wallet: true },
    });

    if (!req) throw new Error(`Payment request '${data.id}' not found`);
    if (req.status !== 'PENDING') {
      throw new Error(`Payment request cannot be approved: already in status '${req.status}'`);
    }

    if (req.requesterId === data.approverId && data.approverRole !== 'SUPER_ADMIN') {
      throw new Error('Forbidden: You cannot approve your own payment request.');
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const updatedReq = await tx.paymentRequest.update({
        where: { id: req.id },
        data: {
          status: 'APPROVED',
          approverId: data.approverId,
          updatedAt: now,
        },
      });

      const billingTx = await tx.billingTransaction.create({
        data: {
          organizationId: req.organizationId,
          walletId: req.walletId,
          amountMicrounits: req.amountMicrounits,
          currency: req.currency,
          status: 'COMPLETED',
          description: `Credit deposit via Payment Request ${req.id}`,
          createdAt: now,
        },
      });

      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          organizationId: req.organizationId,
          walletId: req.walletId,
          amountMicrounits: req.amountMicrounits,
          currency: req.currency,
          type: 'CREDIT',
          sourceType: 'PAYMENT_REQUEST',
          sourceId: req.id,
          billingTransactionId: billingTx.id,
          createdAt: now,
        },
      });

      const updatedWallet = await tx.wallet.update({
        where: { id: req.walletId },
        data: {
          balanceMicrounits: { increment: req.amountMicrounits },
        },
      });

      return { updatedReq, billingTx, ledgerEntry, updatedWallet };
    }, { maxWait: 15000, timeout: 30000 });

    await AuditService.recordEvent({
      userId: data.approverId,
      email: data.approverEmail || 'approver',
      action: 'PAYMENT_REQUEST_APPROVED',
      reason: `Payment request ${req.id} approved ($${Number(req.amountMicrounits) / 1_000_000})`,
      entityType: 'PAYMENT_REQUEST',
      entityId: req.id,
      metadata: { walletId: req.walletId, amountMicrounits: req.amountMicrounits.toString() },
    });

    return {
      paymentRequest: {
        ...result.updatedReq,
        amountMicrounits: result.updatedReq.amountMicrounits.toString(),
        amountDecimal: Number(result.updatedReq.amountMicrounits) / 1_000_000,
      },
      newWalletBalanceDecimal: Number(result.updatedWallet.balanceMicrounits) / 1_000_000,
    };
  }

  /**
   * Rejects a payment request.
   */
  static async rejectPaymentRequest(data: {
    id: string;
    approverId: string;
    approverRole: string;
    reason?: string;
    approverEmail?: string;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database connection unavailable');

    if (data.approverRole !== 'SUPER_ADMIN' && data.approverRole !== 'MANAGER') {
      throw new Error('Forbidden: Only administrators or managers can reject payment requests.');
    }

    const req = await prisma.paymentRequest.findUnique({
      where: { id: data.id },
    });

    if (!req) throw new Error(`Payment request '${data.id}' not found`);
    if (req.status !== 'PENDING') {
      throw new Error(`Payment request cannot be rejected: already in status '${req.status}'`);
    }

    const updated = await prisma.paymentRequest.update({
      where: { id: req.id },
      data: {
        status: 'REJECTED',
        approverId: data.approverId,
        reason: data.reason || req.reason,
        updatedAt: new Date(),
      },
    });

    await AuditService.recordEvent({
      userId: data.approverId,
      email: data.approverEmail || 'approver',
      action: 'PAYMENT_REQUEST_REJECTED',
      reason: `Payment request ${req.id} rejected: ${data.reason || 'No reason specified'}`,
      entityType: 'PAYMENT_REQUEST',
      entityId: req.id,
    });

    return {
      ...updated,
      amountMicrounits: updated.amountMicrounits.toString(),
      amountDecimal: Number(updated.amountMicrounits) / 1_000_000,
    };
  }
}
