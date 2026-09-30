import { getPrismaClient } from '../server/db/prisma';

async function purgeOldTestData() {
  const p = getPrismaClient();
  if (!p) {
    console.error('Prisma client unavailable');
    process.exit(1);
  }

  console.log('[Purge] Cleaning remaining test messages and platform ledger...');

  await p.$transaction(async (tx) => {
    // 1. Delete old test inbound messages
    const deletedMsgs = await tx.inboundMessage.deleteMany();
    console.log(`[Purge] Deleted ${deletedMsgs.count} old test messages.`);

    // 2. Delete old ledger entries and billing transactions
    const deletedLedgers = await tx.ledgerEntry.deleteMany();
    console.log(`[Purge] Deleted ${deletedLedgers.count} old ledger entries.`);

    const deletedTx = await tx.billingTransaction.deleteMany();
    console.log(`[Purge] Deleted ${deletedTx.count} old billing transactions.`);

    // 3. Reset platform wallet balance to 0
    await tx.wallet.updateMany({
      where: { isPlatform: true },
      data: { balanceMicrounits: 0n },
    });
    console.log('[Purge] Reset platform wallet balance to 0.00 USD.');
  });

  console.log('[Purge] Finished complete cleanup.');
  await p.$disconnect();
}

purgeOldTestData().catch(console.error);
