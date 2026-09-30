import { getPrismaClient } from '../server/db/prisma';

async function main() {
  const p = getPrismaClient();
  if (!p) {
    console.error('Prisma client unavailable');
    process.exit(1);
  }

  const [
    cdrCount,
    billingEventCount,
    inboundMsgCount,
    ledgerEntryCount,
    transactionCount,
    creditNoteCount,
    paymentReqCount,
    activeAssignments,
    assignmentHistories,
    rateCount,
    numbers,
    clients,
    agents,
    managers,
    wallets,
    users,
  ] = await Promise.all([
    p.cdr.count(),
    p.billingEvent.count(),
    p.inboundMessage.count(),
    p.ledgerEntry.count(),
    p.billingTransaction.count(),
    p.creditNote.count(),
    p.paymentRequest.count(),
    p.activeAssignment.count(),
    p.assignmentHistory.count(),
    p.rate.count(),
    p.number.findMany({ select: { id: true, e164: true, status: true } }),
    p.client.findMany({ select: { id: true, name: true } }),
    p.agent.findMany({ select: { id: true, user: { select: { name: true } } } }),
    p.managerProfile.findMany({ select: { id: true, user: { select: { name: true } } } }),
    p.wallet.findMany({
      select: {
        id: true,
        clientId: true,
        agentId: true,
        isPlatform: true,
        balanceMicrounits: true,
        currency: true,
      },
    }),
    p.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        userRoles: { select: { role: { select: { name: true } } } },
      },
    }),
  ]);

  console.log('=== DETAILED DATA AUDIT ===');
  console.log('Total CDRs (Call Detail Records):', cdrCount);
  console.log('Total Billing Events:', billingEventCount);
  console.log('Total Inbound Messages:', inboundMsgCount);
  console.log('Total Ledger Entries:', ledgerEntryCount);
  console.log('Total Billing Transactions:', transactionCount);
  console.log('Total Credit Notes:', creditNoteCount);
  console.log('Total Payment Requests:', paymentReqCount);
  console.log('Total Active Assignments:', activeAssignments);
  console.log('Total Assignment Histories:', assignmentHistories);
  console.log('Total Custom Rates:', rateCount);
  console.log('\n--- NUMBERS IN POOL ---');
  console.log(numbers);
  console.log('\n--- USERS ---');
  console.log(
    users.map((u) => ({
      username: u.name,
      email: u.email,
      role: u.userRoles[0]?.role?.name,
    }))
  );
  console.log('\n--- MANAGERS ---');
  console.log(managers.map((m) => ({ id: m.id, name: m.user?.name })));
  console.log('\n--- AGENTS ---');
  console.log(agents.map((a) => ({ id: a.id, name: a.user?.name })));
  console.log('\n--- CLIENTS ---');
  console.log(clients.map((c) => ({ id: c.id, name: c.name })));
  console.log('\n--- WALLETS ---');
  console.log(
    wallets.map((w) => ({
      id: w.id,
      type: w.isPlatform ? 'PLATFORM' : w.clientId ? 'CLIENT' : w.agentId ? 'AGENT' : 'OTHER',
      balance: `${Number(w.balanceMicrounits) / 1_000_000} ${w.currency}`,
    }))
  );

  await p.$disconnect();
}

main().catch(console.error);
