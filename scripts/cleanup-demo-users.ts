import { getPrismaClient } from '../server/db/prisma';

export async function cleanupDemoAccounts() {
  const prisma = getPrismaClient();
  if (!prisma) throw new Error('Database unavailable');

  // Identify the admin to keep
  const keepAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'admin@smshub.local' },
        { email: 'admin@worldsmsservice.tech' },
      ],
    },
  });

  if (!keepAdmin) {
    throw new Error('Fatal safety check: Primary admin account not found, aborting cleanup');
  }

  console.log(`[Cleanup] Keeping Administrator: ${keepAdmin.email} (${keepAdmin.id})`);

  // Update admin record to support multiple identifiers
  await prisma.user.update({
    where: { id: keepAdmin.id },
    data: {
      name: 'Administrator',
    },
  });

  const demoUsers = await prisma.user.findMany({
    where: { id: { not: keepAdmin.id } },
    select: { id: true, email: true },
  });

  const demoUserIds = demoUsers.map((u) => u.id);
  console.log(`[Cleanup] Found ${demoUserIds.length} demo users to remove.`);

  if (demoUserIds.length === 0) {
    console.log('[Cleanup] No demo users to remove.');
    return { removedCount: 0 };
  }

  const demoClients = await prisma.client.findMany({
    select: { id: true },
  });
  const demoClientIds = demoClients.map((c) => c.id);

  const demoAgents = await prisma.agent.findMany({
    select: { id: true },
  });
  const demoAgentIds = demoAgents.map((a) => a.id);

  const demoWallets = await prisma.wallet.findMany({
    where: {
      OR: [
        { clientId: { in: demoClientIds } },
        { agentId: { in: demoAgentIds } },
      ],
    },
    select: { id: true },
  });
  const demoWalletIds = demoWallets.map((w) => w.id);

  // Execute in transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Audit logs performed by demo users -> nullify performer
    await tx.auditLog.updateMany({
      where: { performedById: { in: demoUserIds } },
      data: { performedById: null },
    });

    // 2. Notifications & API Credentials for demo users
    await tx.notification.deleteMany({
      where: { userId: { in: demoUserIds } },
    });

    await tx.apiCredential.deleteMany({
      where: { userId: { in: demoUserIds } },
    });

    // 3. Unassign any numbers assigned to demo clients/agents
    await tx.activeAssignment.deleteMany({
      where: {
        OR: [
          { clientId: { in: demoClientIds } },
          { agentId: { in: demoAgentIds } },
        ],
      },
    });

    await tx.assignmentHistory.deleteMany({
      where: {
        OR: [
          { clientId: { in: demoClientIds } },
          { agentId: { in: demoAgentIds } },
        ],
      },
    });

    // Reset numbers to AVAILABLE
    await tx.number.updateMany({
      data: { status: 'AVAILABLE' },
    });

    // 4. Clear Rates linked to demo clients
    await tx.rate.deleteMany({
      where: { clientId: { in: demoClientIds } },
    });

    // 5. Clear CDRs & Billing events linked to demo clients
    await tx.cdr.deleteMany({
      where: {
        OR: [
          { clientId: { in: demoClientIds } },
          { agentId: { in: demoAgentIds } },
        ],
      },
    });

    await tx.billingEvent.deleteMany({
      where: {
        OR: [
          { clientId: { in: demoClientIds } },
          { agentId: { in: demoAgentIds } },
        ],
      },
    });

    // 6. Remove financial records linked to demo wallets
    if (demoWalletIds.length > 0) {
      await tx.ledgerEntry.deleteMany({
        where: { walletId: { in: demoWalletIds } },
      });
      await tx.billingTransaction.deleteMany({
        where: { walletId: { in: demoWalletIds } },
      });
      await tx.creditNote.deleteMany({
        where: { walletId: { in: demoWalletIds } },
      });
      await tx.paymentRequest.deleteMany({
        where: { walletId: { in: demoWalletIds } },
      });
      await tx.wallet.deleteMany({
        where: { id: { in: demoWalletIds } },
      });
    }

    // 7. Remove client memberships & clients
    await tx.clientUser.deleteMany({
      where: {
        OR: [
          { userId: { in: demoUserIds } },
          { clientId: { in: demoClientIds } },
        ],
      },
    });

    await tx.client.deleteMany({
      where: { id: { in: demoClientIds } },
    });

    // 8. Remove Agents & Manager profiles
    await tx.agent.deleteMany({
      where: { userId: { in: demoUserIds } },
    });

    await tx.managerProfile.deleteMany({
      where: { userId: { in: demoUserIds } },
    });

    // 9. Remove User roles
    await tx.userRole.deleteMany({
      where: { userId: { in: demoUserIds } },
    });

    // 10. Delete demo users
    const deleted = await tx.user.deleteMany({
      where: { id: { in: demoUserIds } },
    });

    return deleted;
  });

  console.log(`[Cleanup] Successfully removed ${result.count} demo users and associated mock records.`);
  return { removedCount: result.count };
}
