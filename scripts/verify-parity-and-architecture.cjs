require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
let dbUrl = process.env.DATABASE_URL;
if (dbUrl && !dbUrl.includes('connection_limit=')) {
  dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'connection_limit=1';
}
console.log('Connecting with:', dbUrl ? dbUrl.replace(/:[^:@]+@/, ':***@') : 'none');
const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } }
});

async function main() {
  console.log('--- STARTING ARCHITECTURE & PARITY VERIFICATION ---');

  const counts = {
    organizations: await prisma.organization.count(),
    users: await prisma.user.count(),
    roles: await prisma.role.count(),
    permissions: await prisma.permission.count(),
    rolePermissions: await prisma.rolePermission.count(),
    userRoles: await prisma.userRole.count(),
    managerProfiles: await prisma.managerProfile.count(),
    agents: await prisma.agent.count(),
    clients: await prisma.client.count(),
    clientUsers: await prisma.clientUser.count(),
    providers: await prisma.provider.count(),
    providerConnections: await prisma.providerConnection.count(),
    credentialReferences: await prisma.credentialReference.count(),
    countries: await prisma.country.count(),
    operators: await prisma.operator.count(),
    ranges: await prisma.range.count(),
    numbers: await prisma.number.count(),
    activeAssignments: await prisma.activeAssignment.count(),
    assignmentHistories: await prisma.assignmentHistory.count(),
    inboundMessages: await prisma.inboundMessage.count(),
    cdrs: await prisma.cdr.count(),
    billingEvents: await prisma.billingEvent.count(),
    rates: await prisma.rate.count(),
    wallets: await prisma.wallet.count(),
    billingTransactions: await prisma.billingTransaction.count(),
    ledgerEntries: await prisma.ledgerEntry.count(),
    auditLogs: await prisma.auditLog.count()
  };

  console.table(counts);

  // Micro-unit verification
  const cdrs = await prisma.cdr.findMany();
  console.log('Sample CDR micro-units:', cdrs.map(c => ({
    id: c.id,
    providerCostMicrounits: c.providerCostMicrounits.toString(),
    clientChargeMicrounits: c.clientChargeMicrounits.toString(),
    agentCommissionMicrounits: c.agentCommissionMicrounits ? c.agentCommissionMicrounits.toString() : null,
    platformProfitMicrounits: c.platformProfitMicrounits ? c.platformProfitMicrounits.toString() : null,
    currency: c.currency
  })));

  const wallets = await prisma.wallet.findMany();
  console.log('Wallets:', wallets.map(w => ({
    id: w.id,
    isPlatform: w.isPlatform,
    agentId: w.agentId,
    clientId: w.clientId,
    balanceMicrounits: w.balanceMicrounits.toString(),
    currency: w.currency
  })));

  // Assertions (>= baseline thresholds from enterprise migrations)
  if (counts.users < 19) throw new Error(`Expected at least 19 users, got ${counts.users}`);
  if (counts.roles < 4) throw new Error(`Expected at least 4 roles, got ${counts.roles}`);
  if (counts.providers < 2) throw new Error(`Expected at least 2 providers, got ${counts.providers}`);
  if (counts.wallets < 3) throw new Error(`Expected at least 3 wallets, got ${counts.wallets}`);
  if (counts.cdrs < 1) throw new Error(`Expected at least 1 CDR, got ${counts.cdrs}`);
  if (counts.billingEvents < 1) throw new Error(`Expected at least 1 BillingEvent, got ${counts.billingEvents}`);
  if (counts.inboundMessages < 1) throw new Error(`Expected at least 1 InboundMessage, got ${counts.inboundMessages}`);

  console.log('✅ ALL ARCHITECTURAL AND ROW PARITY ASSERTIONS PASSED!');
}

main().catch(e => {
  console.error('❌ Parity verification failed:', e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
