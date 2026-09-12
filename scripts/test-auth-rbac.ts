/**
 * Phase 03: Authentication & Role-Based Access Control Test Suite
 * Validates:
 * 1. Successful login for all 4 roles (SUPER_ADMIN, MANAGER, AGENT, CLIENT)
 * 2. Wrong password rejection (401)
 * 3. Disabled / suspended account rejection (403)
 * 4. Unauthorized endpoint access without token (401)
 * 5. Forbidden endpoint access due to missing permissions (403)
 * 6. Role restrictions & hierarchy
 * 7. Role escalation prevention (Manager cannot create Admin/Manager)
 * 8. Logout & session / token invalidation (401 after logout)
 * 9. Security invariants: Zero plaintext passwords, passwordHash never returned
 * 10. Login audit logging
 */

import { createExpressApp } from '../server/app';
import { env } from '../server/config/env';
import { UserRepository } from '../server/services/user.repository';
import http from 'http';

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function recordTest(category: string, name: string, condition: boolean, details: string) {
  results.push({
    category,
    name,
    passed: condition,
    details,
  });
  const symbol = condition ? '✅ PASS' : '❌ FAIL';
  console.log(`${symbol} [${category}] ${name} - ${details}`);
}

function getErrorCode(resBody: any): string | undefined {
  return resBody?.error?.code || resBody?.code;
}

function getErrorMessage(resBody: any): string | undefined {
  return resBody?.error?.message || resBody?.message || (typeof resBody?.error === 'string' ? resBody.error : undefined);
}

