const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.user.findUnique({ where: { email: 'viktor.kraus@sms-platform.internal' } });
  console.log('User:', u.email, u.passwordHash);
  const match = await bcrypt.compare('Manager#Secure2026!', u.passwordHash);
  console.log('Matches Manager#Secure2026!:', match);
}

main().finally(() => prisma.$disconnect());
