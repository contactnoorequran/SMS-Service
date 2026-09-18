const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const { PrismaClient } = require('@prisma/client');

const p = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  for (let i = 0; i < 5; i++) {
    const r = await p.user.findMany({ take: 2 });
    console.log(`Query ${i + 1} SUCCESS, users:`, r.length);
  }
}

main()
  .then(() => console.log('🎉 Port 6543 handles continuous pooled queries perfectly!'))
  .catch((e) => console.error('Error on port 6543:', e))
  .finally(() => p.$disconnect());