// Lightweight HTTP request helper
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
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData).toString();
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        method,
        path,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let parsed: any;
          try {
            parsed = JSON.parse(rawData);
          } catch {
            parsed = rawData;
          }
          resolve({ status: res.statusCode || 500, body: parsed });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runAuthTests() {
  console.log('🔒 Starting Phase 03 Authentication & RBAC Test Suite...\n');

  // Ensure repository seed users are ready
  await UserRepository.initializeSeedUsers();

  const app = createExpressApp();
  const testServer = http.createServer(app);

  const testPort = 3199;
  await new Promise<void>((resolve) => testServer.listen(testPort, '127.0.0.1', () => resolve()));

  try {
    // =========================================================================
    // 1. SUCCESSFUL LOGIN TESTS
    // =========================================================================
    console.log('\n--- 1. Successful Login Tests ---');

    // Super Admin login
    const adminLogin = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: env.SEED_ADMIN_EMAIL,
      password: env.SEED_ADMIN_PASSWORD,
    });
    recordTest(
      'Login',
      'Super Admin Login',
      adminLogin.status === 200 && !!adminLogin.body.data?.token,
      `Status: ${adminLogin.status}, Role: ${adminLogin.body.data?.user?.role?.name}`
    );
    const adminToken = adminLogin.body.data?.token;

    // Manager login
    const managerLogin = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: env.SEED_MANAGER_EMAIL,
      password: env.SEED_MANAGER_PASSWORD,
    });
    recordTest(
      'Login',
      'Manager Login',
      managerLogin.status === 200 && !!managerLogin.body.data?.token,
      `Status: ${managerLogin.status}, Role: ${managerLogin.body.data?.user?.role?.name}`
    );
    const managerToken = managerLogin.body.data?.token;

    // Agent login
    const agentLogin = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: env.SEED_AGENT_EMAIL,
      password: env.SEED_AGENT_PASSWORD,
    });
    recordTest(
      'Login',
      'Agent Login',
      agentLogin.status === 200 && !!agentLogin.body.data?.token,
      `Status: ${agentLogin.status}, Role: ${agentLogin.body.data?.user?.role?.name}`
    );
    const agentToken = agentLogin.body.data?.token;

    // Client login
    const clientLogin = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: env.SEED_CLIENT_EMAIL,
      password: env.SEED_CLIENT_PASSWORD,
    });
    recordTest(
      'Login',
      'Client Login',
      clientLogin.status === 200 && !!clientLogin.body.data?.token,
      `Status: ${clientLogin.status}, Role: ${clientLogin.body.data?.user?.role?.name}`
    );
    const clientToken = clientLogin.body.data?.token;

    // Security Check: passwordHash is NEVER exposed in login response
    const hasLeakedHash =
      'passwordHash' in (adminLogin.body.data?.user || {}) ||
      'password' in (adminLogin.body.data?.user || {});
    recordTest(
      'Security',
      'Password Hash Stripped from User Payload',
      !hasLeakedHash,
      'passwordHash field is excluded from response'
    );

    // =========================================================================
    // 2. WRONG PASSWORD & INVALID CREDENTIALS TESTS
    // =========================================================================
    console.log('\n--- 2. Wrong Password Tests ---');

    const wrongPasswordRes = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: env.SEED_ADMIN_EMAIL,
      password: 'DefectivePassword123!',
    });
    recordTest(
      'Auth Failure',
      'Wrong Password Rejection (401)',
      wrongPasswordRes.status === 401 && wrongPasswordRes.body.success === false,
      `Status: ${wrongPasswordRes.status}, Error: ${getErrorMessage(wrongPasswordRes.body)}`
    );

    const nonExistentUserRes = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: 'ghost-user-nonexistent@domain.com',
      password: 'SomePassword123!',
    });
    recordTest(
      'Auth Failure',
      'Non-existent User Rejection (401)',
      nonExistentUserRes.status === 401,
      `Status: ${nonExistentUserRes.status}`
    );

    // =========================================================================
    // 3. DISABLED / SUSPENDED ACCOUNT TESTS
    // =========================================================================
    console.log('\n--- 3. Disabled / Suspended Account Tests ---');

    const suspendedRes = await makeRequest(testPort, 'POST', '/api/auth/login', {
      email: 'disabled@smshub.local',
      password: env.SEED_CLIENT_PASSWORD,
    });
    recordTest(
      'Account Status',
      'Suspended Account Login Blocked (403)',
      suspendedRes.status === 403 && getErrorCode(suspendedRes.body) === 'ACCOUNT_SUSPENDED',
      `Status: ${suspendedRes.status}, Code: ${getErrorCode(suspendedRes.body)}`
    );

    // =========================================================================
    // 4. UNAUTHORIZED ENDPOINT ACCESS TESTS
    // =========================================================================
    console.log('\n--- 4. Unauthorized Endpoint Tests ---');

    // Request without Authorization header
    const noAuthRes = await makeRequest(testPort, 'GET', '/api/auth/me');
    recordTest(
      'Unauthorized',
      'Missing Token Rejected (401)',
      noAuthRes.status === 401 && getErrorCode(noAuthRes.body) === 'UNAUTHORIZED',
      `Status: ${noAuthRes.status}, Code: ${getErrorCode(noAuthRes.body)}`
    );

    // Request with malformed / invalid token
    const badTokenRes = await makeRequest(
      testPort,
      'GET',
      '/api/auth/me',
      undefined,
      'invalid-malformed-token-string'
    );
    recordTest(
      'Unauthorized',
      'Malformed Token Rejected (401)',
      badTokenRes.status === 401 && getErrorCode(badTokenRes.body) === 'INVALID_TOKEN',
      `Status: ${badTokenRes.status}, Code: ${getErrorCode(badTokenRes.body)}`
    );

    // =========================================================================
    // 5. FORBIDDEN ENDPOINT & PERMISSION CHECKS
    // =========================================================================
    console.log('\n--- 5. Forbidden Endpoint & Permission Tests ---');

    // Endpoint: /api/demo/billing-manage requires 'billing.manage'
    // Super Admin should PASS
    const adminBillingRes = await makeRequest(
      testPort,
      'GET',
      '/api/demo/billing-manage',
      undefined,
      adminToken
    );
    recordTest(
      'Permissions',
      'Super Admin billing.manage access allowed',
      adminBillingRes.status === 200,
      `Status: ${adminBillingRes.status}`
    );

    // Manager should PASS ('billing.manage' is granted to Manager)
    const managerBillingRes = await makeRequest(
      testPort,
      'GET',
      '/api/demo/billing-manage',
      undefined,
      managerToken
    );
    recordTest(
      'Permissions',
      'Manager billing.manage access allowed',
      managerBillingRes.status === 200,
      `Status: ${managerBillingRes.status}`
    );

    // Client should FAIL (403 Forbidden - does not have 'billing.manage')
    const clientBillingRes = await makeRequest(
      testPort,
      'GET',
      '/api/demo/billing-manage',
      undefined,
      clientToken
    );
    recordTest(
      'Permissions',
      'Client billing.manage Forbidden (403)',
      clientBillingRes.status === 403 && getErrorCode(clientBillingRes.body) === 'FORBIDDEN',
      `Status: ${clientBillingRes.status}, Error: ${getErrorMessage(clientBillingRes.body)}`
    );

    // =========================================================================
    // 6. ROLE RESTRICTIONS TESTS
    // =========================================================================
    console.log('\n--- 6. Role Restrictions Tests ---');

    // /api/demo/admin-only requires role 'SUPER_ADMIN'
    const adminOnAdminRes = await makeRequest(
      testPort,
      'GET',
      '/api/demo/admin-only',
      undefined,
      adminToken
    );
    recordTest(
      'Role Restrictions',
      'Super Admin accesses admin-only route (200)',
      adminOnAdminRes.status === 200,
      `Status: ${adminOnAdminRes.status}`
    );

    const managerOnAdminRes = await makeRequest(
      testPort,
      'GET',
      '/api/demo/admin-only',
      undefined,
      managerToken
    );
    recordTest(
      'Role Restrictions',
      'Manager blocked from admin-only route (403)',
      managerOnAdminRes.status === 403 && getErrorCode(managerOnAdminRes.body) === 'ROLE_RESTRICTED',
      `Status: ${managerOnAdminRes.status}, Code: ${getErrorCode(managerOnAdminRes.body)}`
    );

    const agentOnAdminRes = await makeRequest(
      testPort,
      'GET',
      '/api/demo/admin-only',
      undefined,
      agentToken
    );
    recordTest(
      'Role Restrictions',
      'Agent blocked from admin-only route (403)',
      agentOnAdminRes.status === 403,
      `Status: ${agentOnAdminRes.status}`
    );

    // =========================================================================
    // 7. ROLE ESCALATION PREVENTION TESTS
    // =========================================================================
    console.log('\n--- 7. Role Escalation Prevention Tests ---');

    // Manager attempts to create a SUPER_ADMIN user
    const escalationAttempt1 = await makeRequest(
      testPort,
      'POST',
      '/api/users',
      {
        email: 'illegal-admin@domain.com',
        password: 'Password123!',
        role: 'SUPER_ADMIN',
      },
      managerToken
    );
    recordTest(
      'Anti-Escalation',
      'Manager cannot create SUPER_ADMIN user (403)',
      escalationAttempt1.status === 403 && getErrorCode(escalationAttempt1.body) === 'ROLE_ESCALATION_DENIED',
      `Status: ${escalationAttempt1.status}, Code: ${getErrorCode(escalationAttempt1.body)}`
    );

    // Manager attempts to create another MANAGER user (equal rank escalation)
    const escalationAttempt2 = await makeRequest(
      testPort,
      'POST',
      '/api/users',
      {
        email: 'illegal-manager@domain.com',
        password: 'Password123!',
        role: 'MANAGER',
      },
      managerToken
    );
    recordTest(
      'Anti-Escalation',
      'Manager cannot create equal MANAGER user (403)',
      escalationAttempt2.status === 403 && getErrorCode(escalationAttempt2.body) === 'ROLE_ESCALATION_DENIED',
      `Status: ${escalationAttempt2.status}, Code: ${getErrorCode(escalationAttempt2.body)}`
    );

    // Manager CAN create an AGENT user (lower rank)
    const validSubUser = await makeRequest(
      testPort,
      'POST',
      '/api/users',
      {
        email: `new-agent-${Date.now()}@domain.com`,
        password: 'SecureAgentPassword123!',
        role: 'AGENT',
        firstName: 'Sub',
        lastName: 'Agent',
      },
      managerToken
    );
    recordTest(
      'Anti-Escalation',
      'Manager allowed to create lower-rank AGENT user (201)',
      validSubUser.status === 201 && validSubUser.body.data?.user?.role?.name === 'AGENT',
      `Status: ${validSubUser.status}, User ID: ${validSubUser.body.data?.user?.id}`
    );

    // =========================================================================
    // 8. LOGOUT & SESSION INVALIDATION TESTS
    // =========================================================================
    console.log('\n--- 8. Logout & Session Invalidation Tests ---');

    // Verify token works before logout
    const preLogoutRes = await makeRequest(testPort, 'GET', '/api/auth/me', undefined, clientToken);
    recordTest(
      'Session',
      'Token is valid before logout',
      preLogoutRes.status === 200,
      `Status: ${preLogoutRes.status}`
    );

    // Execute logout
    const logoutRes = await makeRequest(testPort, 'POST', '/api/auth/logout', {}, clientToken);
    recordTest(
      'Session',
      'Logout request succeeds (200)',
      logoutRes.status === 200 && logoutRes.body.data?.revoked === true,
      `Status: ${logoutRes.status}`
    );

    // Attempt to use revoked token again
    const postLogoutRes = await makeRequest(testPort, 'GET', '/api/auth/me', undefined, clientToken);
    recordTest(
      'Session',
      'Revoked token rejected on subsequent request (401)',
      postLogoutRes.status === 401 && getErrorCode(postLogoutRes.body) === 'INVALID_TOKEN',
      `Status: ${postLogoutRes.status}, Code: ${getErrorCode(postLogoutRes.body)}`
    );

    // =========================================================================
    // 9. AUDIT LOGGING TESTS
    // =========================================================================
    console.log('\n--- 9. Audit Logging Tests ---');

    const auditRes = await makeRequest(testPort, 'GET', '/api/audit-logs', undefined, adminToken);
    const logs = auditRes.body.data?.logs || [];
    const hasLoginSuccess = logs.some((l: any) => l.action === 'LOGIN_SUCCESS');
    const hasLoginFailed = logs.some((l: any) => l.action === 'LOGIN_FAILED');
    const hasLogout = logs.some((l: any) => l.action === 'LOGOUT');

    recordTest(
      'Audit Trail',
      'Audit log contains LOGIN_SUCCESS records',
      hasLoginSuccess,
      `Logs checked: ${logs.length}`
    );
    recordTest(
      'Audit Trail',
      'Audit log contains LOGIN_FAILED records',
      hasLoginFailed,
      `Logs checked: ${logs.length}`
    );
    recordTest(
      'Audit Trail',
      'Audit log contains LOGOUT records',
      hasLogout,
      `Logs checked: ${logs.length}`
    );

    // Non-admin attempting to view audit logs (requires 'audit.view')
    const agentAuditRes = await makeRequest(testPort, 'GET', '/api/audit-logs', undefined, agentToken);
    recordTest(
      'Audit Trail',
      'Agent forbidden from audit logs (403)',
      agentAuditRes.status === 403,
      `Status: ${agentAuditRes.status}`
    );

    // =========================================================================
    // SUMMARY
    // =========================================================================
    console.log('\n================================================================');
    console.log('               PHASE 03 AUTH & RBAC TEST REPORT                 ');
    console.log('================================================================');
    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = total - passed;

    console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
    if (failed === 0) {
      console.log('🎉 ALL Phase 03 Authentication & RBAC tests passed successfully!');
    } else {
      console.error(`❌ ${failed} tests failed.`);
      process.exit(1);
    }
  } finally {
    testServer.close();
  }
}

runAuthTests().catch((err) => {
  console.error('Test run failed with unhandled error:', err);
  process.exit(1);
});
