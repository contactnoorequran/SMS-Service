const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cdrsCols = await prisma.$queryRawUnsafe(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cdrs' ORDER BY ordinal_position"
  );
  console.log('cdrs columns:', cdrsCols);

  const incomingCols = await prisma.$queryRawUnsafe(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'incoming_messages' ORDER BY ordinal_position"
  );
  console.log('incoming_messages columns:', incomingCols);

  const cdrsSample = await prisma.$queryRawUnsafe("SELECT * FROM cdrs LIMIT 1");
  console.log('cdrs sample:', cdrsSample);
}

main().catch(console.error).finally(() => prisma.$disconnect());
