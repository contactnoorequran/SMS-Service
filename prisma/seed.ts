/**
 * Phase 02: Database Architecture Seeder
 * Populates safe development data for development, staging, and architecture verification.
 * 
 * NOTE: Absolutely NO real provider credentials or secrets are stored here.
 * All credentials use safe mock identifiers with masked keys and synthetic ciphertext references.
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Safe simulated PBKDF2/SHA-256 password hash for test accounts
function hashPassword(password: string): string {
  const salt = 'sms_dev_salt_phase02';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export async function seedDatabase() {
  console.log('🚀 Starting Phase 02 Database Architecture Seeding...');

  try {
    // 1. ROLES
    console.log('📦 Seeding System Roles...');
    const superAdminRole = await prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: {
        name: 'SUPER_ADMIN',
        displayName: 'Super Administrator',
        description: 'Complete operational, financial, and administrative control',
        isSystem: true,
      },
    });

    const managerRole = await prisma.role.upsert({
      where: { name: 'MANAGER' },
      update: {},
      create: {
        name: 'MANAGER',
        displayName: 'Operations Manager',
        description: 'Manages agents, client accounts, provider inventory, and rate cards',
        isSystem: true,
      },
    });

    const agentRole = await prisma.role.upsert({
      where: { name: 'AGENT' },
      update: {},
      create: {
        name: 'AGENT',
        displayName: 'Business Agent',
        description: 'Onboards clients, earns commissions, and monitors assigned client traffic',
        isSystem: true,
      },
    });

    const clientRole = await prisma.role.upsert({
      where: { name: 'CLIENT' },
      update: {},
      create: {
        name: 'CLIENT',
        displayName: 'SMS Client / User',
        description: 'Leases phone numbers, receives incoming SMS, views CDRs and payouts',
        isSystem: true,
      },
    });

    // 2. PERMISSIONS
    console.log('🔒 Seeding System Permissions...');
    const permissionsData = [
      { code: 'users:manage', module: 'IDENTITY', description: 'Create, update, and manage platform users' },
      { code: 'providers:manage', module: 'PROVIDERS', description: 'Manage SMS providers, connections, and credentials' },
      { code: 'providers:view', module: 'PROVIDERS', description: 'View SMS provider statuses and gateway latency' },
      { code: 'inventory:manage', module: 'NUMBERS', description: 'Create countries, operators, ranges, and inventory' },
      { code: 'numbers:assign', module: 'NUMBERS', description: 'Assign and release phone numbers to client accounts' },
      { code: 'numbers:view', module: 'NUMBERS', description: 'View allocated numbers and assignment records' },
      { code: 'messaging:view', module: 'MESSAGING', description: 'View real-time incoming SMS and message logs' },
      { code: 'cdr:view', module: 'MESSAGING', description: 'Inspect call detail records and profitability calculations' },
      { code: 'rates:manage', module: 'BILLING', description: 'Configure provider rate cards and client payout rates' },
      { code: 'finance:manage', module: 'BILLING', description: 'Manage wallets, transactions, credit notes, and approvals' },
      { code: 'finance:view', module: 'BILLING', description: 'View wallet balances, ledgers, and payout reports' },
      { code: 'audit:view', module: 'SYSTEM', description: 'Review system audit trail and operational security logs' },
      { code: 'api:manage', module: 'SYSTEM', description: 'Generate and revoke client REST API credentials' },
    ];

    for (const perm of permissionsData) {
      const p = await prisma.permission.upsert({
        where: { code: perm.code },
        update: { module: perm.module, description: perm.description },
        create: perm,
      });

      // Grant to Super Admin
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: p.id,
          },
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          permissionId: p.id,
        },
      });
    }

    // 3. SAFE DEVELOPMENT USERS & PROFILES
    console.log('👤 Seeding Development Users and Organization Profiles...');
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@sms-platform.internal' },
      update: {},
      create: {
        email: 'admin@sms-platform.internal',
        passwordHash: hashPassword('DevAdminPass123!'),
        firstName: 'System',
        lastName: 'Administrator',
        status: 'ACTIVE',
        roleId: superAdminRole.id,
      },
    });

    const managerUser = await prisma.user.upsert({
      where: { email: 'manager@sms-platform.internal' },
      update: {},
      create: {
        email: 'manager@sms-platform.internal',
        passwordHash: hashPassword('DevManagerPass123!'),
        firstName: 'Marcus',
        lastName: 'Vance',
        status: 'ACTIVE',
        roleId: managerRole.id,
      },
    });

    const managerProfile = await prisma.managerProfile.upsert({
      where: { userId: managerUser.id },
      update: {},
      create: {
        userId: managerUser.id,
        department: 'Global Carrier Operations',
        maxAgents: 100,
      },
    });

    const agentUser = await prisma.user.upsert({
      where: { email: 'agent.alpha@sms-platform.internal' },
      update: {},
      create: {
        email: 'agent.alpha@sms-platform.internal',
        passwordHash: hashPassword('DevAgentPass123!'),
        firstName: 'Elena',
        lastName: 'Rostova',
        status: 'ACTIVE',
        roleId: agentRole.id,
      },
    });

    const agentProfile = await prisma.agentProfile.upsert({
      where: { userId: agentUser.id },
      update: {},
      create: {
        userId: agentUser.id,
        managerId: managerProfile.id,
        commissionRate: 0.0500, // 5% commission
        status: 'ACTIVE',
      },
    });

    const clientUser = await prisma.user.upsert({
      where: { email: 'client.enterprise@sms-platform.internal' },
      update: {},
      create: {
        email: 'client.enterprise@sms-platform.internal',
        passwordHash: hashPassword('DevClientPass123!'),
        firstName: 'Liam',
        lastName: 'Chen',
        status: 'ACTIVE',
        roleId: clientRole.id,
      },
    });

    const clientProfile = await prisma.clientProfile.upsert({
      where: { userId: clientUser.id },
      update: {},
      create: {
        userId: clientUser.id,
        managerId: managerProfile.id,
        agentId: agentProfile.id,
        companyName: 'Apex Digital Media LLC',
        billingType: 'PREPAID',
        status: 'ACTIVE',
      },
    });

    // 4. COUNTRIES & OPERATORS
    console.log('🌍 Seeding Geographic & Telecom Master Data...');
    const usCountry = await prisma.country.upsert({
      where: { iso2: 'US' },
      update: {},
      create: {
        name: 'United States',
        iso2: 'US',
        iso3: 'USA',
        dialCode: '+1',
        currency: 'USD',
        status: 'ACTIVE',
      },
    });

    const ukCountry = await prisma.country.upsert({
      where: { iso2: 'GB' },
      update: {},
      create: {
        name: 'United Kingdom',
        iso2: 'GB',
        iso3: 'GBR',
        dialCode: '+44',
        currency: 'GBP',
        status: 'ACTIVE',
      },
    });

    const deCountry = await prisma.country.upsert({
      where: { iso2: 'DE' },
      update: {},
      create: {
        name: 'Germany',
        iso2: 'DE',
        iso3: 'DEU',
        dialCode: '+49',
        currency: 'EUR',
        status: 'ACTIVE',
      },
    });

    const attOperator = await prisma.operator.upsert({
      where: {
        countryId_mcc_mnc: {
          countryId: usCountry.id,
          mcc: '310',
          mnc: '410',
        },
      },
      update: {},
      create: {
        countryId: usCountry.id,
        name: 'AT&T Mobility',
        mcc: '310',
        mnc: '410',
        brandName: 'AT&T',
        status: 'ACTIVE',
      },
    });

    const vodafoneOperator = await prisma.operator.upsert({
      where: {
        countryId_mcc_mnc: {
          countryId: ukCountry.id,
          mcc: '234',
          mnc: '15',
        },
      },
      update: {},
      create: {
        countryId: ukCountry.id,
        name: 'Vodafone UK',
        mcc: '234',
        mnc: '15',
        brandName: 'Vodafone',
        status: 'ACTIVE',
      },
    });

    // 5. PROVIDERS, CONNECTIONS, AND SAFE CREDENTIALS
    console.log('📡 Seeding Telecom SMS Providers & Connections...');
    const provider1 = await prisma.provider.upsert({
      where: { slug: 'telco-direct-global' },
      update: {},
      create: {
        name: 'TelcoDirect Global Carrier',
        slug: 'telco-direct-global',
        status: 'ACTIVE',
        protocol: 'HTTP_REST',
        description: 'Tier-1 direct routing with high-throughput webhook delivery',
        webhookSecret: 'whsec_demo_safe_hash_token_phase02',
      },
    });

    const provider2 = await prisma.provider.upsert({
      where: { slug: 'nexus-smpp-hub' },
      update: {},
      create: {
        name: 'Nexus SMPP Hub',
        slug: 'nexus-smpp-hub',
        status: 'ACTIVE',
        protocol: 'SMPP',
        description: 'Dedicated SMPP v3.4 transceiver binds for bidirectional messaging',
      },
    });

    // Connections (Safe dev endpoints)
    await prisma.providerConnection.upsert({
      where: { id: 'conn-telco-direct-http-01' },
      update: {},
      create: {
        id: 'conn-telco-direct-http-01',
        providerId: provider1.id,
        name: 'US-East HTTP Webhook Gateway',
        protocol: 'HTTP',
        host: 'api.telcodirect-mock.internal',
        port: 443,
        systemId: 'client_sms_node_east',
        bindType: 'TRANSCEIVER',
        throughputLimit: 100,
        isActive: true,
        isConnected: true,
      },
    });

    await prisma.providerConnection.upsert({
      where: { id: 'conn-nexus-smpp-01' },
      update: {},
      create: {
        id: 'conn-nexus-smpp-01',
        providerId: provider2.id,
        name: 'Primary SMPP Transceiver Bind',
        protocol: 'SMPP',
        host: 'smpp.nexushub-mock.internal',
        port: 2775,
        systemId: 'smpp_sys_alpha',
        bindType: 'TRANSCEIVER',
        throughputLimit: 50,
        isActive: true,
        isConnected: true,
      },
    });

    // Safe Mock Credentials (NO real secret keys stored)
    await prisma.providerCredential.upsert({
      where: { id: 'cred-mock-telcodirect-api' },
      update: {},
      create: {
        id: 'cred-mock-telcodirect-api',
        providerId: provider1.id,
        name: 'REST API Token (Dev Mock)',
        credentialType: 'BEARER_TOKEN',
        keyReference: 'vault://sms-providers/telcodirect/api-key',
        maskedKey: 'td_live_••••••••••••94f2',
        encryptedSecret: 'ENC:aes-256-gcm:dGVzdF9jaXBoZXJfdGV4dF9kYXRh',
        iv: 'dGVzdF9pdg==',
        isEncrypted: true,
        status: 'ACTIVE',
      },
    });

    // 6. RANGES & NUMBERS INVENTORY
    console.log('📱 Seeding Number Ranges and E.164 Inventory...');
    const usRange = await prisma.range.upsert({
      where: { id: 'range-us-washdc-longcode' },
      update: {},
      create: {
        id: 'range-us-washdc-longcode',
        providerId: provider1.id,
        countryId: usCountry.id,
        operatorId: attOperator.id,
        name: 'US Washington DC 2-Way Longcode Pool',
        prefix: '+1202555',
        startRange: '+12025550100',
        endRange: '+12025550199',
        rangeType: 'LONGCODE',
        status: 'ACTIVE',
      },
    });

    const ukRange = await prisma.range.upsert({
      where: { id: 'range-uk-mobile-longcode' },
      update: {},
      create: {
        id: 'range-uk-mobile-longcode',
        providerId: provider2.id,
        countryId: ukCountry.id,
        operatorId: vodafoneOperator.id,
        name: 'UK National Mobile Range Pool',
        prefix: '+4477009',
        startRange: '+447700900100',
        endRange: '+447700900199',
        rangeType: 'LONGCODE',
        status: 'ACTIVE',
      },
    });

    // Phone Numbers
    const num1 = await prisma.number.upsert({
      where: { e164Number: '+12025550110' },
      update: {},
      create: {
        rangeId: usRange.id,
        providerId: provider1.id,
        countryId: usCountry.id,
        operatorId: attOperator.id,
        currentClientId: clientProfile.id,
        e164Number: '+12025550110',
        nationalNumber: '2025550110',
        numberType: 'LONGCODE',
        capabilities: 'SMS',
        status: 'ASSIGNED',
        assignedAt: new Date(),
      },
    });

    await prisma.number.upsert({
      where: { e164Number: '+12025550111' },
      update: {},
      create: {
        rangeId: usRange.id,
        providerId: provider1.id,
        countryId: usCountry.id,
        operatorId: attOperator.id,
        e164Number: '+12025550111',
        nationalNumber: '2025550111',
        numberType: 'LONGCODE',
        capabilities: 'SMS',
        status: 'AVAILABLE',
      },
    });

    await prisma.number.upsert({
      where: { e164Number: '+447700900105' },
      update: {},
      create: {
        rangeId: ukRange.id,
        providerId: provider2.id,
        countryId: ukCountry.id,
        operatorId: vodafoneOperator.id,
        e164Number: '+447700900105',
        nationalNumber: '07700900105',
        numberType: 'LONGCODE',
        capabilities: 'SMS',
        status: 'AVAILABLE',
      },
    });

    // Number Assignment History Record
    await prisma.numberAssignment.upsert({
      where: { id: 'assign-demo-num1-client' },
      update: {},
      create: {
        id: 'assign-demo-num1-client',
        numberId: num1.id,
        clientId: clientProfile.id,
        assignedByUserId: adminUser.id,
        status: 'ACTIVE',
        notes: 'Initial production allocation for Apex Digital Media campaign verification',
      },
    });

    // 7. RATES, WALLETS & FINANCIAL LEDGER
    console.log('💳 Seeding Rates, Wallets, and Ledger Transactions...');
    await prisma.rate.upsert({
      where: { id: 'rate-us-telcodirect-standard' },
      update: {},
      create: {
        id: 'rate-us-telcodirect-standard',
        providerId: provider1.id,
        countryId: usCountry.id,
        rangeId: usRange.id,
        costPerSms: 0.004500, // $0.0045 / inbound SMS
        currency: 'USD',
        status: 'ACTIVE',
      },
    });

    await prisma.clientPayout.upsert({
      where: { id: 'payout-client-us-rate' },
      update: {},
      create: {
        id: 'payout-client-us-rate',
        clientId: clientProfile.id,
        countryId: usCountry.id,
        rangeId: usRange.id,
        payoutPerSms: 0.009500, // Client pays $0.0095 / SMS
        currency: 'USD',
        status: 'ACTIVE',
      },
    });

    // Client Wallet
    const clientWallet = await prisma.wallet.upsert({
      where: {
        userId_currency: {
          userId: clientUser.id,
          currency: 'USD',
        },
      },
      update: {},
      create: {
        userId: clientUser.id,
        currency: 'USD',
        balance: 250.0000,
        pendingBalance: 0.0000,
        reservedBalance: 0.0000,
        status: 'ACTIVE',
      },
    });

    // Agent Wallet
    await prisma.wallet.upsert({
      where: {
        userId_currency: {
          userId: agentUser.id,
          currency: 'USD',
        },
      },
      update: {},
      create: {
        userId: agentUser.id,
        currency: 'USD',
        balance: 42.5000,
        pendingBalance: 5.2000,
        reservedBalance: 0.0000,
        status: 'ACTIVE',
      },
    });

    // Initial Wallet Ledger Transaction
    await prisma.transaction.upsert({
      where: { id: 'txn-initial-client-recharge' },
      update: {},
      create: {
        id: 'txn-initial-client-recharge',
        walletId: clientWallet.id,
        type: 'CREDIT',
        category: 'RECHARGE',
        amount: 250.0000,
        balanceBefore: 0.0000,
        balanceAfter: 250.0000,
        currency: 'USD',
        referenceType: 'MANUAL',
        referenceId: 'DEP-DEV-001',
        description: 'Development seed deposit for platform verification testing',
      },
    });

    // 8. SAMPLE INCOMING MESSAGE & CDR
    console.log('📨 Seeding Sample Inbound Message and Auditable CDR...');
    const sampleMsg = await prisma.incomingMessage.upsert({
      where: { id: 'msg-demo-inbound-001' },
      update: {},
      create: {
        id: 'msg-demo-inbound-001',
        messageRef: 'TELCO-DIR-EXT-7749201',
        numberId: num1.id,
        providerId: provider1.id,
        clientId: clientProfile.id,
        senderAddress: '+12025550198',
        destinationAddress: '+12025550110',
        messageBody: 'Your verification OTP is 849201. Valid for 10 minutes.',
        encoding: 'GSM-7',
        segmentCount: 1,
        status: 'ROUTED',
        rawPayload: {
          carrier: 'AT&T',
          mcc_mnc: '310410',
          origin_ts: '2026-09-10T00:00:00Z',
          dr_status: 'DELIVRD',
        },
      },
    });

    // Auditable CDR calculation:
    // Client Pays: $0.009500
    // Provider Cost: $0.004500
    // Agent Commission (5% of net or rate): $0.000250
    // Net Profit: $0.004750
    await prisma.cDR.upsert({
      where: { incomingMessageId: sampleMsg.id },
      update: {},
      create: {
        incomingMessageId: sampleMsg.id,
        numberId: num1.id,
        providerId: provider1.id,
        clientId: clientProfile.id,
        agentId: agentProfile.id,
        providerCost: 0.004500,
        clientPayout: 0.009500,
        agentCommission: 0.000250,
        netProfit: 0.004750,
        currency: 'USD',
        status: 'SETTLED',
      },
    });

    // 9. SYSTEM CONFIGS & AUDIT LOG
    console.log('⚙️ Seeding System Configs and Audit Log...');
    await prisma.systemConfig.upsert({
      where: { key: 'PLATFORM_PHASE' },
      update: { value: 'PHASE_02_DATABASE_ARCHITECTURE' },
      create: {
        key: 'PLATFORM_PHASE',
        value: 'PHASE_02_DATABASE_ARCHITECTURE',
        description: 'Current development milestone and schema version',
      },
    });

    await prisma.systemConfig.upsert({
      where: { key: 'DEFAULT_CURRENCY' },
      update: { value: 'USD' },
      create: {
        key: 'DEFAULT_CURRENCY',
        value: 'USD',
        description: 'Base financial accounting currency',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'DATABASE_SCHEMA_SEEDED',
        entityType: 'SYSTEM',
        entityId: 'ALL_PHASE_02_ENTITIES',
        metadata: {
          modelsSeeded: [
            'User', 'Role', 'Permission', 'RolePermission',
            'ManagerProfile', 'AgentProfile', 'ClientProfile',
            'Country', 'Operator', 'Provider', 'ProviderConnection', 'ProviderCredential',
            'Range', 'Number', 'NumberAssignment',
            'IncomingMessage', 'CDR', 'Rate', 'ClientPayout',
            'Wallet', 'Transaction', 'SystemConfig'
          ],
          phase: 'PHASE_02',
          seededAt: new Date().toISOString(),
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Prisma-Dev-Seeder/2.0',
      },
    });

    console.log('✅ Phase 02 Database Architecture Seeding Completed Successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.includes('seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
