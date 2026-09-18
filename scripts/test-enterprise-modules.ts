import http from 'http';
import { createExpressApp } from '../server/app';
import { env } from '../server/config/env';

function makeRequest(
  port: number,
  method: string,
  path: string,
  body?: Record<string, any>,
  token?: string
): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (body) {
      headers['Content-Length'] = Buffer.byteLength(postData).toString();
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let parsed: any = rawData;
          try {
            parsed = JSON.parse(rawData);
          } catch {
            // raw string
          }
          resolve({
            status: res.statusCode || 500,
            body: parsed,
            headers: res.headers,
          });
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(postData);
    }
    req.end();
  });
}

async function runEnterpriseSuite() {
  console.log('🚀 Starting Enterprise Modules Integration Suite (Providers, Numbers, Messages, CDR, Billing)...');

  const app = createExpressApp();
  const server = http.createServer(app);
  await new Promise<void>((res) => server.listen(0, '127.0.0.1', res));
  const address = server.address() as any;
  const testPort = address.port;

  let totalTests = 0;
  let passedTests = 0;

  function record(section: string, desc: string, success: boolean, info: string = '') {
    totalTests++;
    if (success) {
      passedTests++;
      console.log(`✅ PASS [${section}] ${desc} ${info ? '- ' + info : ''}`);
    } else {
      console.error(`❌ FAIL [${section}] ${desc} ${info ? '- ' + info : ''}`);
    }
  }

  try {
    // 1. Authenticate as Super Admin
    const loginRes = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: env.SEED_ADMIN_EMAIL,
      password: env.SEED_ADMIN_PASSWORD,
    });
    const token = loginRes.body.data?.token;
    record('AUTH', 'Super Admin Login', loginRes.status === 200 && !!token, `Status: ${loginRes.status}`);

    // 2. Providers
    console.log('\n--- 1. Testing Providers ---');
    const providersRes = await makeRequest(testPort, 'GET', '/api/providers', undefined, token);
    const providers = providersRes.body.data?.items;
    record('PROVIDERS', 'List Providers', providersRes.status === 200 && providers?.length >= 2, `Count: ${providers?.length}`);

    const testProvider = providers[0];
    const providerDetailRes = await makeRequest(testPort, 'GET', `/api/providers/${testProvider.id}`, undefined, token);
    record('PROVIDERS', 'Get Provider Detail', providerDetailRes.status === 200 && providerDetailRes.body.data?.provider?.id === testProvider.id, `Name: ${testProvider.name}`);

    const connTestRes = await makeRequest(testPort, 'POST', `/api/providers/${testProvider.id}/test-connection`, undefined, token);
    record('PROVIDERS', 'Test Provider Connection', connTestRes.status === 200 && connTestRes.body.data?.success === true, `Message: ${connTestRes.body.data?.message}`);

    // 3. Numbers & Hierarchy
    console.log('\n--- 2. Testing Numbers & Hierarchy ---');
    const countriesRes = await makeRequest(testPort, 'GET', '/api/numbers/countries', undefined, token);
    record('NUMBERS', 'List Countries', countriesRes.status === 200 && countriesRes.body.data?.countries?.length >= 3, `Count: ${countriesRes.body.data?.countries?.length}`);

    const operatorsRes = await makeRequest(testPort, 'GET', '/api/numbers/operators', undefined, token);
    record('NUMBERS', 'List Operators', operatorsRes.status === 200 && operatorsRes.body.data?.operators?.length >= 2, `Count: ${operatorsRes.body.data?.operators?.length}`);

    const numbersRes = await makeRequest(testPort, 'GET', '/api/numbers', undefined, token);
    const numbers = numbersRes.body.data?.items;
    record('NUMBERS', 'List Numbers Inventory', numbersRes.status === 200 && numbers?.length >= 3, `Count: ${numbers?.length}`);

    // Pick a number to test assignment lifecycle
    const targetNumber = numbers.find((n: any) => n.status === 'AVAILABLE') || numbers[0];

    // Get a client
    const clientsRes = await makeRequest(testPort, 'GET', '/api/clients', undefined, token);
    const testClient = clientsRes.body.data?.items?.[0];

    // Assign Number
    const assignRes = await makeRequest(testPort, 'POST', `/api/numbers/${targetNumber.id}/assign`, { clientId: testClient.id }, token);
    const isSuccessOrAssigned = assignRes.status === 200 || JSON.stringify(assignRes.body).includes('already assigned');
    record('NUMBERS', 'Assign Number to Client', isSuccessOrAssigned, `Status: ${assignRes.status}`);

    const historyRes = await makeRequest(testPort, 'GET', `/api/numbers/${targetNumber.id}/history`, undefined, token);
    record('NUMBERS', 'Get Number Assignment History', historyRes.status === 200 && Array.isArray(historyRes.body.data?.history), `Entries: ${historyRes.body.data?.history?.length}`);

    // 4. Inbound Messaging
    console.log('\n--- 3. Testing Inbound Messaging ---');
    const testMessageRef = `msg-test-${Date.now()}`;
    const inboundRes = await makeRequest(testPort, 'POST', '/api/messages/inbound', {
      providerId: targetNumber.provider?.id || testProvider.id,
      providerMessageId: testMessageRef,
      fromNumber: '+15551234567',
      toNumber: targetNumber.e164,
      body: 'Hello Enterprise Integration Test!',
    });
    record('MESSAGING', 'Ingest Inbound Message', inboundRes.status === 201 && inboundRes.body.data?.message?.id, `Message ID: ${inboundRes.body.data?.message?.id}`);

    // Idempotency test: send same messageRef again
    const dupRes = await makeRequest(testPort, 'POST', '/api/messages/inbound', {
      providerId: targetNumber.provider?.id || testProvider.id,
      providerMessageId: testMessageRef,
      fromNumber: '+15551234567',
      toNumber: targetNumber.e164,
      body: 'Hello Enterprise Integration Test!',
    });
    record('MESSAGING', 'Idempotent Duplicate Message Handling', dupRes.status === 201 && dupRes.body.data?.duplicate === true, `Duplicate detected: ${dupRes.body.data?.duplicate}`);

    const listMsgsRes = await makeRequest(testPort, 'GET', '/api/messages', undefined, token);
    record('MESSAGING', 'List Inbound Messages', listMsgsRes.status === 200 && listMsgsRes.body.data?.items?.length >= 1, `Total: ${listMsgsRes.body.data?.total}`);

    // 5. CDR Records
    console.log('\n--- 4. Testing CDR & Micro-Unit Accounting ---');
    const cdrsRes = await makeRequest(testPort, 'GET', '/api/cdr', undefined, token);
    const cdrs = cdrsRes.body.data?.items;
    record('CDR', 'List CDR Records', cdrsRes.status === 200 && cdrs?.length >= 1, `Count: ${cdrs?.length}`);

    const sampleCdr = cdrs?.[0];
    record(
      'CDR',
      'Verify CDR Micro-Unit Precision Breakdown',
      sampleCdr && Number(sampleCdr.providerCostMicrounits) > 0 && Number(sampleCdr.clientChargeMicrounits) > 0,
      `Provider: $${sampleCdr?.providerCostDecimal} (${sampleCdr?.providerCostMicrounits} µu), Client: $${sampleCdr?.clientChargeDecimal} (${sampleCdr?.clientChargeMicrounits} µu), Profit: $${sampleCdr?.platformProfitDecimal}`
    );

    const cdrSummaryRes = await makeRequest(testPort, 'GET', '/api/cdr/summary', undefined, token);
    record('CDR', 'Get CDR Aggregate Financial Summary', cdrSummaryRes.status === 200 && cdrSummaryRes.body.data?.summary?.totalRecords >= 1, `Total Records: ${cdrSummaryRes.body.data?.summary?.totalRecords}, Margin: ${cdrSummaryRes.body.data?.summary?.profitMarginPercentage}%`);

    // 6. Wallets, Rates & Ledger
    console.log('\n--- 5. Testing Wallets, Rates & Immutable Ledger ---');
    const walletsRes = await makeRequest(testPort, 'GET', '/api/billing/wallets', undefined, token);
    const wallets = walletsRes.body.data?.wallets;
    record('BILLING', 'List Multi-Party Wallets', walletsRes.status === 200 && wallets?.length >= 3, `Count: ${wallets?.length}`);

    const platformWallet = wallets?.find((w: any) => w.isPlatform);
    record('BILLING', 'Platform Master Treasury Wallet Exists', !!platformWallet, `ID: ${platformWallet?.id}, Balance: $${platformWallet?.balanceDecimal}`);

    const sampleWallet = wallets?.[0];
    const ledgerRes = await makeRequest(testPort, 'GET', `/api/billing/wallets/${sampleWallet.id}/ledger`, undefined, token);
    record('BILLING', 'Retrieve Wallet Immutable Ledger', ledgerRes.status === 200 && Array.isArray(ledgerRes.body.data?.ledger), `Ledger entries: ${ledgerRes.body.data?.ledger?.length}`);

    // Balance adjustment test
    const adjustRes = await makeRequest(testPort, 'POST', '/api/billing/wallets/adjust', {
      walletId: sampleWallet.id,
      amountDecimal: 50.0,
      type: 'CREDIT',
      description: 'Test Credit Deposit from automated suite',
    }, token);
    record('BILLING', 'Apply Manual Balance Adjustment with Ledger Entry', adjustRes.status === 200 && Number(adjustRes.body.data?.newBalanceDecimal) > 0, `New Balance: $${adjustRes.body.data?.newBalanceDecimal}`);

    console.log('\n======================================================');
    console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
    console.log('======================================================');

    if (totalTests !== passedTests) {
      throw new Error(`Suite failed with ${totalTests - passedTests} failure(s)`);
    }

    console.log('🎉 ALL ENTERPRISE MODULE TESTS PASSED WITH 100% SUCCESS!');
  } finally {
    server.close();
  }
}

runEnterpriseSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
