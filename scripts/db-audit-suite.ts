import { getPrismaClient } from '../server/db/prisma';
import * as fs from 'fs';

async function queryWithRetry<T>(fn: (prisma: any) => Promise<T>, maxRetries = 3): Promise<T> {
  let lastErr: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('No prisma client');
    try {
      return await fn(prisma);
    } catch (err: any) {
      lastErr = err;
      console.warn(`Attempt ${attempt} failed: ${err.message || err}. Retrying in 2s...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  throw lastErr;
}

async function run() {
  const output: any = {};

  console.log('--- Step 1: ID Parity ---');
  output.idParity = await queryWithRetry(async (p) => {
    return await p.$queryRawUnsafe(`
      SELECT 'users' as legacy, 'User' as target, (SELECT count(*) FROM "users") as src_cnt, (SELECT count(*) FROM "User") as tgt_cnt, (SELECT count(*) FROM "users" l WHERE NOT EXISTS (SELECT 1 FROM "User" t WHERE t.id = l.id)) as missing
      UNION ALL
      SELECT 'roles', 'Role', (SELECT count(*) FROM "roles"), (SELECT count(*) FROM "Role"), (SELECT count(*) FROM "roles" l WHERE NOT EXISTS (SELECT 1 FROM "Role" t WHERE t.id = l.id))
      UNION ALL
      SELECT 'permissions', 'Permission', (SELECT count(*) FROM "permissions"), (SELECT count(*) FROM "Permission"), (SELECT count(*) FROM "permissions" l WHERE NOT EXISTS (SELECT 1 FROM "Permission" t WHERE t.id = l.id))
      UNION ALL
      SELECT 'providers', 'Provider', (SELECT count(*) FROM "providers"), (SELECT count(*) FROM "Provider"), (SELECT count(*) FROM "providers" l WHERE NOT EXISTS (SELECT 1 FROM "Provider" t WHERE t.id = l.id))
      UNION ALL
      SELECT 'countries', 'Country', (SELECT count(*) FROM "countries"), (SELECT count(*) FROM "Country"), (SELECT count(*) FROM "countries" l WHERE NOT EXISTS (SELECT 1 FROM "Country" t WHERE t.id = l.id))
      UNION ALL
      SELECT 'operators', 'Operator', (SELECT count(*) FROM "operators"), (SELECT count(*) FROM "Operator"), (SELECT count(*) FROM "operators" l WHERE NOT EXISTS (SELECT 1 FROM "Operator" t WHERE t.id = l.id))
      UNION ALL
      SELECT 'ranges', 'Range', (SELECT count(*) FROM "ranges"), (SELECT count(*) FROM "Range"), (SELECT count(*) FROM "ranges" l WHERE NOT EXISTS (SELECT 1 FROM "Range" t WHERE t.id = l.id))
      UNION ALL
      SELECT 'numbers', 'Number', (SELECT count(*) FROM "numbers"), (SELECT count(*) FROM "Number"), (SELECT count(*) FROM "numbers" l WHERE NOT EXISTS (SELECT 1 FROM "Number" t WHERE t.id = l.id))
      UNION ALL
      SELECT 'incoming_messages', 'InboundMessage', (SELECT count(*) FROM "incoming_messages"), (SELECT count(*) FROM "InboundMessage"), (SELECT count(*) FROM "incoming_messages" l WHERE NOT EXISTS (SELECT 1 FROM "InboundMessage" t WHERE t.id = l.id))
      UNION ALL
      SELECT 'cdrs', 'Cdr', (SELECT count(*) FROM "cdrs"), (SELECT count(*) FROM "Cdr"), (SELECT count(*) FROM "cdrs" l WHERE NOT EXISTS (SELECT 1 FROM "Cdr" t WHERE t.id = l.id))
      UNION ALL
      SELECT 'wallets', 'Wallet', (SELECT count(*) FROM "wallets"), (SELECT count(*) FROM "Wallet"), (SELECT count(*) FROM "wallets" l WHERE NOT EXISTS (SELECT 1 FROM "Wallet" t WHERE t.id = l.id))
      UNION ALL
      SELECT 'transactions', 'BillingTransaction', (SELECT count(*) FROM "transactions"), (SELECT count(*) FROM "BillingTransaction"), (SELECT count(*) FROM "transactions" l WHERE NOT EXISTS (SELECT 1 FROM "BillingTransaction" t WHERE t.id = l.id))
      UNION ALL
      SELECT 'audit_logs', 'AuditLog', (SELECT count(*) FROM "audit_logs"), (SELECT count(*) FROM "AuditLog"), (SELECT count(*) FROM "audit_logs" l WHERE NOT EXISTS (SELECT 1 FROM "AuditLog" t WHERE t.id = l.id))
    `);
  });

  console.log('--- Step 2: User Parity (19 users) ---');
  output.userParity = await queryWithRetry(async (p) => {
    return await p.$queryRawUnsafe(`
      SELECT l.id, l.email, l."firstName", l."lastName", t.name as target_name,
        (t.name = TRIM(COALESCE(l."firstName", '') || ' ' || COALESCE(l."lastName", ''))) as name_match
      FROM "users" l
      JOIN "User" t ON t.id = l.id
      ORDER BY l."createdAt" ASC
    `);
  });

  console.log('--- Step 3: Provider & Credential Parity ---');
  output.providerParity = await queryWithRetry(async (p) => {
    return await p.$queryRawUnsafe(`
      SELECT p.id, p.name, p.status as legacy_status, tp.status as target_status,
             pc.protocol as legacy_protocol, tpc."connectionType" as target_conn_type
      FROM "providers" p
      JOIN "Provider" tp ON tp.id = p.id
      LEFT JOIN "provider_connections" pc ON pc."providerId" = p.id
      LEFT JOIN "ProviderConnection" tpc ON tpc."providerId" = p.id
    `);
  });

  output.credentialParity = await queryWithRetry(async (p) => {
    return await p.$queryRawUnsafe(`
      SELECT pc.id, pc."keyReference", cr."keyVersion",
             (cr.ciphertext IS NOT NULL) as has_ciphertext,
             (cr.ciphertext LIKE '%iv%') as has_iv,
             (cr.ciphertext LIKE '%data%') as has_data
      FROM "provider_credentials" pc
      JOIN "CredentialReference" cr ON cr.id = pc.id
    `);
  });

  console.log('--- Step 4: Ranges, Numbers, Assignments, Messages, CDRs ---');
  output.rangeParity = await queryWithRetry(async (p) => {
    return await p.$queryRawUnsafe(`
      SELECT r.id, r."startRange", t."startE164", r."endRange", t."endE164",
             t."startNum", t."endNum",
             (t."startE164" = r."startRange" AND t."endE164" = r."endRange") as e164_ok,
             (t."startNum" = SUBSTRING(r."startRange" FROM 2)::BIGINT) as start_num_ok,
             (t."endNum" = SUBSTRING(r."endRange" FROM 2)::BIGINT) as end_num_ok
      FROM "ranges" r
      JOIN "Range" t ON t.id = r.id
    `);
  });

  output.numberParity = await queryWithRetry(async (p) => {
    return await p.$queryRawUnsafe(`
      SELECT n.id, n."e164Number", t.e164,
             (n."e164Number" = t.e164) as e164_ok,
             (n."providerId" = t."providerId") as prov_ok,
             (n."countryId" = t."countryId") as ctry_ok,
             (n."operatorId" = t."operatorId") as op_ok,
             (n."rangeId" = t."rangeId") as rng_ok
      FROM "numbers" n
      JOIN "Number" t ON t.id = n.id
    `);
  });

  output.assignmentParity = await queryWithRetry(async (p) => {
    return await p.$queryRawUnsafe(`
      SELECT na.id, na."numberId", na.status as legacy_status,
             (aa.id IS NOT NULL) as in_active,
             (ah.id IS NOT NULL) as in_history
      FROM "number_assignments" na
      LEFT JOIN "ActiveAssignment" aa ON aa."numberId" = na."numberId"
      LEFT JOIN "AssignmentHistory" ah ON ah.id = na.id
    `);
  });

  output.messageParity = await queryWithRetry(async (p) => {
    return await p.$queryRawUnsafe(`
      SELECT im.id, im."messageRef", t."providerMessageId",
             (t."providerMessageId" = im."messageRef") as ref_ok,
             (t."fromNumber" = im."senderAddress") as from_ok,
             (t."toNumber" = im."destinationAddress") as to_ok
      FROM "incoming_messages" im
      JOIN "InboundMessage" t ON t.id = im.id
    `);
  });

  output.cdrParity = await queryWithRetry(async (p) => {
    return await p.$queryRawUnsafe(`
      SELECT c.id, tc.id as target_cdr_id, be.id as target_be_id,
             (tc.id IS NOT NULL) as cdr_ok,
             (be.id IS NOT NULL) as be_ok,
             (tc."billingEventId" = be.id) as link_ok
      FROM "cdrs" c
      LEFT JOIN "Cdr" tc ON tc.id = c.id
      LEFT JOIN "BillingEvent" be ON be.id = ('be-' || c.id)
    `);
  });

  console.log('--- Step 5: Financial Reconciliation ---');
  output.financial = await queryWithRetry(async (p) => {
    const wallets: any = await p.$queryRawUnsafe(`
      SELECT w.id, w.currency,
             w.balance::numeric as src_val,
             tw."balanceMicrounits"::bigint as tgt_mu,
             (tw."balanceMicrounits"::numeric / 1000000.0) as rev_val,
             (w.balance::numeric - (tw."balanceMicrounits"::numeric / 1000000.0)) as delta
      FROM "wallets" w
      JOIN "Wallet" tw ON tw.id = w.id
    `);

    const transactions: any = await p.$queryRawUnsafe(`
      SELECT t.id, t.currency,
             t.amount::numeric as src_val,
             bt."amountMicrounits"::bigint as tgt_mu,
             (bt."amountMicrounits"::numeric / 1000000.0) as rev_val,
             (t.amount::numeric - (bt."amountMicrounits"::numeric / 1000000.0)) as delta
      FROM "transactions" t
      JOIN "BillingTransaction" bt ON bt.id = t.id
    `);

    const cdrs: any = await p.$queryRawUnsafe(`
      SELECT c.id, c.currency,
             c."providerCost"::numeric as src_prov_cost,
             tc."providerCostMicrounits"::bigint as tgt_prov_cost_mu,
             (c."providerCost"::numeric - (tc."providerCostMicrounits"::numeric / 1000000.0)) as prov_cost_delta,
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
    `);

    const rates: any = await p.$queryRawUnsafe(`
      SELECT r.id, r.currency,
             r."costPerSms"::numeric as src_val,
             tr."amountMicrounits"::bigint as tgt_mu,
             (tr."amountMicrounits"::numeric / 1000000.0) as rev_val,
             (r."costPerSms"::numeric - (tr."amountMicrounits"::numeric / 1000000.0)) as delta
      FROM "rates" r
      JOIN "Rate" tr ON tr.id = r.id
    `);

    const clientPayouts: any = await p.$queryRawUnsafe(`
      SELECT cp.id, cp.currency,
             cp."payoutPerSms"::numeric as src_val,
             tr."amountMicrounits"::bigint as tgt_mu,
             (tr."amountMicrounits"::numeric / 1000000.0) as rev_val,
             (cp."payoutPerSms"::numeric - (tr."amountMicrounits"::numeric / 1000000.0)) as delta
      FROM "client_payouts" cp
      JOIN "Rate" tr ON tr.id = cp.id
    `);

    return { wallets, transactions, cdrs, rates, clientPayouts };
  });

  fs.writeFileSync('scripts/audit-results.json', JSON.stringify(output, null, 2), 'utf-8');
  console.log('SUCCESS: Written audit-results.json');
}

run()
  .catch((err) => {
    console.error('Audit suite failed:', err);
    process.exit(1);
  });
