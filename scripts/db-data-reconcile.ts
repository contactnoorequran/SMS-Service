import { getPrismaClient } from '../server/db/prisma';

async function run() {
  const prisma = getPrismaClient();
  if (!prisma) {
    console.error('Prisma client could not be created');
    process.exit(1);
  }

  const legacyTables = [
    'users',
    'roles',
    'permissions',
    'role_permissions',
    'manager_profiles',
    'agent_profiles',
    'client_profiles',
    'providers',
    'provider_connections',
    'provider_credentials',
    'countries',
    'operators',
    'ranges',
    'numbers',
    'number_assignments',
    'incoming_messages',
    'cdrs',
    'rates',
    'client_payouts',
    'wallets',
    'transactions',
    'credit_notes',
    'payment_requests',
    'notifications',
    'audit_logs',
    'api_credentials',
    'api_request_logs',
    'system_configs',
  ];

  const targetTables = [
    'Organization',
    'User',
    'UserRole',
    'Role',
    'Permission',
    'RolePermission',
    'ManagerProfile',
    'Agent',
    'Client',
    'ClientUser',
    'Provider',
    'ProviderConnection',
    'CredentialReference',
    'Country',
    'Operator',
    'Range',
    'Number',
    'ActiveAssignment',
    'AssignmentHistory',
    'InboundMessage',
    'Cdr',
    'BillingEvent',
    'Rate',
    'Wallet',
    'LedgerEntry',
    'BillingTransaction',
    'CreditNote',
    'PaymentRequest',
    'Notification',
    'ApiCredential',
    'ApiRequestLog',
    'AuditLog',
  ];

  const legacyCounts: Record<string, number> = {};
  for (const t of legacyTables) {
    try {
      const res: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as c FROM "${t}"`);
      legacyCounts[t] = res[0].c;
    } catch (e: any) {
      legacyCounts[t] = -1;
    }
  }

  const targetCounts: Record<string, number> = {};
  for (const t of targetTables) {
    try {
      const res: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as c FROM "${t}"`);
      targetCounts[t] = res[0].c;
    } catch (e: any) {
      targetCounts[t] = -1;
    }
  }

  console.log('--- LEGACY COUNTS ---');
  console.log(JSON.stringify(legacyCounts, null, 2));

  console.log('--- TARGET COUNTS ---');
  console.log(JSON.stringify(targetCounts, null, 2));

  await prisma.$disconnect();
}

run().catch(console.error);
