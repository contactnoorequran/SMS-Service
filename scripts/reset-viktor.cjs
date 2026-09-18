const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Manager#Secure2026!', 12);
  await prisma.user.update({
    where: { email: 'viktor.kraus@sms-platform.internal' },
    data: { passwordHash: hash }
  });
  console.log('Updated viktor.kraus password hash successfully!');
}

main().finally(() => prisma.$disconnect());
