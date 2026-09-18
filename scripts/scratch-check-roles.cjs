const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const roles = await p.role.findMany();
  console.log('ROLES IN DB:', roles);

  const admins = await p.user.findMany({
    where: { email: { contains: 'admin' } },
    include: { userRoles: { include: { role: true } } },
  });
  console.log('ADMIN USERS IN DB:', JSON.stringify(admins, null, 2));
}

main().finally(() => p.$disconnect());
