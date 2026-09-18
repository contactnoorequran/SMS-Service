import { getPrismaClient } from '../server/db/prisma';

async function run() {
  const prisma = getPrismaClient();
  if (!prisma) {
    console.error('Prisma client could not be created');
    process.exit(1);
  }

  const results: any = {};

  try {
    // ----------------------------------------------------
    // STEP 6: ID PARITY COMPARISONS
    // ----------------------------------------------------
    const idComparisons = [
      { legacy: 'users', target: 'User', pk: 'id' },
      { legacy: 'roles', target: 'Role', pk: 'id' },
      { legacy: 'permissions', target: 'Permission', pk: 'id' },
      { legacy: 'providers', target: 'Provider', pk: 'id' },
      { legacy: 'countries', target: 'Country', pk: 'id' },
      { legacy: 'operators', target: 'Operator', pk: 'id' },
      { legacy: 'ranges', target: 'Range', pk: 'id' },
      { legacy: 'numbers', target: 'Number', pk: 'id' },
      { legacy: 'incoming_messages', target: 'InboundMessage', pk: 'id' },
      { legacy: 'cdrs', target: 'Cdr', pk: 'id' },
      { legacy: 'wallets', target: 'Wallet', pk: 'id' },
      { legacy: 'transactions', target: 'BillingTransaction', pk: 'id' },
      { legacy: 'audit_logs', target: 'AuditLog', pk: 'id' },
    ];

    results.idParity = {};
    for (const comp of idComparisons) {
      const sql = `
        SELECT 
          (SELECT COUNT(*) FROM "${comp.legacy}") as legacy_count,
          (SELECT COUNT(*) FROM "${comp.target}") as target_count,
          (SELECT COUNT(*) FROM "${comp.legacy}" l WHERE NOT EXISTS (SELECT 1 FROM "${comp.target}" t WHERE t."${comp.pk}" = l."${comp.pk}")) as missing_in_target
      `;
      const res: any = await prisma.$queryRawUnsafe(sql);
      results.idParity[comp.legacy] = {
        legacyCount: Number(res[0].legacy_count),
        targetCount: Number(res[0].target_count),
        missingInTarget: Number(res[0].missing_in_target),
      };
    }

    // ----------------------------------------------------
    // STEP 7: FIELD MAPPINGS
    // ----------------------------------------------------
    // 1. Users: name preservation for all 19 legacy users
    const userParitySql = `
      SELECT 
        l.id, 
        l.email,
        l."firstName", 
        l."lastName", 
        t.name as target_name,
        TRIM(COALESCE(l."firstName", '') || ' ' || COALESCE(l."lastName", '')) as expected_name,
        (t.name = TRIM(COALESCE(l."firstName", '') || ' ' || COALESCE(l."lastName", ''))) as name_matches
      FROM "users" l
      JOIN "User" t ON t.id = l.id
    `;
    const userParity: any = await prisma.$queryRawUnsafe(userParitySql);
    results.userParity = {
      totalLegacyUsers: userParity.length,
      allNamesMatch: userParity.every((u: any) => u.name_matches),
      mismatchedUsers: userParity.filter((u: any) => !u.name_matches),
    };

    // 2. Providers & Protocol
    const providerSql = `
      SELECT 
        p.id, 
        p.name, 
        p.status as legacy_status, 
        tp.status as target_status,
        pc.protocol as legacy_protocol, 
        tpc."connectionType" as target_connection_type
      FROM "providers" p
      JOIN "Provider" tp ON tp.id = p.id
      LEFT JOIN "provider_connections" pc ON pc."providerId" = p.id
      LEFT JOIN "ProviderConnection" tpc ON tpc."providerId" = p.id
    `;
    results.providerParity = await prisma.$queryRawUnsafe(providerSql);

    // 3. Credentials (without exposing secrets!)
    const credSql = `
      SELECT 
        pc.id,
        pc."keyReference",
        cr."keyVersion",
        (cr.ciphertext IS NOT NULL) as has_ciphertext,
        (cr.ciphertext LIKE '%iv%') as has_iv_in_ciphertext,
        (cr.ciphertext LIKE '%data%') as has_data_in_ciphertext
      FROM "provider_credentials" pc
      JOIN "CredentialReference" cr ON cr.id = pc.id
    `;
    results.credentialParity = await prisma.$queryRawUnsafe(credSql);

    // 4. Ranges
    const rangeSql = `
      SELECT 
        r.id,
        r."startRange",
        t."startE164",
        r."endRange",
        t."endE164",
        t."startNum",
        t."endNum",
        (t."startE164" = r."startRange" AND t."endE164" = r."endRange") as e164_matches,
        (t."startNum" = SUBSTRING(r."startRange" FROM 2)::bigint) as start_num_matches,
        (t."endNum" = SUBSTRING(r."endRange" FROM 2)::bigint) as end_num_matches
      FROM "ranges" r
      JOIN "Range" t ON t.id = r.id
    `;
    results.rangeParity = await prisma.$queryRawUnsafe(rangeSql);

    // 5. Numbers
    const numberSql = `
      SELECT 
        n.id,
        n."e164Number" as legacy_e164,
        t.e164 as target_e164,
        (n."e164Number" = t.e164) as e164_matches,
        (n."providerId" = t."providerId") as provider_matches,
        (n."countryId" = t."countryId") as country_matches,
        (n."operatorId" = t."operatorId") as operator_matches,
        (n."rangeId" = t."rangeId") as range_matches
      FROM "numbers" n
      JOIN "Number" t ON t.id = n.id
    `;
    results.numberParity = await prisma.$queryRawUnsafe(numberSql);

    // 6. Assignments
    const assignmentSql = `
      SELECT 
        na.id,
        na."numberId",
        na.status as legacy_status,
        (aa.id IS NOT NULL) as in_active_assignments,
        (ah.id IS NOT NULL) as in_history
      FROM "number_assignments" na
      LEFT JOIN "ActiveAssignment" aa ON aa."numberId" = na."numberId"
      LEFT JOIN "AssignmentHistory" ah ON ah.id = na.id
    `;
    results.assignmentParity = await prisma.$queryRawUnsafe(assignmentSql);

    // 7. Messages
    const msgSql = `
      SELECT 
        im.id,
        im."messageRef",
        t."providerMessageId",
        im."senderAddress",
        t."fromNumber",
        im."destinationAddress",
        t."toNumber",
        im."receivedAt",
        t."receivedAt" as target_received_at,
        (t."providerMessageId" = im."messageRef") as ref_matches,
        (t."fromNumber" = im."senderAddress") as from_matches,
        (t."toNumber" = im."destinationAddress") as to_matches
      FROM "incoming_messages" im
      JOIN "InboundMessage" t ON t.id = im.id
    `;
    results.messageParity = await prisma.$queryRawUnsafe(msgSql);

    // 8. CDR and BillingEvent
    const cdrSql = `
      SELECT 
        c.id as legacy_cdr_id,
        tc.id as target_cdr_id,
        be.id as target_be_id,
        (tc.id IS NOT NULL) as has_target_cdr,
        (be.id IS NOT NULL) as has_target_be,
        (tc."billingEventId" = be.id) as cdr_links_to_be
      FROM "cdrs" c
      LEFT JOIN "Cdr" tc ON tc.id = c.id
      LEFT JOIN "BillingEvent" be ON be.id = ('be-' || c.id)
    `;
    results.cdrParity = await prisma.$queryRawUnsafe(cdrSql);

    // ----------------------------------------------------
    // STEP 8: FINANCIAL RECONCILIATION (Micro-units)
    // 1 nominal = 1,000,000 micro-units
    // ----------------------------------------------------
    // A. Wallets
    const walletReconciliationSql = `
      SELECT 
        w.id,
        w."userId",
        w.currency,
        w.balance::numeric as source_nominal,
        tw."balanceMicrounits"::bigint as target_microunits,
        (tw."balanceMicrounits"::numeric / 1000000.0) as reverse_nominal,
        (w.balance::numeric - (tw."balanceMicrounits"::numeric / 1000000.0)) as delta
      FROM "wallets" w
      JOIN "Wallet" tw ON tw.id = w.id
    `;
    results.walletReconciliation = await prisma.$queryRawUnsafe(walletReconciliationSql);

    // B. Transactions
    const txReconciliationSql = `
      SELECT 
        t.id,
        t."walletId",
        t.currency,
        t.amount::numeric as source_nominal,
        bt."amountMicrounits"::bigint as target_microunits,
        (bt."amountMicrounits"::numeric / 1000000.0) as reverse_nominal,
        (t.amount::numeric - (bt."amountMicrounits"::numeric / 1000000.0)) as delta
      FROM "transactions" t
      JOIN "BillingTransaction" bt ON bt.id = t.id
    `;
    results.txReconciliation = await prisma.$queryRawUnsafe(txReconciliationSql);

    // C. CDRs / BillingEvents Financials
    const cdrFinReconciliationSql = `
      SELECT 
        c.id,
        c.currency,
        c."providerCost"::numeric as src_provider_cost,
        tc."providerCostMicrounits"::bigint as tgt_provider_cost_mu,
        (c."providerCost"::numeric - (tc."providerCostMicrounits"::numeric / 1000000.0)) as provider_cost_delta,

        c."clientPayout"::numeric as src_client_charge,
        tc."clientChargeMicrounits"::bigint as tgt_client_charge_mu,
        (c."clientPayout"::numeric - (tc."clientChargeMicrounits"::numeric / 1000000.0)) as client_charge_delta,

        c."agentCommission"::numeric as src_agent_comm,
        tc."agentCommissionMicrounits"::bigint as tgt_agent_comm_mu,
        (c."agentCommission"::numeric - (tc."agentCommissionMicrounits"::numeric / 1000000.0)) as agent_comm_delta,

        c."netProfit"::numeric as src_platform_profit,
        tc."platformProfitMicrounits"::bigint as tgt_platform_profit_mu,
        (c."netProfit"::numeric - (tc."platformProfitMicrounits"::numeric / 1000000.0)) as platform_profit_delta
      FROM "cdrs" c
      JOIN "Cdr" tc ON tc.id = c.id
    `;
    results.cdrFinReconciliation = await prisma.$queryRawUnsafe(cdrFinReconciliationSql);

    // D. Rates
    const rateReconciliationSql = `
      SELECT 
        r.id,
        r.currency,
        r."costPerSms"::numeric as src_cost_per_sms,
        tr."amountMicrounits"::bigint as tgt_cost_mu,
        (r."costPerSms"::numeric - (tr."amountMicrounits"::numeric / 1000000.0)) as rate_delta
      FROM "rates" r
      JOIN "Rate" tr ON tr.id = r.id
    `;
    results.rateReconciliation = await prisma.$queryRawUnsafe(rateReconciliationSql);

    // E. Client Payouts to Rate
    const clientPayoutReconciliationSql = `
      SELECT 
        cp.id,
        cp.currency,
        cp."payoutPerSms"::numeric as src_payout_per_sms,
        tr."amountMicrounits"::bigint as tgt_payout_mu,
        (cp."payoutPerSms"::numeric - (tr."amountMicrounits"::numeric / 1000000.0)) as payout_delta
      FROM "client_payouts" cp
      JOIN "Rate" tr ON tr.id = cp.id
    `;
    results.clientPayoutReconciliation = await prisma.$queryRawUnsafe(clientPayoutReconciliationSql);

    console.log('PARITY_RESULTS:', JSON.stringify(results, null, 2));
  } catch (err: any) {
    console.error('Parity check error:', err.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
