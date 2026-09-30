import { getPrismaClient } from '../server/db/prisma';

async function main() {
  const prisma = getPrismaClient();
  if (!prisma) {
    console.error('Prisma client unavailable');
    process.exit(1);
  }

  const [
    userCount,
    users,
    clientCount,
    agentCount,
    managerCount,
    providerCount,
    numberCount,
    walletCount,
    roles,
    organizations,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({ select: { id: true, email: true, name: true, status: true } }),
    prisma.client.count(),
    prisma.agent.count(),
    prisma.managerProfile.count(),
    prisma.provider.count(),
    prisma.number.count(),
    prisma.wallet.count(),
    prisma.role.findMany(),
    prisma.organization.findMany({ select: { id: true, name: true } }),
  ]);

  console.log('=== DATABASE STATUS SUMMARY ===');
  console.log('Active Users Count:', userCount);
  console.log('Active Users:', JSON.stringify(users, null, 2));
  console.log('Roles:', JSON.stringify(roles, null, 2));
  console.log('Organizations:', JSON.stringify(organizations, null, 2));
  console.log('Clients Count:', clientCount);
  console.log('Agents Count:', agentCount);
  console.log('Managers Count:', managerCount);
  console.log('Providers Count:', providerCount);
  console.log('Numbers Count:', numberCount);
  console.log('Wallets Count:', walletCount);

  await prisma.$disconnect();
}

main().catch(console.error);
