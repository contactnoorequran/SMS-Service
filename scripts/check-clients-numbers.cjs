const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany({ select: { id: true, name: true } });
  console.log('Database Clients:', clients);
  const numbers = await prisma.number.findMany({ select: { id: true, e164: true, status: true } });
  console.log('Database Numbers:', numbers);
}

main().finally(() => prisma.$disconnect());
