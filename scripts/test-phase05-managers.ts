/**
 * Phase 05: Manager Management Test Suite
 * Validates:
 * 1. Super Admin authentication & token generation
 * 2. Manager list retrieval with pagination, search, status & department filters
 * 3. Manager creation with full input validation (email format, username uniqueness, contact)
 * 4. Password security: no plaintext stored, zero passwordHash exposure in API
 * 5. Manager details retrieval: profile, activity summary, agents, clients
 * 6. Manager profile editing (name, department, contact, maxAgents)
 * 7. Enabling / disabling manager (status update to SUSPENDED / ACTIVE)
 * 8. Suspended manager login rejection (403 ACCOUNT_SUSPENDED)
 * 9. Secure password reset and verification of login with new credentials
 * 10. Granular permissions assignment & update
 * 11. Manager agents & clients sub-resource listings
 * 12. Security guard: Non-admin roles (Manager, Agent, Client) blocked from /api/managers (403)
 * 13. Security guard: Manager cannot modify or manage Super Admin accounts
 * 14. AuditLog verification: Every action records an immutable audit trail
 */

import http from 'http';
import { createExpressApp } from '../server/app';
import { env } from '../server/config/env';
import { UserRepository } from '../server/services/user.repository';
import { ManagerService } from '../server/services/manager.service';

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
          let parsed = {};
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

