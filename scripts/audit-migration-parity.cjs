const { Client } = require('pg');
require('dotenv').config();

async function runAudit() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    console.log('=== DATABASE CONNECTION SUCCESSFUL ===\n');

    // -------------------------------------------------------------
    // STEP 1: _prisma_migrations Audit
    // -------------------------------------------------------------
    console.log('--- STEP 1: _PRISMA_MIGRATIONS TABLE ---');
    const migRes = await client.query(`
      SELECT id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count
      FROM _prisma_migrations
      ORDER BY started_at ASC;
    `);
    console.log(JSON.stringify(migRes.rows, null, 2));

    // Check for duplicates or conflicting migration records
    const dupMigRes = await client.query(`
      SELECT migration_name, count(*) 
      FROM _prisma_migrations 
      GROUP BY migration_name 
      HAVING count(*) > 1;
    `);
    console.log('Duplicate migrations count:', dupMigRes.rows.length);

    // -------------------------------------------------------------
    // STEP 3: information_schema tables & types check
    // -------------------------------------------------------------
    console.log('\n--- STEP 3: LIVE DATABASE TABLES & ARCHITECTURE ---');
    const allTablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const allTables = allTablesRes.rows.map(r => r.table_name);
    console.log(`Total tables in public schema: ${allTables.length}`);

    // Check for unwanted legacy architectures like NumberRange, PhoneNumber, etc.
    const unwantedArchitectures = ['NumberRange', 'PhoneNumber', 'CallDetailRecord', 'RateSheet', 'RateSheetItem', 'Session'];
    const foundUnwanted = allTables.filter(t => unwantedArchitectures.includes(t));
    console.log('Found unwanted architecture tables:', foundUnwanted);

    // Check Custom Types / Enums
    const enumsRes = await client.query(`
      SELECT t.typname as enum_name, string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname;
    `);
    console.log('Enums present:');
    console.table(enumsRes.rows);

    // -------------------------------------------------------------
    // STEP 4 & 5: Legacy vs Target Row Counts Reconciliation
    // -------------------------------------------------------------
    console.log('\n--- STEP 4 & 5: RECONCILIATION TABLE ---');
    const mappingPairs = [
      { legacy: 'users', target: 'User', note: '1:1 User accounts' },
      { legacy: 'roles', target: 'Role', note: '1:1 Roles' },
      { legacy: 'permissions', target: 'Permission', note: '1:1 Permissions' },
      { legacy: 'role_permissions', target: 'RolePermission', note: '1:1 Role-Permission mappings' },
      { legacy: 'users', target: 'UserRole', note: 'Users assigned to Roles' },
      { legacy: 'manager_profiles', target: 'ManagerProfile', note: '1:1 Manager profiles' },
      { legacy: 'agent_profiles', target: 'Agent', note: '1:1 Agent domain profiles' },
      { legacy: 'client_profiles', target: 'Client', note: '1:1 Client company records' },
      { legacy: 'client_profiles', target: 'ClientUser', note: '1:1 Client-User memberships' },
      { legacy: 'providers', target: 'Provider', note: '1:1 SMS Providers' },
      { legacy: 'provider_connections', target: 'ProviderConnection', note: '1:1 Provider connections' },
      { legacy: 'provider_credentials', target: 'CredentialReference', note: '1:1 KMS credential references' },
      { legacy: 'countries', target: 'Country', note: '1:1 Geo countries' },
      { legacy: 'operators', target: 'Operator', note: '1:1 Telco operators' },
      { legacy: 'ranges', target: 'Range', note: '1:1 E.164 ranges' },
      { legacy: 'numbers', target: 'Number', note: '1:1 Inventory numbers' },
      { legacy: 'number_assignments', target: 'ActiveAssignment', note: 'Only ACTIVE assignments (active filter)' },
      { legacy: 'number_assignments', target: 'AssignmentHistory', note: 'All historical assignments' },
      { legacy: 'incoming_messages', target: 'InboundMessage', note: '1:1 Inbound SMS messages' },
      { legacy: 'cdrs', target: 'BillingEvent', note: '1:1 Billing Events created per CDR' },
      { legacy: 'cdrs', target: 'Cdr', note: '1:1 Financial CDRs' },
      { legacy: 'rates', target: 'Rate', note: 'Provider rates + Client payouts' },
      { legacy: 'client_payouts', target: 'Rate', note: 'Client rates merged into Rate' },
      { legacy: 'wallets', target: 'Wallet', note: 'Agent + Client wallets (+1 platform wallet)' },
      { legacy: 'transactions', target: 'BillingTransaction', note: '1:1 Billing transactions' },
      { legacy: 'transactions', target: 'LedgerEntry', note: '1:1 Double-entry ledger entries' },
      { legacy: 'audit_logs', target: 'AuditLog', note: '1:1 Audit logs' },
      { legacy: 'notifications', target: 'Notification', note: 'Notifications (if any)' },
      { legacy: 'credit_notes', target: 'CreditNote', note: 'Credit notes (if any)' },
      { legacy: 'payment_requests', target: 'PaymentRequest', note: 'Payment requests (if any)' },
      { legacy: 'api_credentials', target: 'ApiCredential', note: 'Api credentials (if any)' },
      { legacy: 'api_request_logs', target: 'ApiRequestLog', note: 'Api request logs (if any)' }
    ];

    const reconciliationResults = [];
    for (const pair of mappingPairs) {
      let legacyCount = 0;
      let targetCount = 0;
      let legacyExists = allTables.includes(pair.legacy);
      let targetExists = allTables.includes(pair.target);

      if (legacyExists) {
        const res = await client.query(`SELECT count(*) FROM "${pair.legacy}"`);
        legacyCount = parseInt(res.rows[0].count, 10);
      }
      if (targetExists) {
        const res = await client.query(`SELECT count(*) FROM "${pair.target}"`);
        targetCount = parseInt(res.rows[0].count, 10);
      }

      reconciliationResults.push({
        legacyTable: pair.legacy,
        targetTable: pair.target,
        legacyCount,
        targetCount,
        note: pair.note
      });
    }

    console.table(reconciliationResults);

    // -------------------------------------------------------------
    // STEP 6: Primary Key Parity Checks
    // -------------------------------------------------------------
    console.log('\n--- STEP 6: PRIMARY IDENTIFIER PARITY CHECKS ---');
    const idCheckPairs = [
      { legacyTable: 'users', targetTable: 'User', pk: 'id' },
      { legacyTable: 'roles', targetTable: 'Role', pk: 'id' },
      { legacyTable: 'permissions', targetTable: 'Permission', pk: 'id' },
      { legacyTable: 'providers', targetTable: 'Provider', pk: 'id' },
      { legacyTable: 'countries', targetTable: 'Country', pk: 'id' },
      { legacyTable: 'operators', targetTable: 'Operator', pk: 'id' },
      { legacyTable: 'ranges', targetTable: 'Range', pk: 'id' },
      { legacyTable: 'numbers', targetTable: 'Number', pk: 'id' },
      { legacyTable: 'incoming_messages', targetTable: 'InboundMessage', pk: 'id' },
      { legacyTable: 'cdrs', targetTable: 'Cdr', pk: 'id' },
      { legacyTable: 'wallets', targetTable: 'Wallet', pk: 'id' },
      { legacyTable: 'transactions', targetTable: 'BillingTransaction', pk: 'id' },
      { legacyTable: 'audit_logs', targetTable: 'AuditLog', pk: 'id' },
    ];

    for (const pair of idCheckPairs) {
      if (allTables.includes(pair.legacyTable) && allTables.includes(pair.targetTable)) {
        const missingRes = await client.query(`
          SELECT l."${pair.pk}"
          FROM "${pair.legacyTable}" l
          LEFT JOIN "${pair.targetTable}" t ON l."${pair.pk}" = t."${pair.pk}"
          WHERE t."${pair.pk}" IS NULL;
        `);
        const extraRes = await client.query(`
          SELECT t."${pair.pk}"
          FROM "${pair.targetTable}" t
          LEFT JOIN "${pair.legacyTable}" l ON t."${pair.pk}" = l."${pair.pk}"
          WHERE l."${pair.pk}" IS NULL;
        `);
        console.log(`${pair.legacyTable} -> ${pair.targetTable}: Missing in target = ${missingRes.rows.length}, Extra in target = ${extraRes.rows.length}`);
        if (extraRes.rows.length > 0) {
          console.log(`   (Extra IDs in ${pair.targetTable}:`, extraRes.rows.slice(0, 5).map(r => r[pair.pk]), ')');
        }
      }
    }

    // -------------------------------------------------------------
    // STEP 7: Important Field Mappings Verification
    // -------------------------------------------------------------
    console.log('\n--- STEP 7: IMPORTANT FIELD MAPPINGS ---');

    // 7.1 Users firstName + lastName -> name
    const usersParity = await client.query(`
      SELECT 
        l.id, 
        l."firstName", 
        l."lastName", 
        TRIM(COALESCE(l."firstName", '') || ' ' || COALESCE(l."lastName", '')) as expected_name,
        t.name as actual_name,
        (TRIM(COALESCE(l."firstName", '') || ' ' || COALESCE(l."lastName", '')) = t.name) as name_matches
      FROM "users" l
      JOIN "User" t ON l.id = t.id;
    `);
    const userMismatches = usersParity.rows.filter(r => !r.name_matches);
    console.log(`User name field matches: ${usersParity.rows.length - userMismatches.length} / ${usersParity.rows.length} (Mismatches: ${userMismatches.length})`);
    console.log('Preserved user names count:', usersParity.rows.length);

    // 7.2 Providers status and protocol mapping
    const provParity = await client.query(`
      SELECT 
        p.id, p.name, p.status as legacy_status, t.status as target_status,
        pc.protocol as legacy_protocol, tc."connectionType" as target_conn_type
      FROM "providers" p
      JOIN "Provider" t ON p.id = t.id
      LEFT JOIN "provider_connections" pc ON pc."providerId" = p.id
      LEFT JOIN "ProviderConnection" tc ON tc."providerId" = t.id;
    `);
    console.log('Provider mapping sample:');
    console.table(provParity.rows);

    // 7.3 Credentials
    const credParity = await client.query(`
      SELECT 
        pc.id,
        pc."keyReference",
        cr."keyVersion",
        (cr.ciphertext IS NOT NULL) as ciphertext_present,
        (cr.ciphertext LIKE '%iv%' AND cr.ciphertext LIKE '%data%') as envelope_valid
      FROM "provider_credentials" pc
      JOIN "CredentialReference" cr ON pc.id = cr.id;
    `);
    console.log('CredentialReference envelope preservation:');
    console.table(credParity.rows);

    // 7.4 Ranges (startRange, endRange, numeric conversion)
    const rangeParity = await client.query(`
      SELECT 
        r.id,
        r."startRange", r."endRange",
        t."startE164", t."endE164",
        t."startNum", t."endNum",
        (SUBSTRING(r."startRange" FROM 2)::BIGINT = t."startNum") as start_num_valid,
        (SUBSTRING(r."endRange" FROM 2)::BIGINT = t."endNum") as end_num_valid
      FROM "ranges" r
      JOIN "Range" t ON r.id = t.id;
    `);
    const rangeInvalid = rangeParity.rows.filter(r => !r.start_num_valid || !r.end_num_valid);
    console.log(`Ranges numerical parity: ${rangeParity.rows.length - rangeInvalid.length} / ${rangeParity.rows.length} valid`);

    // 7.5 Numbers
    const numberParity = await client.query(`
      SELECT count(*) as count
      FROM "numbers" l
      JOIN "Number" t ON l.id = t.id
      WHERE l."e164Number" = t.e164 
        AND l."providerId" = t."providerId"
        AND l."countryId" = t."countryId";
    `);
    console.log(`Numbers relational parity: ${numberParity.rows[0].count} / 120 matching`);

    // 7.6 Active vs Historical Assignments
    const activeAssignCount = await client.query(`SELECT count(*) FROM "ActiveAssignment"`);
    const histAssignCount = await client.query(`SELECT count(*) FROM "AssignmentHistory"`);
    const legacyActiveCount = await client.query(`SELECT count(*) FROM "number_assignments" WHERE status = 'ACTIVE'`);
    const legacyTotalCount = await client.query(`SELECT count(*) FROM "number_assignments"`);
    console.log(`Active assignments: legacy=${legacyActiveCount.rows[0].count}, target=${activeAssignCount.rows[0].count}`);
    console.log(`Total assignments: legacy=${legacyTotalCount.rows[0].count}, target=${histAssignCount.rows[0].count}`);

    // 7.7 CDR / BillingEvent 1-to-1 relationship
    const cdrBillingRel = await client.query(`
      SELECT 
        c.id as cdr_id, 
        c."billingEventId",
        b.id as billing_event_id,
        (b.id IS NOT NULL) as valid_link
      FROM "Cdr" c
      LEFT JOIN "BillingEvent" b ON c."billingEventId" = b.id;
    `);
    const invalidCdrLinks = cdrBillingRel.rows.filter(r => !r.valid_link);
    console.log(`CDR to BillingEvent valid 1:1 links: ${cdrBillingRel.rows.length - invalidCdrLinks.length} / ${cdrBillingRel.rows.length}`);

    // 7.8 Financial micro-unit reconciliation
    console.log('\n--- STEP 8: FINANCIAL MICRO-UNIT RECONCILIATION ---');
    const cdrFin = await client.query(`
      SELECT 
        l.id,
        l."providerCost" as src_provider_cost,
        t."providerCostMicrounits" as tgt_provider_cost,
        (t."providerCostMicrounits"::NUMERIC / 1000000) as rev_provider_cost,
        l."clientPayout" as src_client_charge,
        t."clientChargeMicrounits" as tgt_client_charge,
        (t."clientChargeMicrounits"::NUMERIC / 1000000) as rev_client_charge,
        l."agentCommission" as src_agent_comm,
        t."agentCommissionMicrounits" as tgt_agent_comm,
        (t."agentCommissionMicrounits"::NUMERIC / 1000000) as rev_agent_comm,
        l."netProfit" as src_net_profit,
        t."platformProfitMicrounits" as tgt_platform_profit,
        (t."platformProfitMicrounits"::NUMERIC / 1000000) as rev_platform_profit
      FROM "cdrs" l
      JOIN "Cdr" t ON l.id = t.id;
    `);

    let finDiscrepancies = 0;
    const financialReconciliationTable = [];
    for (const r of cdrFin.rows) {
      const pCostDelta = Math.abs(parseFloat(r.src_provider_cost) - parseFloat(r.rev_provider_cost));
      const cChargeDelta = Math.abs(parseFloat(r.src_client_charge) - parseFloat(r.rev_client_charge));
      const aCommDelta = Math.abs(parseFloat(r.src_agent_comm) - parseFloat(r.rev_agent_comm));
      const nProfitDelta = Math.abs(parseFloat(r.src_net_profit) - parseFloat(r.rev_platform_profit));

      if (pCostDelta > 0.000001 || cChargeDelta > 0.000001 || aCommDelta > 0.000001 || nProfitDelta > 0.000001) {
        finDiscrepancies++;
      }

      financialReconciliationTable.push({
        entity: `CDR ${r.id} (ClientCharge)`,
        srcDecimal: r.src_client_charge,
        tgtMicrounits: r.tgt_client_charge,
        revDecimal: r.rev_client_charge,
        delta: cChargeDelta,
        status: cChargeDelta === 0 ? 'MATCH' : 'MISMATCH'
      });
      financialReconciliationTable.push({
        entity: `CDR ${r.id} (ProviderCost)`,
        srcDecimal: r.src_provider_cost,
        tgtMicrounits: r.tgt_provider_cost,
        revDecimal: r.rev_provider_cost,
        delta: pCostDelta,
        status: pCostDelta === 0 ? 'MATCH' : 'MISMATCH'
      });
      financialReconciliationTable.push({
        entity: `CDR ${r.id} (AgentCommission)`,
        srcDecimal: r.src_agent_comm,
        tgtMicrounits: r.tgt_agent_comm,
        revDecimal: r.rev_agent_comm,
        delta: aCommDelta,
        status: aCommDelta === 0 ? 'MATCH' : 'MISMATCH'
      });
      financialReconciliationTable.push({
        entity: `CDR ${r.id} (PlatformProfit)`,
        srcDecimal: r.src_net_profit,
        tgtMicrounits: r.tgt_platform_profit,
        revDecimal: r.rev_platform_profit,
        delta: nProfitDelta,
        status: nProfitDelta === 0 ? 'MATCH' : 'MISMATCH'
      });
    }

    console.table(financialReconciliationTable.slice(0, 12));
    console.log(`Total Financial Reconciliation Discrepancies in CDRs: ${finDiscrepancies}`);

    // Wallets Financial Reconciliation
    const walletFin = await client.query(`
      SELECT 
        l.id,
        l.balance as src_balance,
        t."balanceMicrounits" as tgt_balance_microunits,
        (t."balanceMicrounits"::NUMERIC / 1000000) as rev_balance,
        ABS(l.balance - (t."balanceMicrounits"::NUMERIC / 1000000)) as delta
      FROM "wallets" l
      JOIN "Wallet" t ON l.id = t.id;
    `);
    console.log('\nWallets Financial Reconciliation:');
    console.table(walletFin.rows);

    // Transactions Financial Reconciliation
    const txFin = await client.query(`
      SELECT 
        l.id,
        l.amount as src_amount,
        t."amountMicrounits" as tgt_amount_microunits,
        (t."amountMicrounits"::NUMERIC / 1000000) as rev_amount,
        ABS(l.amount - (t."amountMicrounits"::NUMERIC / 1000000)) as delta
      FROM "transactions" l
      JOIN "BillingTransaction" t ON l.id = t.id;
    `);
    console.log('\nTransactions Financial Reconciliation:');
    console.table(txFin.rows);

  } catch (err) {
    console.error('Audit execution error:', err);
  } finally {
    await client.end();
  }
}

runAudit();
