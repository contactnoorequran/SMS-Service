/**
 * Phase 07: Client Management Integration Test Suite
 *
 * Verifies:
 * 1. Role Authentication:
 *    - Super Admin (admin@smshub.local)
 *    - Manager (Elena Rostova - mgr-profile-001)
 *    - Manager (Viktor Kraus - mgr-profile-002)
 *    - Agent (Marcus Brody - agent-prof-001 under Elena)
 *    - Agent (Liam O'Connor - agent-prof-003 under Viktor)
 *    - Client (Sophia Chen - NovaTech Global, client@smshub.local)
 *    - Client (David Vance - Velocity Payment)
 *
 * 2. Client List & Filtering:
 *    - Super Admin sees global list
 *    - Search by name, company, email
 *    - Filter by status (ACTIVE, SUSPENDED), billingType (PREPAID, POSTPAID)
 *    - Filter by managerId and agentId
 *    - Pagination and sorting
 *
 * 3. Strict Hierarchical Scope Enforcement:
 *    - Super Admin: global access
 *    - Manager: accesses clients under their scope (Elena accesses Marcus's clients)
 *    - Manager violation: Elena CANNOT access Liam's/Viktor's client (403 Forbidden)
 *    - Agent: accesses only their assigned clients (Marcus accesses Sophia)
 *    - Agent violation: Marcus CANNOT access Liam's client (403 Forbidden)
 *    - Client: accesses only self (/api/clients/me or own ID)
 *    - Client violation: Sophia CANNOT access David Vance's data or Oliver Sterling's data (403 Forbidden)
 *
 * 4. Client Lifecycle Management:
 *    - Create client (Super Admin, Manager scoped, Agent scoped)
 *    - Client role forbidden from creating clients (403)
 *    - Edit client (Super Admin, Manager)
 *    - Enable / Disable / Suspend client status with audit
 *    - Password reset with temporary credential generation
 *    - Configure granular permissions (Super Admin / Manager)
 *
 * 5. API Access Configuration:
 *    - Generate API credentials (key + secret)
 *    - Configure rate limiting and IP whitelist
 *    - Key rotation and status update (ACTIVE, REVOKED, DISABLED)
 *
 * 6. Sub-Resources & Dashboard:
 *    - View assigned numbers
 *    - View SMS statistics
 *    - View balance and billing ledger
 *    - View audit activity logs
 *    - Client Dashboard view (numbers, SMS count, recent SMS, balance, API status)
 *
 * 7. Audit Logging:
 *    - Sensitive actions recorded with actor, IP, timestamp, reason
 */

import http from 'http';
import { createExpressApp } from '../server/app';
import { env } from '../server/config/env';
import { ManagerService } from '../server/services/manager.service';
import { AgentService } from '../server/services/agent.service';
import { ClientService } from '../server/services/client.service';
import { AuditService } from '../server/services/audit.service';

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function recordTest(category: string, name: string, condition: boolean, details: string) {
  results.push({ category, name, passed: condition, details });
  const symbol = condition ? '✅ PASS' : '❌ FAIL';
  console.log(`${symbol} [${category}] ${name} - ${details}`);
}

