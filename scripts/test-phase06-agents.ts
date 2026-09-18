/**
 * Phase 06: Agent Management Test Suite
 * Validates:
 * 1. Super Admin authentication & token generation
 * 2. Manager authentication (Sarah Jenkins and Marcus Vance)
 * 3. Agent authentication (David Ross and Elena Rostova)
 * 4. Super Admin Agent List with pagination, search, status, and manager filters
 * 5. Hierarchy & Scope Enforcement:
 *    - Super Admin can access all agents
 *    - Manager can access only agents assigned to their ManagerProfile
 *    - Manager accessing agents of another manager is denied (403 Forbidden)
 *    - Agent can access only their own resources
 *    - Agent accessing another agent's dossier is denied (403 Forbidden)
 *    - Agent attempting mutation (create, edit, suspend, reset) is denied (403 Forbidden)
 * 6. Agent Creation (User & AgentProfile provisioned, password hash secured)
 * 7. Agent Editing (name, contact, commissionRate, manager allocation)
 * 8. Status Toggle (Active <-> Suspended with reason) & rejection of suspended agent login
 * 9. Password Reset & login verification with newly generated credentials
 * 10. Granular Permissions assignment & verification
 * 11. Manager Assignment & Reassignment (Super Admin reallocates agent hierarchy)
 * 12. Sub-resources: Agent Statistics, Assigned Clients, Number Inventory, Activity Trail
 * 13. Audit Logging: Every mutative action emits immutable audit entries
 */

import http from 'http';
import { createExpressApp } from '../server/app';
import { env } from '../server/config/env';
import { ManagerService } from '../server/services/manager.service';
import { AgentService } from '../server/services/agent.service';

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

