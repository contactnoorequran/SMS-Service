const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany();
  console.log('Orgs count:', orgs.length);
  if (orgs.length > 0) {
    console.log('First Org:', orgs[0]);
  }
  const providers = await prisma.provider.findMany();
  console.log('Providers count:', providers.length);
  console.log('Providers:', providers);
}

main().catch(console.error).finally(() => prisma.$disconnect());