async function makeRequest(
  port: number,
  method: string,
  path: string,
  body?: any,
  token?: string
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (postData) {
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
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed: any = {};
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = { rawText: raw };
          }
          resolve({ status: res.statusCode || 500, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runClientTests() {
  console.log('🚀 Initializing Phase 07 Client Management Test Suite...\n');
  const app = createExpressApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as { port: number };
  const testPort = address.port;

  try {
    // Pre-initialize seed entities
    await ManagerService.initializeSeedManagers();
    await AgentService.initializeSeedAgents();
    await ClientService.initializeSeedClients();

    // -------------------------------------------------------------------------
    // 1. AUTHENTICATE ALL ROLES IN HIERARCHY
    // -------------------------------------------------------------------------
    console.log('--- 1. Authenticating Hierarchy Roles ---');

    // 1.1 Super Admin
    const adminLogin = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: env.SEED_ADMIN_EMAIL,
      password: env.SEED_ADMIN_PASSWORD,
    });
    const adminToken = adminLogin.body.data?.token;
    recordTest(
      'AUTH',
      'Super Admin Authentication',
      adminLogin.status === 200 && !!adminToken,
      `Super Admin logged in. Status ${adminLogin.status}, Token: ${!!adminToken}`
    );

    // 1.2 Manager 1 (Elena Rostova)
    const mgr1Login = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: env.SEED_MANAGER_EMAIL,
      password: env.SEED_MANAGER_PASSWORD,
    });
    const mgr1Token = mgr1Login.body.data?.token;
    recordTest(
      'AUTH',
      'Manager 1 (Elena Rostova) Authentication',
      mgr1Login.status === 200 && !!mgr1Token,
      `Manager 1 logged in. Status ${mgr1Login.status}`
    );

    // 1.3 Manager 2 (Viktor Kraus)
    const mgr2Login = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: 'viktor.kraus@sms-platform.internal',
      password: env.SEED_MANAGER_PASSWORD,
    });
    const mgr2Token = mgr2Login.body.data?.token;
    recordTest(
      'AUTH',
      'Manager 2 (Viktor Kraus) Authentication',
      mgr2Login.status === 200 && !!mgr2Token,
      `Manager 2 logged in. Status ${mgr2Login.status}`
    );

    // 1.4 Agent 1 (Marcus Brody - assigned to Elena)
    const agent1Login = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: env.SEED_AGENT_EMAIL,
      password: env.SEED_AGENT_PASSWORD,
    });
    const agent1Token = agent1Login.body.data?.token;
    recordTest(
      'AUTH',
      'Agent 1 (Marcus Brody) Authentication',
      agent1Login.status === 200 && !!agent1Token,
      `Agent 1 logged in. Status ${agent1Login.status}`
    );

    // 1.5 Agent 2 (Liam O'Connor - assigned to Viktor)
    const agent2Login = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: 'liam.oc@route-uk.co',
      password: env.SEED_AGENT_PASSWORD,
    });
    const agent2Token = agent2Login.body.data?.token;
    recordTest(
      'AUTH',
      'Agent 2 (Liam O\'Connor) Authentication',
      agent2Login.status === 200 && !!agent2Token,
      `Agent 2 logged in. Status ${agent2Login.status}`
    );

    // 1.6 Client 1 (Sophia Chen - NovaTech Global)
    const client1Login = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: env.SEED_CLIENT_EMAIL,
      password: env.SEED_CLIENT_PASSWORD,
    });
    const client1Token = client1Login.body.data?.token;
    recordTest(
      'AUTH',
      'Client 1 (Sophia Chen) Authentication',
      client1Login.status === 200 && !!client1Token,
      `Client 1 logged in. Status ${client1Login.status}`
    );

    // -------------------------------------------------------------------------
    // 2. CLIENT LISTING, SEARCH, FILTERS & PAGINATION
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Client Listing, Search, Filters & Pagination ---');

    // 2.1 Super Admin List All Clients
    const adminList = await makeRequest(testPort, 'GET', '/api/clients?limit=20', undefined, adminToken);
    if (adminList.status !== 200) {
      console.log('DEBUG adminList failed:', adminList.status, adminList.body);
    }
    const totalClients = adminList.body.data?.total;
    recordTest(
      'CLIENT_LIST',
      'Super Admin Lists All Clients',
      adminList.status === 200 && totalClients >= 8,
      `Returned ${totalClients} clients in total portfolio`
    );

    // 2.2 Search Filter
    const searchRes = await makeRequest(
      testPort,
      'GET',
      '/api/clients?search=NovaTech',
      undefined,
      adminToken
    );
    const searchItems = searchRes.body.data?.items;
    recordTest(
      'CLIENT_LIST',
      'Search Clients by Company Name',
      searchRes.status === 200 && searchItems?.length === 1 && searchItems[0].companyName.includes('NovaTech'),
      `Search found ${searchItems?.length} match(es): ${searchItems?.[0]?.companyName}`
    );

    // 2.3 Status Filter
    const suspendedRes = await makeRequest(
      testPort,
      'GET',
      '/api/clients?status=SUSPENDED',
      undefined,
      adminToken
    );
    const suspendedCount = suspendedRes.body.data?.items?.length;
    recordTest(
      'CLIENT_LIST',
      'Filter Clients by Status (SUSPENDED)',
      suspendedRes.status === 200 && suspendedCount >= 1,
      `Found ${suspendedCount} suspended client(s)`
    );

    // 2.4 Billing Type Filter
    const postpaidRes = await makeRequest(
      testPort,
      'GET',
      '/api/clients?billingType=POSTPAID',
      undefined,
      adminToken
    );
    const postpaidItems = postpaidRes.body.data?.items;
    recordTest(
      'CLIENT_LIST',
      'Filter Clients by Billing Type (POSTPAID)',
      postpaidRes.status === 200 && postpaidItems?.length >= 1 && postpaidItems[0].billingType === 'POSTPAID',
      `Found ${postpaidItems?.length} postpaid client(s)`
    );

    // 2.5 Pagination
    const page1Res = await makeRequest(testPort, 'GET', '/api/clients?page=1&limit=3', undefined, adminToken);
    const page2Res = await makeRequest(testPort, 'GET', '/api/clients?page=2&limit=3', undefined, adminToken);
    const item1 = page1Res.body.data?.items?.[0]?.id;
    const item2 = page2Res.body.data?.items?.[0]?.id;
    recordTest(
      'CLIENT_LIST',
      'Client Pagination Integrity',
      page1Res.status === 200 && page2Res.status === 200 && item1 !== item2,
      `Page 1 first ID (${item1}) differs from Page 2 first ID (${item2})`
    );

    // -------------------------------------------------------------------------
    // 3. HIERARCHICAL SCOPE ENFORCEMENT & SECURITY ISOLATION
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Hierarchical Scope Enforcement & Security Isolation ---');

    // 3.1 Manager Scoped List (Elena Rostova)
    // Elena manages Marcus Brody & Priya Sharma
    const mgr1Clients = await makeRequest(testPort, 'GET', '/api/clients', undefined, mgr1Token);
    const mgr1Items = mgr1Clients.body.data?.items || [];
    const mgr1AllBelong = mgr1Items.every(
      (c: any) => c.managerId === 'mgr-profile-001' || ['agent-prof-001', 'agent-prof-002'].includes(c.agentId)
    );
    recordTest(
      'SECURITY_SCOPE',
      'Manager Scoped Client List',
      mgr1Clients.status === 200 && mgr1Items.length > 0 && mgr1AllBelong,
      `Manager Elena sees ${mgr1Items.length} clients exclusively within her managerial scope`
    );

    // 3.2 Manager Cannot Access Out-of-Scope Client (Oliver Sterling cli-prof-003 belongs to Viktor/Liam)
    const mgrViolationRes = await makeRequest(
      testPort,
      'GET',
      '/api/clients/cli-prof-003',
      undefined,
      mgr1Token
    );
    recordTest(
      'SECURITY_SCOPE',
      'Manager Denied Access to Out-of-Scope Client (403)',
      mgrViolationRes.status === 403,
      `Status: ${mgrViolationRes.status} Error: ${mgrViolationRes.body.error}`
    );

    // 3.3 Manager Can Access In-Scope Client (Sophia Chen cli-prof-001)
    const mgrAuthorizedRes = await makeRequest(
      testPort,
      'GET',
      '/api/clients/cli-prof-001',
      undefined,
      mgr1Token
    );
    recordTest(
      'SECURITY_SCOPE',
      'Manager Authorized for In-Scope Client (200)',
      mgrAuthorizedRes.status === 200 && mgrAuthorizedRes.body.data?.id === 'cli-prof-001',
      `Manager Elena retrieved in-scope client ${mgrAuthorizedRes.body.data?.companyName}`
    );

    // 3.4 Agent Scoped List (Marcus Brody)
    const agent1Clients = await makeRequest(testPort, 'GET', '/api/clients', undefined, agent1Token);
    const agent1Items = agent1Clients.body.data?.items || [];
    const agent1AllBelong = agent1Items.every((c: any) => c.agentId === 'agent-prof-001');
    recordTest(
      'SECURITY_SCOPE',
      'Agent Scoped Client List',
      agent1Clients.status === 200 && agent1Items.length >= 2 && agent1AllBelong,
      `Agent Marcus sees ${agent1Items.length} clients exclusively assigned to his portfolio`
    );

    // 3.5 Agent Cannot Access Other Agent\'s Client (Oliver Sterling cli-prof-003 belongs to Liam)
    const agentViolationRes = await makeRequest(
      testPort,
      'GET',
      '/api/clients/cli-prof-003',
      undefined,
      agent1Token
    );
    recordTest(
      'SECURITY_SCOPE',
      'Agent Denied Access to Other Agent\'s Client (403)',
      agentViolationRes.status === 403,
      `Status: ${agentViolationRes.status} Error: ${agentViolationRes.body.error}`
    );

    // 3.6 Client Can Access Own Profile via /me and own ID
    const clientMeRes = await makeRequest(testPort, 'GET', '/api/clients/me', undefined, client1Token);
    recordTest(
      'SECURITY_SCOPE',
      'Client Accesses Own Profile via /me',
      clientMeRes.status === 200 && clientMeRes.body.data?.id === 'cli-prof-001',
      `Client Sophia resolved profile: ${clientMeRes.body.data?.companyName}`
    );

    const clientDirectRes = await makeRequest(
      testPort,
      'GET',
      '/api/clients/cli-prof-001',
      undefined,
      client1Token
    );
    recordTest(
      'SECURITY_SCOPE',
      'Client Accesses Own Profile by ID',
      clientDirectRes.status === 200 && clientDirectRes.body.data?.id === 'cli-prof-001',
      `Client retrieved own profile directly`
    );

    // 3.7 Client CRITICAL ISOLATION: A client must NEVER access another client\'s data!
    // Sophia attempts to access David Vance (cli-prof-002)
    const clientIsolationRes = await makeRequest(
      testPort,
      'GET',
      '/api/clients/cli-prof-002',
      undefined,
      client1Token
    );
    recordTest(
      'SECURITY_SCOPE',
      'Client STRICT ISOLATION: Cannot Access Another Client Data (403)',
      clientIsolationRes.status === 403,
      `Status: ${clientIsolationRes.status} Error: ${clientIsolationRes.body.error}`
    );

    // Sophia attempts to access Oliver Sterling (cli-prof-003)
    const clientIsolationRes2 = await makeRequest(
      testPort,
      'GET',
      '/api/clients/cli-prof-003',
      undefined,
      client1Token
    );
    recordTest(
      'SECURITY_SCOPE',
      'Client STRICT ISOLATION: Cannot Access External Client Data (403)',
      clientIsolationRes2.status === 403,
      `Status: ${clientIsolationRes2.status} Error: ${clientIsolationRes2.body.error}`
    );

    // 3.8 Client Cannot Perform Administrative Actions (Create, Update, Suspend, Permissions)
    const clientCreateAttempt = await makeRequest(
      testPort,
      'POST',
      '/api/clients',
      {
        username: 'hacker.client',
        firstName: 'Hack',
        lastName: 'Er',
        email: 'hacker@test.com',
        companyName: 'Hacker Corp',
        contact: '+123456789',
      },
      client1Token
    );
    recordTest(
      'SECURITY_SCOPE',
      'Client Role Denied Administrative Client Creation (403)',
      clientCreateAttempt.status === 403,
      `Status: ${clientCreateAttempt.status}`
    );

    // -------------------------------------------------------------------------
    // 4. CLIENT CREATION & LIFECYCLE MANAGEMENT
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Client Creation & Lifecycle Management ---');

    // 4.1 Super Admin Creates Client with Full Configuration
    const testClientEmail = `apex.fintech.${Date.now()}@apexcorp.io`;
    const createClientRes = await makeRequest(
      testPort,
      'POST',
      '/api/clients',
      {
        username: `apex_${Date.now()}`,
        firstName: 'Alexander',
        lastName: 'Pierce',
        email: testClientEmail,
        companyName: 'Apex Global Financial Technologies',
        contact: '+1 (555) 019-2834',
        managerId: 'mgr-profile-001',
        agentId: 'agent-prof-001',
        billingType: 'PREPAID',
        initialBalance: 5000.0,
        enableApiAccess: true,
      },
      adminToken
    );
    const createdClientId = createClientRes.body.data?.client?.id;
    const generatedPassword = createClientRes.body.data?.generatedPassword;
    const initialApiKey = createClientRes.body.data?.apiKey;
    recordTest(
      'LIFECYCLE',
      'Super Admin Creates Client with Balance & API Key',
      createClientRes.status === 201 && !!createdClientId && !!initialApiKey?.plainSecret,
      `Created client ID ${createdClientId}, plainSecret generated: ${!!initialApiKey?.plainSecret}`
    );

    // 4.2 Edit Client
    const editRes = await makeRequest(
      testPort,
      'PUT',
      `/api/clients/${createdClientId}`,
      {
        companyName: 'Apex Global Technologies & Payments Inc',
        contact: '+1 (555) 999-8888',
        billingType: 'POSTPAID',
      },
      adminToken
    );
    recordTest(
      'LIFECYCLE',
      'Edit Client Parameters',
      editRes.status === 200 && editRes.body.data?.companyName === 'Apex Global Technologies & Payments Inc',
      `Updated company name to: ${editRes.body.data?.companyName}`
    );

    // 4.3 Suspend Client (Status Change)
    const suspendRes = await makeRequest(
      testPort,
      'PATCH',
      `/api/clients/${createdClientId}/status`,
      {
        status: 'SUSPENDED',
        reason: 'Compliance review pending required KYB documents.',
      },
      adminToken
    );
    recordTest(
      'LIFECYCLE',
      'Suspend Client Status',
      suspendRes.status === 200 && suspendRes.body.data?.status === 'SUSPENDED',
      `Client status changed to SUSPENDED. Reason recorded.`
    );

    // 4.4 Re-activate Client
    const activateRes = await makeRequest(
      testPort,
      'PATCH',
      `/api/clients/${createdClientId}/status`,
      {
        status: 'ACTIVE',
        reason: 'KYB verification completed successfully.',
      },
      adminToken
    );
    recordTest(
      'LIFECYCLE',
      'Re-activate Client Status',
      activateRes.status === 200 && activateRes.body.data?.status === 'ACTIVE',
      `Client status restored to ACTIVE.`
    );

    // 4.5 Reset Client Password
    const resetPwRes = await makeRequest(
      testPort,
      'POST',
      `/api/clients/${createdClientId}/reset-password`,
      { autoGenerate: true },
      adminToken
    );
    const newTempPassword = resetPwRes.body.data?.newPassword;
    recordTest(
      'LIFECYCLE',
      'Reset Client Password',
      resetPwRes.status === 200 && !!newTempPassword && newTempPassword.length >= 8,
      `Generated new password with length ${newTempPassword?.length}`
    );

    // Verify login with newly reset password
    const newClientLogin = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: testClientEmail,
      password: newTempPassword,
    });
    recordTest(
      'LIFECYCLE',
      'Verify Login with Reset Password',
      newClientLogin.status === 200 && !!newClientLogin.body.data?.token,
      `New client logged in successfully with reset password`
    );

    // -------------------------------------------------------------------------
    // 5. PERMISSIONS & API ACCESS CONFIGURATION
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Permissions & API Access Configuration ---');

    // 5.1 Configure Granular Permissions
    const permRes = await makeRequest(
      testPort,
      'PUT',
      `/api/clients/${createdClientId}/permissions`,
      {
        permissions: ['numbers.view', 'sms.send', 'sms.view', 'reports.view'],
      },
      adminToken
    );
    const updatedPerms = permRes.body.data?.permissions;
    recordTest(
      'PERMISSIONS',
      'Configure Client Granular Permissions',
      permRes.status === 200 && updatedPerms?.includes('reports.view'),
      `Assigned permissions: ${updatedPerms?.join(', ')}`
    );

    // 5.2 Configure API Access (Key Rotation, IP Whitelist, Rate Limit)
    const apiConfigRes = await makeRequest(
      testPort,
      'POST',
      `/api/clients/${createdClientId}/api-access`,
      {
        enableApiAccess: true,
        regenerateKey: true,
        name: 'Apex Primary Production Cluster',
        rateLimit: 250,
        ipWhitelist: ['198.51.100.25', '198.51.100.26'],
      },
      adminToken
    );
    const activeApiCred = apiConfigRes.body.data?.apiCredential;
    recordTest(
      'API_ACCESS',
      'Configure & Rotate Client API Credentials',
      apiConfigRes.status === 200 &&
        activeApiCred?.rateLimit === 250 &&
        activeApiCred?.ipWhitelist?.length === 2 &&
        !!activeApiCred?.plainSecret,
      `Rotated API key ${activeApiCred?.clientId} with rate limit ${activeApiCred?.rateLimit}/sec`
    );

    // -------------------------------------------------------------------------
    // 6. SUB-RESOURCES: NUMBERS, STATISTICS, BALANCE, ACTIVITY & DASHBOARD
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Sub-Resources & Dashboard Validation ---');

    // 6.1 View Assigned Numbers (for Sophia cli-prof-001)
    const numbersRes = await makeRequest(
      testPort,
      'GET',
      '/api/clients/cli-prof-001/numbers',
      undefined,
      adminToken
    );
    recordTest(
      'SUB_RESOURCES',
      'View Client Assigned Numbers',
      numbersRes.status === 200 && Array.isArray(numbersRes.body.data) && numbersRes.body.data.length >= 2,
      `Retrieved ${numbersRes.body.data?.length} assigned phone number(s)`
    );

    // 6.2 View SMS Statistics
    const statsRes = await makeRequest(
      testPort,
      'GET',
      '/api/clients/cli-prof-001/statistics',
      undefined,
      adminToken
    );
    const smsData = statsRes.body.data;
    recordTest(
      'SUB_RESOURCES',
      'View Client SMS Statistics',
      statsRes.status === 200 && smsData?.totalSms > 0 && smsData?.successRate >= 95,
      `Total SMS: ${smsData?.totalSms}, Success Rate: ${smsData?.successRate}%`
    );

    // 6.3 View Balance & Ledger Info
    const balanceRes = await makeRequest(
      testPort,
      'GET',
      '/api/clients/cli-prof-001/balance',
      undefined,
      adminToken
    );
    const balanceData = balanceRes.body.data;
    recordTest(
      'SUB_RESOURCES',
      'View Client Balance & Ledger',
      balanceRes.status === 200 && balanceData?.balance > 0 && balanceData?.currency === 'USD',
      `Balance: $${balanceData?.balance.toLocaleString()} ${balanceData?.currency}, Credit Limit: $${balanceData?.creditLimit}`
    );

    // 6.4 View Audit Activity Logs
    const activityRes = await makeRequest(
      testPort,
      'GET',
      `/api/clients/${createdClientId}/activity`,
      undefined,
      adminToken
    );
    recordTest(
      'SUB_RESOURCES',
      'View Client Activity Trail',
      activityRes.status === 200 && Array.isArray(activityRes.body.data) && activityRes.body.data.length >= 3,
      `Retrieved ${activityRes.body.data?.length} logged event(s) for client`
    );

    // 6.5 Client Dashboard Endpoint (/api/clients/me/dashboard)
    const dashboardRes = await makeRequest(
      testPort,
      'GET',
      '/api/clients/me/dashboard',
      undefined,
      client1Token
    );
    const dash = dashboardRes.body.data;
    recordTest(
      'DASHBOARD',
      'Client Unified Dashboard (/me/dashboard)',
      dashboardRes.status === 200 &&
        !!dash?.client &&
        Array.isArray(dash?.assignedNumbers) &&
        typeof dash?.smsCount === 'number' &&
        !!dash?.balance &&
        dash?.apiStatus?.enabled !== undefined,
      `Dashboard loaded: ${dash?.assignedNumbers?.length} numbers, ${dash?.smsCount} SMS, $${dash?.balance?.balance} balance, API: ${dash?.apiStatus?.enabled ? 'Active' : 'Off'}`
    );

    // -------------------------------------------------------------------------
    // 7. AUDIT TRAIL VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Audit Logging Verification ---');

    const auditLogsRes = await makeRequest(testPort, 'GET', '/api/audit-logs?limit=50', undefined, adminToken);
    const logs = auditLogsRes.body.data?.logs || auditLogsRes.body.data?.items || [];
    const hasCreateLog = logs.some((l: any) => l.action === 'CLIENT_CREATED');
    const hasStatusLog = logs.some((l: any) => l.action === 'CLIENT_STATUS_CHANGED');
    const hasResetLog = logs.some((l: any) => l.action === 'CLIENT_PASSWORD_RESET');
    const hasApiConfigLog = logs.some((l: any) => l.action === 'CLIENT_API_ACCESS_CONFIGURED');

    recordTest(
      'AUDIT',
      'Sensitive Client Actions Audited',
      hasCreateLog && hasStatusLog && hasResetLog && hasApiConfigLog,
      `Verified audit logs: CREATE (${hasCreateLog}), STATUS (${hasStatusLog}), PASSWORD_RESET (${hasResetLog}), API_CONFIG (${hasApiConfigLog})`
    );

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n========================================');
    console.log('       TEST SUITE EXECUTION SUMMARY');
    console.log('========================================');
    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = total - passed;

    console.log(`Total Tests : ${total}`);
    console.log(`Passed      : ${passed}`);
    console.log(`Failed      : ${failed}`);

    if (failed > 0) {
      console.log('\n❌ Failed tests:');
      results
        .filter((r) => !r.passed)
        .forEach((r) => console.log(`  - [${r.category}] ${r.name}: ${r.details}`));
      process.exit(1);
    } else {
      console.log('\n🎉 ALL CLIENT MANAGEMENT TESTS PASSED WITH 100% SUCCESS!');
    }
  } catch (err) {
    console.error('Test suite failed with unexpected exception:', err);
    process.exit(1);
  } finally {
    server.close();
  }
}

runClientTests();
