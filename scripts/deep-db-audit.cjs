require('dotenv').config();
const { Client } = require('pg');

async function runAudit() {
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  
  // Use connection timeout and strip pgbouncer params if needed for pg Client
  const client = new Client({
    connectionString: dbUrl,
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('--- CONNECTED DIRECTLY TO POSTGRESQL ---');

    // 1. Audit Tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(`Found ${tables.length} tables in public schema:`, tables);

    // 2. Audit _prisma_migrations
    let migrationRows = [];
    if (tables.includes('_prisma_migrations')) {
      const migRes = await client.query(`
        SELECT id, migration_name, finished_at, rolled_back_at 
        FROM _prisma_migrations 
        ORDER BY finished_at ASC;
      `);
      migrationRows = migRes.rows;
      console.log(`_prisma_migrations exists with ${migrationRows.length} recorded migrations:`);
      console.table(migrationRows);
    } else {
      console.log('_prisma_migrations is ABSENT from public schema.');
    }

    // 3. Check Constraints (specifically Wallet exactly-one-owner check constraint)
    const checkConstraintsRes = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) as def
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace AND contype = 'c';
    `);
    console.log('\n--- CHECK CONSTRAINTS IN PUBLIC SCHEMA ---');
    console.table(checkConstraintsRes.rows);

    // 4. Foreign Key Constraints Count
    const fkRes = await client.query(`
      SELECT count(*) as count
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace AND contype = 'f';
    `);
    console.log('\nTotal Foreign Keys:', fkRes.rows[0].count);

    // 5. Unique Constraints Count
    const uniqueRes = await client.query(`
      SELECT count(*) as count
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace AND contype = 'u';
    `);
    console.log('Total Unique Constraints:', uniqueRes.rows[0].count);

    // 6. Total Indexes Count
    const idxRes = await client.query(`
      SELECT count(*) as count
      FROM pg_indexes
      WHERE schemaname = 'public';
    `);
    console.log('Total Indexes:', idxRes.rows[0].count);

    // 7. Data Integrity Checks (Phase C)
    console.log('\n--- PHASE C: DATA INTEGRITY CHECKS ---');

    // 7a. Duplicate user emails
    const dupUsersRes = await client.query(`
      SELECT email, count(*) 
      FROM "User" 
      GROUP BY email 
      HAVING count(*) > 1;
    `);
    console.log('Duplicate user emails:', dupUsersRes.rows.length);

    // 7b. Orphan User Roles
    const orphanUserRoles = await client.query(`
      SELECT ur.id 
      FROM "UserRole" ur
      LEFT JOIN "User" u ON ur."userId" = u.id
      LEFT JOIN "Role" r ON ur."roleId" = r.id
      WHERE u.id IS NULL OR r.id IS NULL;
    `);
    console.log('Orphan UserRoles:', orphanUserRoles.rows.length);

    // 7c. Orphan Role Permissions
    const orphanRolePerms = await client.query(`
      SELECT rp.id 
      FROM "RolePermission" rp
      LEFT JOIN "Role" r ON rp."roleId" = r.id
      LEFT JOIN "Permission" p ON rp."permissionId" = p.id
      WHERE r.id IS NULL OR p.id IS NULL;
    `);
    console.log('Orphan RolePermissions:', orphanRolePerms.rows.length);

    // 7d. Agents without valid user
    const orphanAgents = await client.query(`
      SELECT a.id 
      FROM "Agent" a
      LEFT JOIN "User" u ON a."userId" = u.id
      WHERE u.id IS NULL;
    `);
    console.log('Agents without valid user:', orphanAgents.rows.length);

    // 7e. Clients without valid agent where required
    const clientsHierarchy = await client.query(`
      SELECT id, name, "agentId" 
      FROM "Client";
    `);
    console.log(`Total Clients: ${clientsHierarchy.rows.length}`);

    // 7f. Number inventory & E.164 compliance
    const numbersRes = await client.query(`
      SELECT id, e164, status, "providerId", "rangeId"
      FROM "Number";
    `);
    console.log(`Total Phone Numbers: ${numbersRes.rows.length}`);
    const invalidE164 = numbersRes.rows.filter(n => !/^\+[1-9]\d{6,14}$/.test(n.e164));
    console.log('Invalid E.164 Numbers:', invalidE164.length);

    // 7g. Duplicate Active Assignments per number
    const dupActiveAssign = await client.query(`
      SELECT "numberId", count(*) 
      FROM "ActiveAssignment" 
      GROUP BY "numberId" 
      HAVING count(*) > 1;
    `);
    console.log('Numbers with multiple active assignments:', dupActiveAssign.rows.length);

    // 7h. Active Assignments referencing non-existent Number or Client
    const orphanActiveAssign = await client.query(`
      SELECT aa.id 
      FROM "ActiveAssignment" aa
      LEFT JOIN "Number" n ON aa."numberId" = n.id
      LEFT JOIN "Client" c ON aa."clientId" = c.id
      WHERE n.id IS NULL OR c.id IS NULL;
    `);
    console.log('Orphan Active Assignments:', orphanActiveAssign.rows.length);

    // 7i. Duplicate Inbound Message IDs per Provider
    const dupMessages = await client.query(`
      SELECT "providerId", "providerMessageId", count(*)
      FROM "InboundMessage"
      WHERE "providerMessageId" IS NOT NULL
      GROUP BY "providerId", "providerMessageId"
      HAVING count(*) > 1;
    `);
    console.log('Duplicate Provider Message IDs:', dupMessages.rows.length);

    // 7j. CDR without InboundMessage
    const orphanCdrs = await client.query(`
      SELECT c.id 
      FROM "Cdr" c
      LEFT JOIN "InboundMessage" m ON c."inboundMessageId" = m.id
      WHERE c."inboundMessageId" IS NOT NULL AND m.id IS NULL;
    `);
    console.log('CDRs with orphan inboundMessageId:', orphanCdrs.rows.length);

    // 7k. Wallet ownership check (num_nonnulls(clientId, agentId, providerId) + isPlatform = 1)
    const walletOwnership = await client.query(`
      SELECT id, "clientId", "agentId", "providerId", "isPlatform",
        (num_nonnulls("clientId", "agentId", "providerId") + ("isPlatform"::int)) as owner_count
      FROM "Wallet";
    `);
    console.log(`Total Wallets: ${walletOwnership.rows.length}`);
    const invalidWalletOwners = walletOwnership.rows.filter(w => w.owner_count !== 1);
    console.log('Wallets violating exactly-one-owner rule:', invalidWalletOwners.length);

    // 7l. Mathematical Reconciliation of Wallets against Ledger Entries
    console.log('\n--- WALLET LEDGER MATHEMATICAL RECONCILIATION ---');
    const ledgerReconcileRes = await client.query(`
      SELECT 
        w.id as wallet_id,
        w."balanceMicrounits" as balance,
        w."isPlatform",
        COALESCE(SUM(CASE 
          WHEN le.type IN ('CREDIT', 'REFUND') THEN le."amountMicrounits"
          WHEN le.type IN ('DEBIT', 'FEE') THEN -le."amountMicrounits"
          WHEN le.type = 'ADJUSTMENT' AND le."amountMicrounits" >= 0 THEN le."amountMicrounits"
          WHEN le.type = 'ADJUSTMENT' AND le."amountMicrounits" < 0 THEN le."amountMicrounits"
          ELSE 0 
        END), 0) as ledger_sum,
        COUNT(le.id) as ledger_count
      FROM "Wallet" w
      LEFT JOIN "LedgerEntry" le ON le."walletId" = w.id
      GROUP BY w.id, w."balanceMicrounits", w."isPlatform";
    `);
    
    let discrepancies = 0;
    for (const row of ledgerReconcileRes.rows) {
      const balance = BigInt(row.balance);
      const ledgerSum = BigInt(row.ledger_sum);
      const diff = balance - ledgerSum;
      const isOk = diff === 0n;
      if (!isOk) discrepancies++;
      console.log(`Wallet ${row.wallet_id}: Balance = ${balance} µu | LedgerSum = ${ledgerSum} µu (${row.ledger_count} entries) | Match: ${isOk ? '✅ OK' : '❌ DRIFT ' + diff}`);
    }
    console.log(`Total Ledger/Wallet Discrepancies: ${discrepancies}`);

    // 7m. CDR Gross Profit Spread Verification (ProviderCost + AgentCommission + PlatformProfit == ClientCharge)
    console.log('\n--- CDR FINANCIAL SPREAD PROOF ---');
    const cdrsFinancialRes = await client.query(`
      SELECT 
        id,
        "providerCostMicrounits" as provider_cost,
        "clientChargeMicrounits" as client_charge,
        COALESCE("agentCommissionMicrounits", 0) as agent_comm,
        "platformProfitMicrounits" as platform_profit
      FROM "Cdr";
    `);
    let cdrDiscrepancies = 0;
    for (const cdr of cdrsFinancialRes.rows) {
      const cost = BigInt(cdr.provider_cost);
      const charge = BigInt(cdr.client_charge);
      const comm = BigInt(cdr.agent_comm);
      const profit = BigInt(cdr.platform_profit);
      const expectedProfit = charge - cost - comm;
      const matches = (cost + comm + profit) === charge;
      if (!matches) cdrDiscrepancies++;
      console.log(`CDR ${cdr.id}: Cost=${cost} + Comm=${comm} + Profit=${profit} == Charge=${charge} | Match: ${matches ? '✅ OK' : '❌ DRIFT'}`);
    }
    console.log(`Total CDR Mathematical Discrepancies: ${cdrDiscrepancies}`);

    await client.end();
  } catch (err) {
    console.error('Audit execution error:', err);
    try { await client.end(); } catch {}
  }
}

runAudit();