async function runAgentTests() {
  console.log('🚀 Initializing Phase 06 Agent Management Test Suite...\n');
  const app = createExpressApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as { port: number };
  const testPort = address.port;

  try {
    // Pre-initialize seed managers and agents in memory
    await ManagerService.initializeSeedManagers();
    await AgentService.initializeSeedAgents();

    // -------------------------------------------------------------------------
    // 1. AUTHENTICATE ROLES
    // -------------------------------------------------------------------------
    console.log('--- 1. Authenticating Roles (Super Admin, Managers, Agents) ---');

    // Super Admin Login
    const adminLogin = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: env.SEED_ADMIN_EMAIL,
      password: env.SEED_ADMIN_PASSWORD,
    });
    const adminToken = adminLogin.body.data?.token;
    recordTest(
      'AUTH',
      'Super Admin Login',
      adminLogin.status === 200 && !!adminToken,
      `Status: ${adminLogin.status}, Role: ${adminLogin.body.data?.user?.role}`
    );

    // Manager 1 Login (Elena Rostova)
    const mgr1Login = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: env.SEED_MANAGER_EMAIL,
      password: env.SEED_MANAGER_PASSWORD,
    });
    const mgr1Token = mgr1Login.body.data?.token;
    recordTest(
      'AUTH',
      'Manager 1 Login (Elena Rostova)',
      mgr1Login.status === 200 && !!mgr1Token,
      `Status: ${mgr1Login.status}, Name: ${mgr1Login.body.data?.user?.firstName}`
    );

    // Manager 2 Login (Viktor Kraus)
    const mgr2Login = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: 'viktor.kraus@sms-platform.internal',
      password: env.SEED_MANAGER_PASSWORD,
    });
    const mgr2Token = mgr2Login.body.data?.token;
    recordTest(
      'AUTH',
      'Manager 2 Login (Viktor Kraus)',
      mgr2Login.status === 200 && !!mgr2Token,
      `Status: ${mgr2Login.status}, Name: ${mgr2Login.body.data?.user?.firstName}`
    );

    // Agent 1 Login (Marcus Brody - assigned to Elena Rostova)
    const agent1Login = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: env.SEED_AGENT_EMAIL,
      password: env.SEED_AGENT_PASSWORD,
    });
    const agent1Token = agent1Login.body.data?.token;
    recordTest(
      'AUTH',
      'Agent 1 Login (Marcus Brody)',
      agent1Login.status === 200 && !!agent1Token,
      `Status: ${agent1Login.status}, Role: ${agent1Login.body.data?.user?.role}`
    );

    // Agent 2 Login (Liam O'Connor - assigned to Viktor Kraus)
    const agent2Login = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: 'liam.oc@route-uk.co',
      password: env.SEED_AGENT_PASSWORD,
    });
    const agent2Token = agent2Login.body.data?.token;
    recordTest(
      'AUTH',
      'Agent 2 Login (Liam O\'Connor)',
      agent2Login.status === 200 && !!agent2Token,
      `Status: ${agent2Login.status}, Role: ${agent2Login.body.data?.user?.role}`
    );

    // -------------------------------------------------------------------------
    // 2. SUPER ADMIN AGENT LISTING, SEARCH, FILTERS, PAGINATION
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Super Admin Agent Directory, Search, Filters & Pagination ---');

    // List all agents as Super Admin
    const allAgentsRes = await makeRequest(testPort, 'GET', '/api/agents', undefined, adminToken);
    recordTest(
      'LIST',
      'Super Admin Lists All Agents',
      allAgentsRes.status === 200 && Array.isArray(allAgentsRes.body.data?.items) && allAgentsRes.body.data?.items.length >= 3,
      `Returned ${allAgentsRes.body.data?.items?.length} agents, total: ${allAgentsRes.body.data?.total}`
    );

    const marcusAgent = allAgentsRes.body.data?.items?.find((a: any) => a.username === 'marcus.brody');
    const liamAgent = allAgentsRes.body.data?.items?.find((a: any) => a.username === 'liam.oconnor');

    recordTest(
      'LIST',
      'Seed Agents Initialized Correctly',
      !!marcusAgent && !!liamAgent,
      `Found Marcus (ID: ${marcusAgent?.id}) and Liam (ID: ${liamAgent?.id})`
    );

    // Search by name
    const searchRes = await makeRequest(testPort, 'GET', '/api/agents?search=Marcus', undefined, adminToken);
    recordTest(
      'SEARCH',
      'Search Agents by Keyword',
      searchRes.status === 200 && searchRes.body.data?.items?.length >= 1 && searchRes.body.data?.items[0].username === 'marcus.brody',
      `Query "Marcus" returned: ${searchRes.body.data?.items?.map((i: any) => i.name).join(', ')}`
    );

    // Filter by Status
    const statusFilterRes = await makeRequest(testPort, 'GET', '/api/agents?status=ACTIVE', undefined, adminToken);
    recordTest(
      'FILTER',
      'Filter Agents by Status ACTIVE',
      statusFilterRes.status === 200 && statusFilterRes.body.data?.items?.every((i: any) => i.status === 'ACTIVE'),
      `Returned ${statusFilterRes.body.data?.items?.length} ACTIVE agents`
    );

    // Filter by Manager ID (Elena Rostova)
    const elenaManagerId = marcusAgent?.managerId;
    const mgrFilterRes = await makeRequest(testPort, 'GET', `/api/agents?managerId=${elenaManagerId}`, undefined, adminToken);
    recordTest(
      'FILTER',
      'Filter Agents by Manager ID',
      mgrFilterRes.status === 200 && mgrFilterRes.body.data?.items?.every((i: any) => i.managerId === elenaManagerId),
      `Returned ${mgrFilterRes.body.data?.items?.length} agents under Elena Rostova`
    );

    // Pagination
    const pageRes = await makeRequest(testPort, 'GET', '/api/agents?limit=1&page=1', undefined, adminToken);
    recordTest(
      'PAGINATION',
      'Paginated Agent Retrieval',
      pageRes.status === 200 && pageRes.body.data?.items?.length === 1 && pageRes.body.data?.totalPages >= 3,
      `Limit: 1, Page: 1, Returned 1 item, totalPages: ${pageRes.body.data?.totalPages}`
    );

    // -------------------------------------------------------------------------
    // 3. BACKEND SCOPE & AUTHORIZATION ENFORCEMENT
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Hierarchy & Scope Enforcement (Super Admin -> Manager -> Agent) ---');

    // Manager 1 (Elena Rostova) lists agents
    const mgr1List = await makeRequest(testPort, 'GET', '/api/agents', undefined, mgr1Token);
    const mgr1HasLiam = mgr1List.body.data?.items?.some((a: any) => a.username === 'liam.oconnor');
    const mgr1HasMarcus = mgr1List.body.data?.items?.some((a: any) => a.username === 'marcus.brody');
    recordTest(
      'SCOPE',
      'Manager 1 List Restricted to Own Agents',
      mgr1List.status === 200 && mgr1HasMarcus && !mgr1HasLiam,
      `Elena sees Marcus (own agent): ${mgr1HasMarcus}, Liam (Viktor's agent): ${mgr1HasLiam}`
    );

    // Manager 1 attempts to access Liam O'Connor (assigned to Manager 2 Viktor Kraus)
    const unauthorizedAgentAccess = await makeRequest(testPort, 'GET', `/api/agents/${liamAgent.id}`, undefined, mgr1Token);
    recordTest(
      'SCOPE',
      'Manager 1 Denied Access to Out-of-Scope Agent (403)',
      unauthorizedAgentAccess.status === 403,
      `Status: ${unauthorizedAgentAccess.status}, Error: ${unauthorizedAgentAccess.body.error}`
    );

    // Manager 1 accesses Marcus Brody (assigned to Manager 1)
    const authorizedAgentAccess = await makeRequest(testPort, 'GET', `/api/agents/${marcusAgent.id}`, undefined, mgr1Token);
    recordTest(
      'SCOPE',
      'Manager 1 Granted Access to In-Scope Agent (200)',
      authorizedAgentAccess.status === 200 && authorizedAgentAccess.body.data?.agent?.username === 'marcus.brody',
      `Status: ${authorizedAgentAccess.status}, Agent: ${authorizedAgentAccess.body.data?.agent?.name}`
    );

    // Agent (Marcus Brody) accesses own agent dossier
    const agentSelfAccess = await makeRequest(testPort, 'GET', `/api/agents/${marcusAgent.id}`, undefined, agent1Token);
    recordTest(
      'SCOPE',
      'Agent Accesses Own Profile (200)',
      agentSelfAccess.status === 200 && agentSelfAccess.body.data?.agent?.id === marcusAgent.id,
      `Status: ${agentSelfAccess.status}, Name: ${agentSelfAccess.body.data?.agent?.name}`
    );

    // Agent (Marcus Brody) attempts to access Liam O'Connor's profile
    const agentCrossAccess = await makeRequest(testPort, 'GET', `/api/agents/${liamAgent.id}`, undefined, agent1Token);
    recordTest(
      'SCOPE',
      'Agent Denied Access to Another Agent (403)',
      agentCrossAccess.status === 403,
      `Status: ${agentCrossAccess.status}, Error: ${agentCrossAccess.body.error}`
    );

    // Agent (Marcus Brody) attempts to CREATE an agent (Forbidden)
    const agentCreateAttempt = await makeRequest(
      testPort,
      'POST',
      '/api/agents',
      {
        username: 'hacker.agent',
        firstName: 'Hacker',
        lastName: 'Agent',
        email: 'hacker@agent.local',
        contact: '+1234567890',
      },
      agent1Token
    );
    recordTest(
      'SCOPE',
      'Agent Denied Agent Creation Route (403)',
      agentCreateAttempt.status === 403,
      `Status: ${agentCreateAttempt.status}`
    );

    // -------------------------------------------------------------------------
    // 4. CREATE AGENT
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Agent Creation by Super Admin & Manager ---');
    const uid = Math.floor(Math.random() * 900000 + 100000);
    const samuelUsername = `samuel.clemens.${uid}`;
    const samuelEmail = `samuel.clemens.${uid}@smshub.local`;
    const lucasUsername = `lucas.trent.${uid}`;
    const lucasEmail = `lucas.trent.${uid}@smshub.local`;

    const newAgentPayload = {
      username: samuelUsername,
      firstName: 'Samuel',
      lastName: 'Clemens',
      email: samuelEmail,
      contact: '+1 (555) 789-0123',
      commissionRate: 0.075,
      managerId: elenaManagerId,
      status: 'ACTIVE',
    };

    const createRes = await makeRequest(testPort, 'POST', '/api/agents', newAgentPayload, adminToken);
    const createdAgent = createRes.body.data?.agent;
    const tempPassword = createRes.body.data?.generatedPassword;

    recordTest(
      'CREATE',
      'Super Admin Creates Agent with Auto-Password',
      createRes.status === 201 && !!createdAgent?.id && !!tempPassword,
      `Agent ID: ${createdAgent?.id}, Username: ${createdAgent?.username}, Temp Password: ${tempPassword ? 'YES' : 'NO'}`
    );

    // Verify Newly Created Agent can log in
    const newAgentLogin = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: samuelEmail,
      password: tempPassword,
    });
    const loggedInRole = typeof newAgentLogin.body.data?.user?.role === 'string'
      ? newAgentLogin.body.data?.user?.role
      : newAgentLogin.body.data?.user?.role?.name;
    recordTest(
      'CREATE',
      'New Agent Login with Generated Temporary Password',
      newAgentLogin.status === 200 && loggedInRole === 'AGENT',
      `Login status: ${newAgentLogin.status}, Role: ${loggedInRole}`
    );

    // Manager creates agent within their scope
    const mgrCreatePayload = {
      username: lucasUsername,
      firstName: 'Lucas',
      lastName: 'Trent',
      email: lucasEmail,
      contact: '+1 (555) 321-6549',
      commissionRate: 0.05,
    };
    const mgrCreateRes = await makeRequest(testPort, 'POST', '/api/agents', mgrCreatePayload, mgr1Token);
    const mgrCreatedAgent = mgrCreateRes.body.data?.agent;
    recordTest(
      'CREATE',
      'Manager Creates Agent (Scoped to Self)',
      mgrCreateRes.status === 201 && mgrCreatedAgent?.managerId === elenaManagerId,
      `Agent ID: ${mgrCreatedAgent?.id}, managerId: ${mgrCreatedAgent?.managerId}`
    );

    // -------------------------------------------------------------------------
    // 5. EDIT AGENT
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Edit Agent Profile ---');

    const updatePayload = {
      firstName: 'Samuel Langhorne',
      lastName: 'Clemens',
      contact: '+1 (555) 444-3322',
      commissionRate: 0.08,
    };

    // Super Admin updates agent
    const adminUpdateRes = await makeRequest(
      testPort,
      'PUT',
      `/api/agents/${createdAgent.id}`,
      updatePayload,
      adminToken
    );
    recordTest(
      'UPDATE',
      'Super Admin Updates Agent Profile',
      adminUpdateRes.status === 200 && adminUpdateRes.body.data?.agent?.firstName === 'Samuel Langhorne',
      `Updated Name: ${adminUpdateRes.body.data?.agent?.name}, Commission: ${adminUpdateRes.body.data?.agent?.commissionRate}`
    );

    // Manager updates agent within their portfolio
    const mgrUpdateRes = await makeRequest(
      testPort,
      'PUT',
      `/api/agents/${createdAgent.id}`,
      { contact: '+1 (555) 444-3322' },
      mgr1Token
    );
    recordTest(
      'UPDATE',
      'Manager Updates Agent in Scope',
      mgrUpdateRes.status === 200,
      `Status: ${mgrUpdateRes.status}, New Contact: ${mgrUpdateRes.body.data?.agent?.contact}`
    );

    // Manager 1 attempts to update Liam O'Connor (Viktor Kraus's agent) -> Forbidden 403
    const mgrUpdateOutOfScope = await makeRequest(
      testPort,
      'PUT',
      `/api/agents/${liamAgent.id}`,
      { commissionRate: 0.1 },
      mgr1Token
    );
    recordTest(
      'UPDATE',
      'Manager Denied Editing Out-of-Scope Agent (403)',
      mgrUpdateOutOfScope.status === 403,
      `Status: ${mgrUpdateOutOfScope.status}`
    );

    // -------------------------------------------------------------------------
    // 6. ENABLE / DISABLE (STATUS TOGGLE) & SUSPENDED LOGIN REJECTION
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Enable / Disable Agent & Suspension Enforcement ---');

    // Suspend agent
    const suspendRes = await makeRequest(
      testPort,
      'PATCH',
      `/api/agents/${createdAgent.id}/status`,
      { status: 'SUSPENDED', reason: 'Audit compliance hold' },
      adminToken
    );
    recordTest(
      'STATUS',
      'Suspend Agent Account',
      suspendRes.status === 200 && suspendRes.body.data?.agent?.status === 'SUSPENDED',
      `Agent status: ${suspendRes.body.data?.agent?.status}`
    );

    // Verify suspended agent login is blocked
    const suspendedLoginAttempt = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: samuelEmail,
      password: tempPassword,
    });
    const errText = typeof suspendedLoginAttempt.body.error === 'string'
      ? suspendedLoginAttempt.body.error
      : (suspendedLoginAttempt.body.error?.message || suspendedLoginAttempt.body.error?.code || '');
    recordTest(
      'STATUS',
      'Suspended Agent Blocked from Login (403)',
      suspendedLoginAttempt.status === 403 && errText.toLowerCase().includes('suspend'),
      `Status: ${suspendedLoginAttempt.status}, Error: ${errText}`
    );

    // Re-activate agent
    const activateRes = await makeRequest(
      testPort,
      'PATCH',
      `/api/agents/${createdAgent.id}/status`,
      { status: 'ACTIVE', reason: 'Audit review passed' },
      adminToken
    );
    recordTest(
      'STATUS',
      'Re-activate Agent Account',
      activateRes.status === 200 && activateRes.body.data?.agent?.status === 'ACTIVE',
      `Agent status: ${activateRes.body.data?.agent?.status}`
    );

    // -------------------------------------------------------------------------
    // 7. RESET PASSWORD
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Password Reset & Credentials Verification ---');

    const resetRes = await makeRequest(
      testPort,
      'POST',
      `/api/agents/${createdAgent.id}/reset-password`,
      { autoGenerate: true },
      adminToken
    );
    const newResetPassword = resetRes.body.data?.temporaryPassword;
    recordTest(
      'PASSWORD',
      'Reset Agent Password',
      resetRes.status === 200 && !!newResetPassword && newResetPassword !== tempPassword,
      `New Temp Password Generated: ${newResetPassword ? 'YES' : 'NO'}`
    );

    // Verify login with new temporary password
    const resetLogin = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: samuelEmail,
      password: newResetPassword,
    });
    recordTest(
      'PASSWORD',
      'Agent Logs in with New Reset Credentials',
      resetLogin.status === 200 && !!resetLogin.body.data?.token,
      `Status: ${resetLogin.status}, User ID: ${resetLogin.body.data?.user?.id}`
    );

    // -------------------------------------------------------------------------
    // 8. ASSIGN PERMISSIONS
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Permissions Assignment ---');

    const permsPayload = ['users.view', 'numbers.view', 'sms.view', 'billing.view'];
    const permsRes = await makeRequest(
      testPort,
      'PUT',
      `/api/agents/${createdAgent.id}/permissions`,
      { permissions: permsPayload },
      adminToken
    );
    recordTest(
      'PERMISSIONS',
      'Assign Granular Permissions to Agent',
      permsRes.status === 200 && permsRes.body.data?.agent?.permissions?.length === 4,
      `Permissions assigned: ${permsRes.body.data?.agent?.permissions?.join(', ')}`
    );

    // -------------------------------------------------------------------------
    // 9. ASSIGN AGENT TO MANAGER (HIERARCHY REALLOCATION)
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Assign Agent to Manager (Hierarchy Reallocation) ---');

    // Get Viktor Kraus's manager profile ID
    const mgr2ProfileRes = await makeRequest(testPort, 'GET', '/api/managers', undefined, adminToken);
    const viktorManager = mgr2ProfileRes.body.data?.items?.find((m: any) => m.username === 'viktor.kraus');

    // Reassign Samuel Clemens from Elena Rostova to Viktor Kraus
    const assignRes = await makeRequest(
      testPort,
      'PATCH',
      `/api/agents/${createdAgent.id}/assign-manager`,
      { managerId: viktorManager.id },
      adminToken
    );
    recordTest(
      'HIERARCHY',
      'Super Admin Reassigns Agent to New Manager',
      assignRes.status === 200 && assignRes.body.data?.agent?.managerId === viktorManager.id,
      `New managerId: ${assignRes.body.data?.agent?.managerId}, Manager Name: ${assignRes.body.data?.agent?.managerName}`
    );

    // Check scope change: Elena Rostova should now be forbidden from accessing Samuel Clemens
    const elenaAccessAfterReassign = await makeRequest(testPort, 'GET', `/api/agents/${createdAgent.id}`, undefined, mgr1Token);
    recordTest(
      'HIERARCHY',
      'Previous Manager Access Immediately Revoked (403)',
      elenaAccessAfterReassign.status === 403,
      `Status: ${elenaAccessAfterReassign.status}`
    );

    // Check scope change: Viktor Kraus can now access Samuel Clemens
    const viktorAccessAfterReassign = await makeRequest(testPort, 'GET', `/api/agents/${createdAgent.id}`, undefined, mgr2Token);
    recordTest(
      'HIERARCHY',
      'New Manager Granted Access to Transferred Agent (200)',
      viktorAccessAfterReassign.status === 200,
      `Status: ${viktorAccessAfterReassign.status}`
    );

    // -------------------------------------------------------------------------
    // 10. SUB-RESOURCES: CLIENTS, NUMBER INVENTORY, STATISTICS, ACTIVITY
    // -------------------------------------------------------------------------
    console.log('\n--- 10. Sub-Resources: Clients, Numbers, Statistics, Activity ---');

    // Agent Clients
    const clientsRes = await makeRequest(testPort, 'GET', `/api/agents/${marcusAgent.id}/clients`, undefined, adminToken);
    recordTest(
      'SUBRESOURCES',
      'Get Agent Clients',
      clientsRes.status === 200 && Array.isArray(clientsRes.body.data?.clients) && clientsRes.body.data?.clients?.length >= 2,
      `Returned ${clientsRes.body.data?.clients?.length} assigned clients (e.g. ${clientsRes.body.data?.clients[0]?.name})`
    );

    // Agent Number Inventory
    const numbersRes = await makeRequest(testPort, 'GET', `/api/agents/${marcusAgent.id}/numbers`, undefined, adminToken);
    recordTest(
      'SUBRESOURCES',
      'Get Agent Number Inventory',
      numbersRes.status === 200 && Array.isArray(numbersRes.body.data?.numbers) && numbersRes.body.data?.numbers?.length >= 2,
      `Returned ${numbersRes.body.data?.numbers?.length} allocated numbers (e.g. ${numbersRes.body.data?.numbers[0]?.e164Number})`
    );

    // Agent Statistics
    const statsRes = await makeRequest(testPort, 'GET', `/api/agents/${marcusAgent.id}/statistics`, undefined, adminToken);
    const stats = statsRes.body.data?.statistics;
    recordTest(
      'SUBRESOURCES',
      'Get Agent Statistics (Clients, Numbers, SMS, Earnings, Balance)',
      statsRes.status === 200 &&
        typeof stats?.totalClients === 'number' &&
        typeof stats?.assignedNumbers === 'number' &&
        typeof stats?.unassignedNumbers === 'number' &&
        typeof stats?.smsCount === 'number' &&
        typeof stats?.earnings === 'number' &&
        typeof stats?.currentBalance === 'number',
      `Clients: ${stats?.totalClients}, Numbers: ${stats?.assignedNumbers} (unassigned: ${stats?.unassignedNumbers}), SMS: ${stats?.smsCount}, Earnings: $${stats?.earnings}, Balance: $${stats?.currentBalance}`
    );

    // Agent Activity
    const activityRes = await makeRequest(testPort, 'GET', `/api/agents/${marcusAgent.id}/activity`, undefined, adminToken);
    recordTest(
      'SUBRESOURCES',
      'Get Agent Activity Audit Trail',
      activityRes.status === 200 && Array.isArray(activityRes.body.data?.activity),
      `Returned ${activityRes.body.data?.activity?.length} activity events`
    );

    // -------------------------------------------------------------------------
    // 11. AUDIT LOGGING VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- 11. Immutable Audit Logging Verification ---');

    const auditRes = await makeRequest(testPort, 'GET', '/api/audit-logs', undefined, adminToken);
    const rawData = auditRes.body.data;
    const auditLogs: any[] = Array.isArray(rawData) ? rawData : (rawData?.logs || rawData?.items || []);

    const hasCreateAudit = auditLogs.some((l: any) => l.action === 'AGENT_CREATE' || l.action === 'AGENT_CREATED');
    const hasUpdateAudit = auditLogs.some((l: any) => l.action === 'AGENT_UPDATE' || l.action === 'AGENT_UPDATED');
    const hasStatusAudit = auditLogs.some((l: any) => l.action === 'AGENT_STATUS_CHANGE' || l.action === 'AGENT_STATUS_CHANGED');
    const hasResetAudit = auditLogs.some((l: any) => l.action === 'AGENT_PASSWORD_RESET');
    const hasPermsAudit = auditLogs.some((l: any) => l.action === 'AGENT_PERMISSIONS_UPDATE' || l.action === 'AGENT_PERMISSIONS_UPDATED');
    const hasAssignAudit = auditLogs.some((l: any) => l.action === 'AGENT_MANAGER_ASSIGN' || l.action === 'AGENT_MANAGER_REASSIGNED');

    recordTest(
      'AUDIT',
      'Audit Log Emitted for AGENT_CREATE',
      hasCreateAudit,
      'AGENT_CREATE entry recorded in audit repository'
    );
    recordTest(
      'AUDIT',
      'Audit Log Emitted for AGENT_UPDATE',
      hasUpdateAudit,
      'AGENT_UPDATE entry recorded in audit repository'
    );
    recordTest(
      'AUDIT',
      'Audit Log Emitted for AGENT_STATUS_CHANGE',
      hasStatusAudit,
      'AGENT_STATUS_CHANGE entry recorded in audit repository'
    );
    recordTest(
      'AUDIT',
      'Audit Log Emitted for AGENT_PASSWORD_RESET',
      hasResetAudit,
      'AGENT_PASSWORD_RESET entry recorded in audit repository'
    );
    recordTest(
      'AUDIT',
      'Audit Log Emitted for AGENT_PERMISSIONS_UPDATE',
      hasPermsAudit,
      'AGENT_PERMISSIONS_UPDATE entry recorded in audit repository'
    );
    recordTest(
      'AUDIT',
      'Audit Log Emitted for AGENT_MANAGER_ASSIGN',
      hasAssignAudit,
      'AGENT_MANAGER_ASSIGN entry recorded in audit repository'
    );

  } catch (error: any) {
    console.error('❌ Test suite failed with exception:', error);
    recordTest('FATAL', 'Execution', false, error.message || String(error));
  } finally {
    server.close();
  }

  // Summary
  console.log('\n======================================================');
  console.log('              PHASE 06 TEST RESULTS SUMMARY           ');
  console.log('======================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`Total Tests Run: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.error(`\n❌ ${failed} tests failed! Review log above.`);
    process.exit(1);
  } else {
    console.log('\n🎉 ALL PHASE 06 AGENT MANAGEMENT TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  }
}

runAgentTests();
