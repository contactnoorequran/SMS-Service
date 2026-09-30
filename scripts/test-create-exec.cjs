const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Testing provider creation with prisma...');
  try {
    const org = await prisma.organization.findFirst();
    console.log('Found org:', org ? org.id : 'NONE');
    
    const p = await prisma.provider.create({
      data: {
        name: 'Test HTTP Provider',
        status: 'ACTIVE',
        organizationId: org ? org.id : '00000000-0000-0000-0000-000000000001',
        connections: {
          create: {
            connectionType: 'HTTP',
            environment: 'PRODUCTION',
            status: 'ACTIVE',
            priority: 1,
            protocolConfig: {},
          },
        },
      },
    });
    console.log('Created provider successfully:', p.id, p.name);
    // clean it up
    await prisma.providerConnection.deleteMany({ where: { providerId: p.id } });
    await prisma.provider.delete({ where: { id: p.id } });
    console.log('Cleaned up test provider');
  } catch (err) {
    console.error('ERROR CREATING PROVIDER:', err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
