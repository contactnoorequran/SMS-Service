const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ranges = await prisma.$queryRawUnsafe('SELECT id, "startRange", "endRange" FROM "ranges"');
  console.log('Ranges:', ranges);
  const users = await prisma.$queryRawUnsafe('SELECT count(*)::int as count FROM "users"');
  console.log('Users count:', users);
  const migrations = await prisma.$queryRawUnsafe('SELECT * FROM "_prisma_migrations"');
  console.log('Migrations:', migrations);
}

main().catch(console.error).finally(() => prisma.$disconnect());
