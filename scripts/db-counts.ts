import { getPrismaClient } from '../server/db/prisma';

async function run() {
  const prisma = getPrismaClient();
  if (!prisma) {
    console.error('Prisma client could not be created');
    process.exit(1);
  }

  const tables = [
    // Legacy
    'users', 'roles', 'permissions', 'role_permissions',
    'manager_profiles', 'agent_profiles', 'client_profiles',
    'providers', 'provider_connections', 'provider_credentials',
    'countries', 'operators', 'ranges', 'numbers',
    'number_assignments', 'incoming_messages', 'cdrs', 'rates',
    'client_payouts', 'wallets', 'transactions', 'credit_notes',
    'payment_requests', 'notifications', 'audit_logs',
    'api_credentials', 'api_request_logs', 'system_configs',
    // Target
    'Organization', 'User', 'UserRole', 'Role', 'Permission',
    'RolePermission', 'ManagerProfile', 'Agent', 'Client', 'ClientUser',
    'Provider', 'ProviderConnection', 'CredentialReference',
    'Country', 'Operator', 'Range', 'Number',
    'ActiveAssignment', 'AssignmentHistory', 'InboundMessage',
    'Cdr', 'BillingEvent', 'Rate', 'Wallet', 'LedgerEntry',
    'BillingTransaction', 'CreditNote', 'PaymentRequest',
    'Notification', 'ApiCredential', 'ApiRequestLog', 'AuditLog'
  ];

  const unionSql = tables
    .map(t => `SELECT '${t}' as tbl, count(*)::bigint as cnt FROM "${t}"`)
    .join(' UNION ALL ');

  try {
    const res: any = await prisma.$queryRawUnsafe(unionSql);
    const counts: Record<string, number> = {};
    for (const row of res) {
      counts[row.tbl] = Number(row.cnt);
    }
    console.log('COUNTS_RESULT:', JSON.stringify(counts, null, 2));
  } catch (err: any) {
    console.error('Query error:', err.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
