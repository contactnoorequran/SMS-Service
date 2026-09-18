const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tables = [
    'users', 'roles', 'permissions', 'role_permissions', 'manager_profiles',
    'agent_profiles', 'client_profiles', 'providers', 'provider_credentials',
    'provider_connections', 'countries', 'operators', 'ranges', 'numbers',
    'number_assignments', 'incoming_messages', 'rates', 'client_payouts',
    'cdrs', 'wallets', 'transactions', 'audit_logs'
  ];

  for (const table of tables) {
    const cols = await prisma.$queryRawUnsafe(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table}' ORDER BY ordinal_position`
    );
    console.log(`=== ${table} ===`);
    console.log(cols.map(c => c.column_name).join(', '));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
