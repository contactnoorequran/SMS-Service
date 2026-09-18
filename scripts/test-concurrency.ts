import { PrismaClient } from '@prisma/client';

const p = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('Testing 3 concurrent queries on pooler:5432...');
  const start = Date.now();
  const [users, roles, wallets] = await Promise.all([
    p.user.count(),
    p.role.count(),
    p.wallet.count(),
  ]);
  console.log(`Success in ${Date.now() - start}ms! Users: ${users}, Roles: ${roles}, Wallets: ${wallets}`);
  await p.$disconnect();
}

main().catch(console.error);
