const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Testing full HTTP provider creation...');
  const org = await prisma.organization.findFirst();
  const newProvider = await prisma.provider.create({
    data: {
      name: 'Test HTTP Carrier',
      status: 'ACTIVE',
      organizationId: org.id,
      connections: {
        create: {
          connectionType: 'HTTP',
          environment: 'PRODUCTION',
          status: 'ACTIVE',
          priority: 1,
          protocolConfig: {
            httpDirection: 'Both directions',
            outboundUrl: 'https://api.testprovider.com/v1/sms',
            bypassInboundToken: false
          }
        }
      }
    },
    include: {
      connections: true
    }
  });

  console.log('Provider created successfully with ID:', newProvider.id);
  console.log('Connections:', newProvider.connections);
  
  // Cleanup test provider
  await prisma.providerConnection.deleteMany({ where: { providerId: newProvider.id } });
  await prisma.provider.delete({ where: { id: newProvider.id } });
  console.log('Cleaned up test provider successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
