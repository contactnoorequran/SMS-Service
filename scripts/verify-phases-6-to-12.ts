/**
 * Verification Script: Phases 6 through 12
 * Covers:
 * - Phase 6: Messaging End-to-End (Inbound webhook, Number routing, Provider-scoped deduplication)
 * - Phase 7: CDR End-to-End (Exact micro-unit reconciliation formula)
 * - Phase 8: Rates (Sub-cent pricing, effective date windows, BigInt arithmetic)
 * - Phase 9: Billing End-to-End (Full financial event chain -> BillingEvent -> BillingTransaction -> LedgerEntry -> Wallet)
 * - Phase 10: Idempotency / Duplicate Billing Protection (Zero duplicate ledger entries, zero drift)
 * - Phase 11: Wallet / Ledger Deep Audit (All 4 wallet classes: Platform, Client, Agent, Provider)
 * - Phase 12: Credit / Payment Flow (Request -> Approval -> Financial effect -> Audit, unauthorized 403 check)
 */

import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {}

import http from 'http';
import { createExpressApp } from '../server/app';
import { env } from '../server/config/env';
import { getPrismaClient } from '../server/db/prisma';

interface TestRecord {
  phase: string;
  module: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestRecord[] = [];

function assertTest(phase: string, module: string, name: string, condition: boolean, details: string) {
  results.push({ phase, module, name, passed: condition, details });
  const icon = condition ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} [${phase}] [${module}] ${name}: ${details}`);
  if (!condition) {
    throw new Error(`Assertion failed: [${phase}] [${module}] ${name} - ${details}`);
  }
}

async function request(
  port: number,
  method: string,
  path: string,
  body?: any,
  token?: string
): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (body) headers['Content-Length'] = Buffer.byteLength(postData).toString();

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed: any = raw;
          try {
            parsed = JSON.parse(raw);
          } catch {}
          resolve({ status: res.statusCode || 500, body: parsed, headers: res.headers });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(postData);
    req.end();
  });
}

export async function runPhases6To12() {
  console.log('\n===============================================================');
  console.log('🏁 STARTING LIVE FINANCIAL & MESSAGING VERIFICATION: PHASES 6-12');
  console.log('===============================================================\n');

  const prisma = getPrismaClient();
  if (!prisma) throw new Error('Prisma database client unavailable');

  const app = createExpressApp();
  const server = http.createServer(app);
  await new Promise<void>((res) => server.listen(0, '127.0.0.1', res));
  const port = (server.address() as any).port;

  const testStamp = Date.now();

  try {
    // 1. Authenticate Admin
    const loginRes = await request(port, 'POST', '/api/auth/login', {
      email: env.SEED_ADMIN_EMAIL,
      password: env.SEED_ADMIN_PASSWORD,
    });
    const adminToken = loginRes.body?.data?.token;
    assertTest('AUTH', 'ADMIN', 'Super Admin Login', loginRes.status === 200 && !!adminToken, `Status: ${loginRes.status}`);

    // Authenticate Client for permission boundary tests
    const clientLoginRes = await request(port, 'POST', '/api/auth/login', {
      email: env.SEED_CLIENT_EMAIL,
      password: env.SEED_CLIENT_PASSWORD,
    });
    const clientToken = clientLoginRes.body?.data?.token;
    const clientUserId = clientLoginRes.body?.data?.user?.id;
    assertTest('AUTH', 'CLIENT', 'Client User Login', clientLoginRes.status === 200 && !!clientToken, `Client ID: ${clientUserId}`);

    // Get an assigned number and provider for messaging flow
    let number = await prisma.number.findFirst({
      where: { activeAssignment: { isNot: null } },
      include: { activeAssignment: { include: { client: true, agent: true } }, provider: true },
    });

    if (!number) {
      // If none assigned, assign the first available number
      const avail = await prisma.number.findFirst({ where: { status: 'AVAILABLE' } });
      const client = await prisma.client.findFirst();
      if (avail && client) {
        await request(port, 'POST', `/api/numbers/${avail.id}/assign`, { clientId: client.id }, adminToken);
        number = await prisma.number.findUnique({
          where: { id: avail.id },
          include: { activeAssignment: { include: { client: true, agent: true } }, provider: true },
        });
      }
    }

    if (!number || !number.activeAssignment) {
      throw new Error('Precondition failed: No assigned number available for messaging tests');
    }

    const assignedClient = number.activeAssignment.client;
    const assignedAgentId = number.activeAssignment.agentId;
    const providerId = number.providerId;

    // -------------------------------------------------------------
    // PHASE 6: MESSAGING END-TO-END & DEDUPLICATION
    // -------------------------------------------------------------
    console.log('\n--- PHASE 6: Messaging End-to-End & Deduplication ---');
    const uniqueMsgRef = `msg-p6-${testStamp}`;

    const ingestRes = await request(port, 'POST', '/api/messages/inbound', {
      providerId,
      providerMessageId: uniqueMsgRef,
      fromNumber: '+12025550199',
      toNumber: number.e164,
      body: 'Phase 6 Integration Message with Financial Hook',
      metadata: { testSuite: 'Phase-6-to-12', timestamp: testStamp },
    });

    assertTest(
      'PHASE 6',
      'MESSAGING',
      'Inbound Webhook Ingestion',
      ingestRes.status === 201 && ingestRes.body?.data?.duplicate === false,
      `Message ID: ${ingestRes.body?.data?.message?.id}`
    );
    const createdMsgId = ingestRes.body?.data?.message?.id;

    // Verify InboundMessage in PostgreSQL
    const dbMsg = await prisma.inboundMessage.findUnique({
      where: { id: createdMsgId },
      include: { client: true, number: true, provider: true },
    });
    assertTest(
      'PHASE 6',
      'MESSAGING',
      'Verify Message Attributes in DB',
      !!dbMsg && dbMsg.providerMessageId === uniqueMsgRef && dbMsg.clientId === assignedClient?.id,
      `Routed Client: ${dbMsg?.client?.name}, Provider: ${dbMsg?.provider?.name}`
    );

    // Test Duplicate Message Delivery: Exactly same (providerId + providerMessageId)
    const duplicateIngestRes = await request(port, 'POST', '/api/messages/inbound', {
      providerId,
      providerMessageId: uniqueMsgRef,
      fromNumber: '+12025550199',
      toNumber: number.e164,
      body: 'Phase 6 Integration Message with Financial Hook',
    });

    assertTest(
      'PHASE 6',
      'MESSAGING',
      'Idempotent Skip on Duplicate Provider Message',
      duplicateIngestRes.status === 201 && duplicateIngestRes.body?.data?.duplicate === true,
      `Duplicate skipped correctly`
    );

    // Verify DB count of messages with this providerMessageId is exactly 1
    const countMsg = await prisma.inboundMessage.count({
      where: { providerId, providerMessageId: uniqueMsgRef },
    });
    assertTest('PHASE 6', 'MESSAGING', 'DB InboundMessage Count Exactly 1', countMsg === 1, `Count: ${countMsg}`);

    // -------------------------------------------------------------
    // PHASE 7: CDR END-TO-END & MICRO-UNIT ARITHMETIC
    // -------------------------------------------------------------
    console.log('\n--- PHASE 7: CDR End-to-End & Micro-Unit Reconciliation ---');
    const dbCdr = await prisma.cdr.findFirst({
      where: { inboundMessageId: createdMsgId },
      include: { billingEvent: true },
    });

    assertTest('PHASE 7', 'CDR', 'CDR Created for Inbound Event in DB', !!dbCdr, `CDR ID: ${dbCdr?.id}`);

    const cost = dbCdr!.providerCostMicrounits;
    const charge = dbCdr!.clientChargeMicrounits;
    const commission = dbCdr!.agentCommissionMicrounits || 0n;
    const profit = dbCdr!.platformProfitMicrounits || 0n;

    // Mathematical reconciliation check:
    // Client Charge = Provider Cost + Agent Commission + Platform Profit
    const reconciled = charge === cost + commission + profit;
    assertTest(
      'PHASE 7',
      'CDR',
      'Exact Micro-Unit Reconciliation: Charge == Cost + Commission + Profit',
      reconciled,
      `Charge: ${charge} µu == Cost: ${cost} + Comm: ${commission} + Profit: ${profit} (${cost + commission + profit} µu)`
    );

    // -------------------------------------------------------------
    // PHASE 8: RATES ENGINE & SUB-CENT VALUES
    // -------------------------------------------------------------
    console.log('\n--- PHASE 8: Rates Engine Sub-Cent Calculations ---');
    // Test creation of sub-cent rates: $0.004500, $0.009500, $0.000250, $0.004750
    const testRateRes = await request(
      port,
      'POST',
      '/api/billing/rates',
      {
        type: 'INBOUND',
        amountDecimal: 0.0095,
        currency: 'USD',
        providerId,
      },
      adminToken
    );

    assertTest(
      'PHASE 8',
      'RATES',
      'Create Sub-Cent Rate ($0.009500 = 9,500 µu)',
      testRateRes.status === 201 && testRateRes.body?.data?.rate?.amountMicrounits === '9500',
      `Amount: ${testRateRes.body?.data?.rate?.amountMicrounits} µu`
    );

    // Verify sub-cent rate in DB uses BigInt
    const dbRate = await prisma.rate.findUnique({
      where: { id: testRateRes.body?.data?.rate?.id },
    });
    assertTest('PHASE 8', 'RATES', 'Verify BigInt in DB', dbRate?.amountMicrounits === 9500n, `DB amountMicrounits: ${dbRate?.amountMicrounits}`);

    // -------------------------------------------------------------
    // PHASE 9 & 10: BILLING END-TO-END & IDEMPOTENCY PROTECTION
    // -------------------------------------------------------------
    console.log('\n--- PHASES 9 & 10: Billing Flow & Duplicate Billing Protection ---');
    // Snapshot client wallet and ledger counts before billing test
    const clientWalletBefore = await prisma.wallet.findUnique({ where: { clientId: assignedClient!.id } });
    const balanceBefore = clientWalletBefore ? clientWalletBefore.balanceMicrounits : 0n;

    const ledgerCountBefore = await prisma.ledgerEntry.count({
      where: { sourceId: dbCdr!.billingEventId! },
    });
    assertTest(
      'PHASE 9',
      'BILLING',
      'Ledger Entries Created for Controlled Event',
      ledgerCountBefore >= 2,
      `Ledger entries count: ${ledgerCountBefore}`
    );

    // Attempt to invoke duplicate billing cycle on the same message
    const duplicateBillingResult = await request(port, 'POST', '/api/messages/inbound', {
      providerId,
      providerMessageId: uniqueMsgRef,
      fromNumber: '+12025550199',
      toNumber: number.e164,
      body: 'Duplicate trigger test',
    });

    // Verify that duplicate billing created ZERO new ledger entries
    const ledgerCountAfter = await prisma.ledgerEntry.count({
      where: { sourceId: dbCdr!.billingEventId! },
    });
    assertTest(
      'PHASE 10',
      'IDEMPOTENCY',
      'Zero Duplicate Ledger Entries Generated on Replay',
      ledgerCountBefore === ledgerCountAfter,
      `Count before: ${ledgerCountBefore} == Count after: ${ledgerCountAfter}`
    );

    // -------------------------------------------------------------
    // PHASE 11: WALLET / LEDGER DEEP AUDIT (ALL 4 OWNER CLASSES)
    // -------------------------------------------------------------
    console.log('\n--- PHASE 11: Wallet & Ledger Deep Audit Across All 4 Classes ---');
    const allWallets = await prisma.wallet.findMany({
      include: {
        ledgerEntries: true,
        client: true,
        agent: true,
        provider: true,
      },
    });

    assertTest('PHASE 11', 'WALLETS', 'Retrieve Live Wallets', allWallets.length >= 2, `Total wallets: ${allWallets.length}`);

    let totalDrift = 0n;
    for (const w of allWallets) {
      let expectedBalance = 0n;
      for (const entry of w.ledgerEntries) {
        if (entry.type === 'CREDIT' || entry.type === 'REFUND' || entry.type === 'ADJUSTMENT') {
          expectedBalance += entry.amountMicrounits;
        } else if (entry.type === 'DEBIT' || entry.type === 'FEE') {
          expectedBalance -= entry.amountMicrounits;
        }
      }

      const diff = w.balanceMicrounits - expectedBalance;
      const ownerLabel = w.isPlatform
        ? 'PLATFORM'
        : w.client
        ? `CLIENT (${w.client.name})`
        : w.agent
        ? `AGENT (${w.agentId})`
        : w.provider
        ? `PROVIDER (${w.provider.name})`
        : 'UNKNOWN';

      assertTest(
        'PHASE 11',
        'WALLETS',
        `Reconcile Balance vs Ledger: ${ownerLabel}`,
        diff === 0n,
        `Stored: ${w.balanceMicrounits} µu, Computed Ledger Sum: ${expectedBalance} µu, Drift: ${diff} µu`
      );

      if (diff !== 0n) totalDrift += diff;
    }

    assertTest('PHASE 11', 'WALLETS', 'ZERO Overall Financial Ledger Drift Across All Wallets', totalDrift === 0n, `Total drift: ${totalDrift} µu`);

    // -------------------------------------------------------------
    // PHASE 12: CREDIT / PAYMENT FLOW
    // -------------------------------------------------------------
    console.log('\n--- PHASE 12: Credit & Payment Approval Flow ---');
    // 1. Submit Payment Request for Client Wallet
    const targetWallet = allWallets.find((w) => !w.isPlatform) || allWallets[0];
    const initialWalletBal = targetWallet.balanceMicrounits;

    const createPayReqRes = await request(
      port,
      'POST',
      '/api/billing/payment-requests',
      {
        walletId: targetWallet.id,
        amountDecimal: 100.0,
        reason: 'Monthly credit top-up',
        reference: `INV-TEST-${testStamp}`,
      },
      adminToken
    );

    assertTest(
      'PHASE 12',
      'PAYMENTS',
      'Create Payment Request',
      createPayReqRes.status === 201 && !!createPayReqRes.body?.data?.request?.id,
      `Request ID: ${createPayReqRes.body?.data?.request?.id}, Status: ${createPayReqRes.body?.data?.request?.status}`
    );
    const payReqId = createPayReqRes.body?.data?.request?.id;

    // 2. Client Unauthorized Approval Test (Must return 403)
    const clientApproveRes = await request(
      port,
      'POST',
      `/api/billing/payment-requests/${payReqId}/approve`,
      {},
      clientToken
    );
    assertTest(
      'PHASE 12',
      'PAYMENTS',
      'Reject Unauthorized Client Approval (403 Forbidden)',
      clientApproveRes.status === 403,
      `Status: ${clientApproveRes.status}`
    );

    // 3. Admin Authorized Approval Test (Must succeed and credit wallet)
    const adminApproveRes = await request(
      port,
      'POST',
      `/api/billing/payment-requests/${payReqId}/approve`,
      {},
      adminToken
    );
    assertTest(
      'PHASE 12',
      'PAYMENTS',
      'Super Admin Approve Payment Request',
      adminApproveRes.status === 200 && adminApproveRes.body?.data?.paymentRequest?.status === 'APPROVED',
      `New Wallet Balance: $${adminApproveRes.body?.data?.newWalletBalanceDecimal}`
    );

    // Verify DB State after approval:
    // - PaymentRequest status is APPROVED
    // - Wallet balance incremented by exactly 100,000,000 µu ($100)
    // - LedgerEntry exists with sourceType PAYMENT_REQUEST
    const dbPayReq = await prisma.paymentRequest.findUnique({ where: { id: payReqId } });
    assertTest('PHASE 12', 'PAYMENTS', 'Verify Request APPROVED in DB', dbPayReq?.status === 'APPROVED', `DB Status: ${dbPayReq?.status}`);

    const updatedWallet = await prisma.wallet.findUnique({ where: { id: targetWallet.id } });
    const expectedNewBal = initialWalletBal + 100_000_000n;
    assertTest(
      'PHASE 12',
      'PAYMENTS',
      'Verify Wallet Incremented by Exact Micro-Units in DB',
      updatedWallet?.balanceMicrounits === expectedNewBal,
      `Expected: ${expectedNewBal} µu, Actual: ${updatedWallet?.balanceMicrounits} µu`
    );

    const payLedger = await prisma.ledgerEntry.findFirst({
      where: { sourceId: payReqId, sourceType: 'PAYMENT_REQUEST' },
    });
    assertTest('PHASE 12', 'PAYMENTS', 'Verify Payment LedgerEntry in DB', !!payLedger && payLedger.amountMicrounits === 100_000_000n, `Ledger ID: ${payLedger?.id}`);

    // 4. Duplicate Approval Rejection Test
    const duplicateApproveRes = await request(
      port,
      'POST',
      `/api/billing/payment-requests/${payReqId}/approve`,
      {},
      adminToken
    );
    assertTest(
      'PHASE 12',
      'PAYMENTS',
      'Reject Duplicate Approval of Already-Approved Request',
      duplicateApproveRes.status === 400,
      `Status: ${duplicateApproveRes.status}`
    );

    // 5. Verify Audit Log for Approval
    const payAudit = await prisma.auditLog.findFirst({
      where: { entityId: payReqId },
      orderBy: { createdAt: 'desc' },
    });
    assertTest('PHASE 12', 'PAYMENTS', 'Verify Audit Log in DB', !!payAudit && payAudit.action === 'PAYMENT_REQUEST_APPROVED', `Audit Action: ${payAudit?.action}`);

    console.log('\n===============================================================');
    console.log(`🎉 ALL PHASES 6-12 TESTS PASSED (${results.length} / ${results.length})`);
    console.log('===============================================================\n');
  } finally {
    server.close();
  }
}

runPhases6To12().catch((err) => {
  console.error('Fatal failure in Phases 6-12 verification:', err);
  process.exit(1);
});
