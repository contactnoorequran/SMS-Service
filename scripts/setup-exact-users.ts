import { getPrismaClient } from '../server/db/prisma';
import { PasswordService } from '../server/services/password.service';

export async function setupExactUsers() {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new Error('Database client unavailable');
  }

  console.log('[Setup] Starting user setup according to specifications...');

  // 1. Get or create Organization
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Default Enterprise Platform',
      },
    });
  }
  console.log(`[Setup] Organization: ${org.name} (${org.id})`);

  // 2. Roles
  const roles = await prisma.role.findMany();
  const superAdminRole = roles.find((r) => r.name === 'SUPER_ADMIN') || await prisma.role.create({ data: { name: 'SUPER_ADMIN' } });
  const managerRole = roles.find((r) => r.name === 'MANAGER') || await prisma.role.create({ data: { name: 'MANAGER' } });
  const agentRole = roles.find((r) => r.name === 'AGENT') || await prisma.role.create({ data: { name: 'AGENT' } });
  const clientRole = roles.find((r) => r.name === 'CLIENT') || await prisma.role.create({ data: { name: 'CLIENT' } });

  // 3. Password Hash for 11223344
  const passwordHash = await PasswordService.hash('11223344');
  console.log('[Setup] Generated password hash for "11223344"');

  // 4. Setup Abuzar (Admin / SUPER_ADMIN)
  // Check if existing admin exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'admin@smshub.local' },
        { email: 'abuzar@smshub.local' },
        { name: 'Abuzar' },
        { name: 'Administrator' },
      ],
    },
  });

  let abuzar;
  if (existingAdmin) {
    abuzar = await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        name: 'Abuzar',
        email: 'abuzar@smshub.local',
        passwordHash,
        status: 'ACTIVE',
        organizationId: org.id,
      },
    });
  } else {
    abuzar = await prisma.user.create({
      data: {
        name: 'Abuzar',
        email: 'abuzar@smshub.local',
        passwordHash,
        status: 'ACTIVE',
        organizationId: org.id,
      },
    });
  }

  // Ensure role
  await prisma.userRole.deleteMany({ where: { userId: abuzar.id } });
  await prisma.userRole.create({
    data: {
      userId: abuzar.id,
      roleId: superAdminRole.id,
    },
  });
  console.log(`[Setup] Configured Abuzar: ${abuzar.name} (${abuzar.email}) - SUPER_ADMIN`);

  // 5. Setup Muddasir (Manager)
  let muddasir = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'muddasir@smshub.local' },
        { name: 'Muddasir' },
      ],
    },
  });

  if (muddasir) {
    muddasir = await prisma.user.update({
      where: { id: muddasir.id },
      data: {
        name: 'Muddasir',
        email: 'muddasir@smshub.local',
        passwordHash,
        status: 'ACTIVE',
        organizationId: org.id,
      },
    });
  } else {
    muddasir = await prisma.user.create({
      data: {
        name: 'Muddasir',
        email: 'muddasir@smshub.local',
        passwordHash,
        status: 'ACTIVE',
        organizationId: org.id,
      },
    });
  }

  await prisma.userRole.deleteMany({ where: { userId: muddasir.id } });
  await prisma.userRole.create({
    data: {
      userId: muddasir.id,
      roleId: managerRole.id,
    },
  });

  const managerProfile = await prisma.managerProfile.upsert({
    where: { userId: muddasir.id },
    create: {
      userId: muddasir.id,
      organizationId: org.id,
    },
    update: {},
  });
  console.log(`[Setup] Configured Muddasir: ${muddasir.name} (${muddasir.email}) - MANAGER`);

  // 6. Setup Zubair (Agent)
  let zubair = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'zubair@smshub.local' },
        { name: 'Zubair' },
      ],
    },
  });

  if (zubair) {
    zubair = await prisma.user.update({
      where: { id: zubair.id },
      data: {
        name: 'Zubair',
        email: 'zubair@smshub.local',
        passwordHash,
        status: 'ACTIVE',
        organizationId: org.id,
      },
    });
  } else {
    zubair = await prisma.user.create({
      data: {
        name: 'Zubair',
        email: 'zubair@smshub.local',
        passwordHash,
        status: 'ACTIVE',
        organizationId: org.id,
      },
    });
  }

  await prisma.userRole.deleteMany({ where: { userId: zubair.id } });
  await prisma.userRole.create({
    data: {
      userId: zubair.id,
      roleId: agentRole.id,
    },
  });

  const agent = await prisma.agent.upsert({
    where: { userId: zubair.id },
    create: {
      userId: zubair.id,
      managerProfileId: managerProfile.id,
      organizationId: org.id,
    },
    update: {
      managerProfileId: managerProfile.id,
    },
  });

  await prisma.wallet.upsert({
    where: { agentId: agent.id },
    create: {
      agentId: agent.id,
      organizationId: org.id,
      currency: 'USD',
      balanceMicrounits: 0n,
    },
    update: {},
  });
  console.log(`[Setup] Configured Zubair: ${zubair.name} (${zubair.email}) - AGENT`);

  // 7. Setup Hamza (Client)
  let hamza = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'hamza@smshub.local' },
        { name: 'Hamza' },
      ],
    },
  });

  if (hamza) {
    hamza = await prisma.user.update({
      where: { id: hamza.id },
      data: {
        name: 'Hamza',
        email: 'hamza@smshub.local',
        passwordHash,
        status: 'ACTIVE',
        organizationId: org.id,
      },
    });
  } else {
    hamza = await prisma.user.create({
      data: {
        name: 'Hamza',
        email: 'hamza@smshub.local',
        passwordHash,
        status: 'ACTIVE',
        organizationId: org.id,
      },
    });
  }

  await prisma.userRole.deleteMany({ where: { userId: hamza.id } });
  await prisma.userRole.create({
    data: {
      userId: hamza.id,
      roleId: clientRole.id,
    },
  });

  let hamzaClient = await prisma.client.findFirst({
    where: { name: 'Hamza' },
  });
  if (!hamzaClient) {
    hamzaClient = await prisma.client.create({
      data: {
        name: 'Hamza',
        agentId: agent.id,
        organizationId: org.id,
      },
    });
  } else {
    hamzaClient = await prisma.client.update({
      where: { id: hamzaClient.id },
      data: {
        agentId: agent.id,
      },
    });
  }

  await prisma.clientUser.upsert({
    where: {
      clientId_userId: {
        clientId: hamzaClient.id,
        userId: hamza.id,
      },
    },
    create: {
      clientId: hamzaClient.id,
      userId: hamza.id,
    },
    update: {},
  });

  await prisma.wallet.upsert({
    where: { clientId: hamzaClient.id },
    create: {
      clientId: hamzaClient.id,
      organizationId: org.id,
      currency: 'USD',
      balanceMicrounits: 0n,
    },
    update: {},
  });
  console.log(`[Setup] Configured Hamza: ${hamza.name} (${hamza.email}) - CLIENT`);

  // 8. Delete any other users
  const allowedUserIds = [abuzar.id, muddasir.id, zubair.id, hamza.id];
  const otherUsers = await prisma.user.findMany({
    where: {
      id: { notIn: allowedUserIds },
    },
    select: { id: true, email: true, name: true },
  });

  if (otherUsers.length > 0) {
    console.log(`[Setup] Removing ${otherUsers.length} obsolete users...`);
    const otherIds = otherUsers.map((u) => u.id);
    await prisma.userRole.deleteMany({ where: { userId: { in: otherIds } } });
    await prisma.notification.deleteMany({ where: { userId: { in: otherIds } } });
    await prisma.auditLog.updateMany({
      where: { performedById: { in: otherIds } },
      data: { performedById: null },
    });
    await prisma.user.deleteMany({ where: { id: { in: otherIds } } });
    console.log('[Setup] Obsolete users removed.');
  }

  // 9. Summary
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      userRoles: {
        select: {
          role: { select: { name: true } },
        },
      },
    },
  });

  console.log('=== EXACT USERS PROVISIONED ===');
  for (const u of allUsers) {
    const roleName = u.userRoles[0]?.role?.name || 'UNKNOWN';
    console.log(`- Username: "${u.name}", Email: "${u.email}", Role: "${roleName}", Password: "11223344"`);
  }

  await prisma.$disconnect();
  return allUsers;
}

if (require.main === module) {
  setupExactUsers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