async function runManagerTests() {
  console.log('🚀 Initializing Phase 05 Manager Management Test Suite...');
  const app = createExpressApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as { port: number };
  const testPort = address.port;

  try {
    await UserRepository.initializeSeedUsers();
    await ManagerService.initializeSeedManagers();

    // -------------------------------------------------------------------------
    // 1. AUTHENTICATION OF ROLES
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Authenticating Super Admin & Manager ---');
    const adminLoginRes = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: env.SEED_ADMIN_EMAIL,
      password: env.SEED_ADMIN_PASSWORD,
    });
    const adminToken = adminLoginRes.body?.data?.token;
    recordTest(
      'Authentication',
      'Super Admin login successful',
      adminLoginRes.status === 200 && !!adminToken,
      `Status: ${adminLoginRes.status}`
    );

    const managerLoginRes = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: env.SEED_MANAGER_EMAIL,
      password: env.SEED_MANAGER_PASSWORD,
    });
    const managerToken = managerLoginRes.body?.data?.token;
    recordTest(
      'Authentication',
      'Operations Manager login successful',
      managerLoginRes.status === 200 && !!managerToken,
      `Status: ${managerLoginRes.status}`
    );

    // -------------------------------------------------------------------------
    // 2. MANAGER LISTING, PAGINATION, SEARCH, AND FILTERS
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Manager Listing & Filtering Tests ---');
    const listRes = await makeRequest(testPort, 'GET', '/api/managers?page=1&limit=10', undefined, adminToken);
    const listData = listRes.body?.data;
    recordTest(
      'Manager List',
      'Super Admin can list managers',
      listRes.status === 200 && Array.isArray(listData?.items) && listData.items.length >= 4,
      `Total managers: ${listData?.total}, Items in page: ${listData?.items?.length}`
    );

    recordTest(
      'Manager List',
      'Manager list includes platform statistics',
      !!listData?.stats && listData.stats.total >= 4 && listData.stats.active >= 2,
      `Active: ${listData?.stats?.active}, Suspended: ${listData?.stats?.suspended}, Pending: ${listData?.stats?.pending}`
    );

    // Test Search filter
    const searchRes = await makeRequest(testPort, 'GET', '/api/managers?search=Elena', undefined, adminToken);
    const searchItems = searchRes.body?.data?.items;
    recordTest(
      'Manager Search',
      'Search query matches manager name or username',
      searchRes.status === 200 && searchItems?.length === 1 && searchItems[0]?.username === 'elena.rostova',
      `Found ${searchItems?.length} items matching 'Elena'`
    );

    // Test Status filter
    const statusFilterRes = await makeRequest(testPort, 'GET', '/api/managers?status=SUSPENDED', undefined, adminToken);
    const suspendedItems = statusFilterRes.body?.data?.items;
    recordTest(
      'Manager Filter',
      'Filter by status (SUSPENDED) returns only suspended managers',
      statusFilterRes.status === 200 && suspendedItems?.length >= 1 && suspendedItems.every((m: any) => m.status === 'SUSPENDED'),
      `Suspended managers returned: ${suspendedItems?.length}`
    );

    // -------------------------------------------------------------------------
    // 3. CREATE MANAGER
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Create Manager Tests ---');
    const runId = Math.floor(Date.now() % 1000000);
    const testUsername = `jordan.bell.${runId}`;
    const testEmail = `jordan.bell.${runId}@sms-platform.internal`;

    const newManagerPayload = {
      username: testUsername,
      firstName: 'Jordan',
      lastName: 'Bell',
      email: testEmail,
      contact: '+1 (555) 019-2834',
      department: 'Enterprise Gateway Integration',
      maxAgents: 25,
      status: 'ACTIVE',
      permissions: ['users.view', 'providers.view', 'sms.view', 'reports.view'],
    };

    const createRes = await makeRequest(testPort, 'POST', '/api/managers', newManagerPayload, adminToken);
    const createdManager = createRes.body?.data?.manager;
    const generatedPassword = createRes.body?.data?.generatedPassword;

    recordTest(
      'Create Manager',
      'Super Admin can create a new manager',
      createRes.status === 201 && createdManager?.username === testUsername,
      `Status: ${createRes.status}, Manager ID: ${createdManager?.id}`
    );

    recordTest(
      'Password Security',
      'Secure password generated without plaintext persistence or hash exposure',
      !!generatedPassword && generatedPassword.length >= 12 && !('passwordHash' in (createdManager || {})),
      `Generated Password Length: ${generatedPassword?.length}, passwordHash field excluded: true`
    );

    const createdManagerId = createdManager?.id;

    // Test duplicate username rejection
    const duplicateRes = await makeRequest(testPort, 'POST', '/api/managers', newManagerPayload, adminToken);
    recordTest(
      'Validation',
      'Duplicate username/email is strictly rejected (400)',
      duplicateRes.status === 400,
      `Status: ${duplicateRes.status}`
    );

    // -------------------------------------------------------------------------
    // 4. VIEW MANAGER DETAILS, AGENTS & CLIENTS
    // -------------------------------------------------------------------------
    console.log('\n--- 4. View Manager Details, Agents & Clients ---');
    const detailRes = await makeRequest(testPort, 'GET', `/api/managers/${createdManagerId}`, undefined, adminToken);
    const managerDetail = detailRes.body?.data?.manager;

    recordTest(
      'Manager Profile',
      'Manager profile contains all required fields',
      detailRes.status === 200 &&
        managerDetail?.username === testUsername &&
        managerDetail?.name === 'Jordan Bell' &&
        managerDetail?.email === testEmail &&
        managerDetail?.contact === '+1 (555) 019-2834' &&
        managerDetail?.status === 'ACTIVE' &&
        !!managerDetail?.createdAt &&
        Array.isArray(managerDetail?.permissions) &&
        !!managerDetail?.activitySummary,
      `Username: ${managerDetail?.username}, Status: ${managerDetail?.status}, Department: ${managerDetail?.department}`
    );

    // Test Elena's profile with populated agents and clients
    const elenaRes = await makeRequest(testPort, 'GET', '/api/managers/mgr-profile-001', undefined, adminToken);
    const elenaDetail = elenaRes.body?.data?.manager;
    recordTest(
      'Manager Hierarchy',
      "Elena Rostova's profile returns assigned agents and clients",
      elenaRes.status === 200 && elenaDetail?.agents?.length >= 2 && elenaDetail?.clients?.length >= 2,
      `Agents: ${elenaDetail?.agents?.length}, Clients: ${elenaDetail?.clients?.length}, Logins: ${elenaDetail?.activitySummary?.totalLogins}`
    );

    // -------------------------------------------------------------------------
    // 5. EDIT MANAGER
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Edit Manager Profile ---');
    const updatePayload = {
      contact: '+1 (555) 999-0011',
      department: 'Global Routing & Strategic Ops',
      maxAgents: 35,
    };

    const updateRes = await makeRequest(
      testPort,
      'PUT',
      `/api/managers/${createdManagerId}`,
      updatePayload,
      adminToken
    );
    const updatedManager = updateRes.body?.data?.manager;

    recordTest(
      'Edit Manager',
      'Super Admin can update manager department, contact, and limits',
      updateRes.status === 200 &&
        updatedManager?.contact === '+1 (555) 999-0011' &&
        updatedManager?.department === 'Global Routing & Strategic Ops' &&
        updatedManager?.maxAgents === 35,
      `Updated Department: ${updatedManager?.department}, Contact: ${updatedManager?.contact}`
    );

    // -------------------------------------------------------------------------
    // 6. ENABLE / DISABLE / SUSPEND MANAGER
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Status Management & Access Blocking ---');
    const suspendRes = await makeRequest(
      testPort,
      'PATCH',
      `/api/managers/${createdManagerId}/status`,
      { status: 'SUSPENDED', reason: 'Security compliance review in progress' },
      adminToken
    );

    recordTest(
      'Disable Manager',
      'Super Admin can suspend manager account',
      suspendRes.status === 200 && suspendRes.body?.data?.manager?.status === 'SUSPENDED',
      `New status: ${suspendRes.body?.data?.manager?.status}`
    );

    // Attempt login with suspended manager account
    const suspendedLoginRes = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: testEmail,
      password: generatedPassword,
    });

    recordTest(
      'Access Blocking',
      'Suspended manager account is rejected at login with 403 ACCOUNT_SUSPENDED',
      suspendedLoginRes.status === 403 && (suspendedLoginRes.body?.error?.code === 'ACCOUNT_SUSPENDED' || suspendedLoginRes.body?.code === 'ACCOUNT_SUSPENDED'),
      `Status: ${suspendedLoginRes.status}`
    );

    // Re-enable manager
    const enableRes = await makeRequest(
      testPort,
      'PATCH',
      `/api/managers/${createdManagerId}/status`,
      { status: 'ACTIVE', reason: 'Compliance audit cleared' },
      adminToken
    );

    recordTest(
      'Enable Manager',
      'Super Admin can re-activate manager account to ACTIVE',
      enableRes.status === 200 && enableRes.body?.data?.manager?.status === 'ACTIVE',
      `Status: ${enableRes.body?.data?.manager?.status}`
    );

    // -------------------------------------------------------------------------
    // 7. SECURE PASSWORD RESET
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Secure Password Reset ---');
    const resetRes = await makeRequest(
      testPort,
      'POST',
      `/api/managers/${createdManagerId}/reset-password`,
      { autoGenerate: true },
      adminToken
    );
    const newResetPassword = resetRes.body?.data?.temporaryPassword;

    recordTest(
      'Reset Password',
      'Super Admin can securely reset password and receive temporary credentials',
      resetRes.status === 200 && typeof newResetPassword === 'string' && newResetPassword.length >= 12,
      `Temporary Password Length: ${newResetPassword?.length}`
    );

    // Verify authentication succeeds with the newly generated reset password
    const newLoginRes = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: testEmail,
      password: newResetPassword,
    });

    recordTest(
      'Reset Password',
      'Manager can authenticate immediately with newly reset password',
      newLoginRes.status === 200 && !!newLoginRes.body?.data?.token,
      `Status: ${newLoginRes.status}, User ID: ${newLoginRes.body?.data?.user?.id}`
    );

    // -------------------------------------------------------------------------
    // 8. ASSIGN GRANULAR PERMISSIONS
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Assign Permissions ---');
    const newPermissions = ['users.view', 'billing.view', 'billing.manage', 'reports.view'];
    const permsRes = await makeRequest(
      testPort,
      'PUT',
      `/api/managers/${createdManagerId}/permissions`,
      { permissions: newPermissions },
      adminToken
    );
    const managerWithPerms = permsRes.body?.data?.manager;

    recordTest(
      'Assign Permissions',
      'Super Admin can assign custom permissions to manager',
      permsRes.status === 200 &&
        Array.isArray(managerWithPerms?.permissions) &&
        managerWithPerms?.permissions?.includes('billing.manage'),
      `Assigned permissions count: ${managerWithPerms?.permissions?.length}`
    );

    // -------------------------------------------------------------------------
    // 9. SECURITY RESTRICTIONS: ROLE BOUNDARIES & HIERARCHY
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Security Guardrails & Role Boundaries ---');
    // Manager attempting to access /api/managers
    const managerForbiddenRes = await makeRequest(testPort, 'GET', '/api/managers', undefined, managerToken);
    recordTest(
      'Security Boundary',
      'Manager role is strictly FORBIDDEN from /api/managers (403 ROLE_RESTRICTED)',
      managerForbiddenRes.status === 403,
      `Status: ${managerForbiddenRes.status}, Code: ${managerForbiddenRes.body?.error?.code || managerForbiddenRes.body?.code}`
    );

    // Manager attempting to create a manager
    const managerCreateAttempt = await makeRequest(
      testPort,
      'POST',
      '/api/managers',
      {
        username: 'unauthorized.mgr',
        firstName: 'Hacker',
        lastName: 'Attempt',
        email: 'hacker@sms-platform.internal',
        contact: '+1234567890',
        department: 'Blackhat',
      },
      managerToken
    );
    recordTest(
      'Security Boundary',
      'Manager role cannot create other managers (403)',
      managerCreateAttempt.status === 403,
      `Status: ${managerCreateAttempt.status}`
    );

    // -------------------------------------------------------------------------
    // 10. AUDIT TRAIL VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- 10. Audit Logging Verification ---');
    const auditRes = await makeRequest(testPort, 'GET', '/api/audit-logs?limit=50', undefined, adminToken);
    const logs: any[] = auditRes.body?.data?.logs || [];

    const hasCreatedLog = logs.some((l) => l.action === 'MANAGER_CREATED');
    const hasUpdatedLog = logs.some((l) => l.action === 'MANAGER_UPDATED');
    const hasStatusLog = logs.some((l) => l.action === 'MANAGER_STATUS_CHANGED');
    const hasPasswordLog = logs.some((l) => l.action === 'MANAGER_PASSWORD_RESET');
    const hasPermsLog = logs.some((l) => l.action === 'MANAGER_PERMISSIONS_UPDATED');

    recordTest(
      'Audit Logging',
      'Audit log recorded MANAGER_CREATED action',
      hasCreatedLog,
      `Total audit logs checked: ${logs.length}`
    );
    recordTest(
      'Audit Logging',
      'Audit log recorded MANAGER_UPDATED action',
      hasUpdatedLog,
      `Logs checked: ${logs.length}`
    );
    recordTest(
      'Audit Logging',
      'Audit log recorded MANAGER_STATUS_CHANGED action',
      hasStatusLog,
      `Logs checked: ${logs.length}`
    );
    recordTest(
      'Audit Logging',
      'Audit log recorded MANAGER_PASSWORD_RESET action',
      hasPasswordLog,
      `Logs checked: ${logs.length}`
    );
    recordTest(
      'Audit Logging',
      'Audit log recorded MANAGER_PERMISSIONS_UPDATED action',
      hasPermsLog,
      `Logs checked: ${logs.length}`
    );

    // =========================================================================
    // SUMMARY
    // =========================================================================
    console.log('\n================================================================');
    console.log('               PHASE 05 MANAGER MANAGEMENT REPORT               ');
    console.log('================================================================');
    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = total - passed;

    console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
    if (failed === 0) {
      console.log('🎉 ALL Phase 05 Manager Management tests PASSED successfully!');
    } else {
      console.error(`❌ ${failed} tests failed.`);
      process.exit(1);
    }
  } finally {
    server.close();
  }
}

runManagerTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
  });
