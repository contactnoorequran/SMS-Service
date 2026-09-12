import crypto from 'crypto';
import { env } from '../config/env';
import {
  ClientListItem,
  ClientDetail,
  ClientDashboardData,
  CreateClientDTO,
  UpdateClientDTO,
  ConfigureClientApiDTO,
  ClientListQuery,
  PaginatedClients,
  ClientStatus,
  BillingType,
  ApiAccessStatus,
  ClientAssignedNumber,
  ClientSmsStatistics,
  ClientRecentSms,
  ClientBalanceInfo,
  ClientActivity,
  ClientApiCredential,
} from '../types/client';
import { AuthTokenPayload } from '../types/auth';
import { UserRepository } from './user.repository';
import { AuditService } from './audit.service';
import { ManagerService } from './manager.service';
import { AgentService } from './agent.service';
import { DEFAULT_ROLE_PERMISSIONS } from './permissions.service';
import { Logger } from '../utils/logger';

const logger = new Logger('ClientService');

interface StoredClientRecord {
  id: string; // cli-prof-001
  userId: string; // user-client-sophia
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  contact: string;
  billingType: BillingType;
  status: ClientStatus;
  managerId: string | null;
  agentId: string | null;
  balance: number;
  creditLimit: number;
  currency: string;
  lastRechargeDate: string | null;
  lastRechargeAmount: number | null;
  totalSpent: number;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  numbers: ClientAssignedNumber[];
  recentSms: ClientRecentSms[];
  smsStats: ClientSmsStatistics;
  apiCredentials: ClientApiCredential[];
}

const clientRegistry: Map<string, StoredClientRecord> = new Map();
let isInitialized = false;

export class ClientService {
  /**
   * Initializes seed clients matching platform managers, agents, and number inventory.
   */
  static async initializeSeedClients(): Promise<void> {
    if (isInitialized) return;

    // Ensure users and agents are ready
    await UserRepository.initializeSeedUsers();
    await AgentService.initializeSeedAgents();
    await ManagerService.initializeSeedManagers();

    const now = Date.now();
    const seedClients: StoredClientRecord[] = [
      {
        id: 'cli-prof-001',
        userId: 'user-client-sophia',
        username: 'sophia.chen',
        firstName: 'Sophia',
        lastName: 'Chen',
        email: env.SEED_CLIENT_EMAIL.toLowerCase(),
        companyName: 'NovaTech Global Enterprise',
        contact: '+1 (415) 555-0198',
        billingType: 'PREPAID',
        status: 'ACTIVE',
        managerId: 'mgr-profile-001', // Elena Rostova
        agentId: 'agent-prof-001', // Marcus Brody
        balance: 14850.0,
        creditLimit: 25000.0,
        currency: 'USD',
        lastRechargeDate: new Date(now - 5 * 86400000).toISOString(),
        lastRechargeAmount: 5000.0,
        totalSpent: 42100.0,
        permissions: [...DEFAULT_ROLE_PERMISSIONS.CLIENT],
        createdAt: new Date(now - 60 * 86400000).toISOString(),
        updatedAt: new Date(now - 2 * 86400000).toISOString(),
        lastLoginAt: new Date(now - 3 * 3600000).toISOString(),
        numbers: [
          {
            id: 'num-001',
            e164Number: '+14155552671',
            country: 'United States',
            countryCode: 'US',
            operator: 'Twilio US Carrier',
            status: 'ASSIGNED',
            capabilities: 'SMS, 2FA, VOICE',
            assignedAt: new Date(now - 45 * 86400000).toISOString(),
            monthlyCost: 2.5,
          },
          {
            id: 'num-002',
            e164Number: '+14155552672',
            country: 'United States',
            countryCode: 'US',
            operator: 'Bandwidth Tier 1',
            status: 'ASSIGNED',
            capabilities: 'SMS, 2FA',
            assignedAt: new Date(now - 30 * 86400000).toISOString(),
            monthlyCost: 2.0,
          },
          {
            id: 'num-003',
            e164Number: '+447700900123',
            country: 'United Kingdom',
            countryCode: 'GB',
            operator: 'Vodafone UK',
            status: 'ASSIGNED',
            capabilities: 'SMS',
            assignedAt: new Date(now - 20 * 86400000).toISOString(),
            monthlyCost: 3.0,
          },
        ],
        recentSms: [
          {
            id: 'sms-001',
            sender: 'NovaAuth',
            recipient: '+14155552671',
            message: 'Your NovaTech security verification code is: 849201. Valid for 10 minutes.',
            direction: 'OUTBOUND',
            status: 'DELIVERED',
            timestamp: new Date(now - 15 * 60000).toISOString(),
            cost: 0.015,
          },
          {
            id: 'sms-002',
            sender: '+14159821034',
            recipient: '+14155552671',
            message: 'STOP',
            direction: 'INBOUND',
            status: 'RECEIVED',
            timestamp: new Date(now - 45 * 60000).toISOString(),
            cost: 0.0,
          },
          {
            id: 'sms-003',
            sender: 'NovaAuth',
            recipient: '+447700900123',
            message: 'Your one-time login passcode is 492104. Do not share with anyone.',
            direction: 'OUTBOUND',
            status: 'DELIVERED',
            timestamp: new Date(now - 2 * 3600000).toISOString(),
            cost: 0.022,
          },
        ],
        smsStats: {
          totalSms: 148920,
          deliveredSms: 146687,
          failedSms: 1823,
          pendingSms: 410,
          successRate: 98.5,
          totalSpent: 42100.0,
          dailyVolume: [
            { date: '2026-09-06', count: 4820, delivered: 4760, failed: 60 },
            { date: '2026-09-07', count: 5120, delivered: 5040, failed: 80 },
            { date: '2026-09-08', count: 5340, delivered: 5260, failed: 80 },
            { date: '2026-09-09', count: 4980, delivered: 4910, failed: 70 },
            { date: '2026-09-10', count: 5610, delivered: 5520, failed: 90 },
            { date: '2026-09-11', count: 5890, delivered: 5800, failed: 90 },
            { date: '2026-09-12', count: 3200, delivered: 3150, failed: 50 },
          ],
        },
        apiCredentials: [
          {
            id: 'api-cred-001',
            clientId: 'key_live_novatech_prod_8f1a',
            clientSecret: 'sec_live_••••••••••••94f2',
            name: 'Production Auth Service',
            status: 'ACTIVE',
            rateLimit: 120,
            ipWhitelist: ['198.51.100.14', '198.51.100.15'],
            lastUsedAt: new Date(now - 12 * 60000).toISOString(),
            createdAt: new Date(now - 45 * 86400000).toISOString(),
            updatedAt: new Date(now - 10 * 86400000).toISOString(),
          },
        ],
      },
      {
        id: 'cli-prof-002',
        userId: 'user-client-velocity',
        username: 'david.vance',
        firstName: 'David',
        lastName: 'Vance',
        email: 'security@velocity-pay.com',
        companyName: 'Velocity Payment Systems',
        contact: '+1 (212) 555-0145',
        billingType: 'PREPAID',
        status: 'ACTIVE',
        managerId: 'mgr-profile-001', // Elena Rostova
        agentId: 'agent-prof-001', // Marcus Brody
        balance: 35000.0,
        creditLimit: 50000.0,
        currency: 'USD',
        lastRechargeDate: new Date(now - 3 * 86400000).toISOString(),
        lastRechargeAmount: 15000.0,
        totalSpent: 89400.0,
        permissions: [...DEFAULT_ROLE_PERMISSIONS.CLIENT],
        createdAt: new Date(now - 90 * 86400000).toISOString(),
        updatedAt: new Date(now - 1 * 86400000).toISOString(),
        lastLoginAt: new Date(now - 5 * 3600000).toISOString(),
        numbers: [
          {
            id: 'num-004',
            e164Number: '+12125550188',
            country: 'United States',
            countryCode: 'US',
            operator: 'AT&T Mobility',
            status: 'ASSIGNED',
            capabilities: 'SMS, 2FA',
            assignedAt: new Date(now - 70 * 86400000).toISOString(),
            monthlyCost: 3.5,
          },
        ],
        recentSms: [
          {
            id: 'sms-004',
            sender: 'VelocityPay',
            recipient: '+12125550188',
            message: 'Transaction OTP: 938210. Approved purchase of $249.00.',
            direction: 'OUTBOUND',
            status: 'DELIVERED',
            timestamp: new Date(now - 8 * 60000).toISOString(),
            cost: 0.018,
          },
        ],
        smsStats: {
          totalSms: 320400,
          deliveredSms: 317500,
          failedSms: 2400,
          pendingSms: 500,
          successRate: 99.1,
          totalSpent: 89400.0,
          dailyVolume: [
            { date: '2026-09-11', count: 12400, delivered: 12300, failed: 100 },
            { date: '2026-09-12', count: 7800, delivered: 7740, failed: 60 },
          ],
        },
        apiCredentials: [
          {
            id: 'api-cred-002',
            clientId: 'key_live_velocity_pay_3b91',
            clientSecret: 'sec_live_••••••••••••10ab',
            name: 'Payment Gateway Live API',
            status: 'ACTIVE',
            rateLimit: 300,
            ipWhitelist: ['203.0.113.50'],
            lastUsedAt: new Date(now - 5 * 60000).toISOString(),
            createdAt: new Date(now - 80 * 86400000).toISOString(),
            updatedAt: new Date(now - 80 * 86400000).toISOString(),
          },
        ],
      },
      {
        id: 'cli-prof-003',
        userId: 'user-client-sterling',
        username: 'oliver.sterling',
        firstName: 'Oliver',
        lastName: 'Sterling',
        email: 'oliver.s@sterling-bank.co.uk',
        companyName: 'Sterling UK Banking Group',
        contact: '+44 20 7946 0991',
        billingType: 'POSTPAID',
        status: 'ACTIVE',
        managerId: 'mgr-profile-002', // Viktor Kraus
        agentId: 'agent-prof-003', // Liam O'Connor
        balance: 9200.0,
        creditLimit: 30000.0,
        currency: 'USD',
        lastRechargeDate: new Date(now - 14 * 86400000).toISOString(),
        lastRechargeAmount: 10000.0,
        totalSpent: 28400.0,
        permissions: [...DEFAULT_ROLE_PERMISSIONS.CLIENT],
        createdAt: new Date(now - 50 * 86400000).toISOString(),
        updatedAt: new Date(now - 4 * 86400000).toISOString(),
        lastLoginAt: new Date(now - 18 * 3600000).toISOString(),
        numbers: [
          {
            id: 'num-008',
            e164Number: '+442079460111',
            country: 'United Kingdom',
            countryCode: 'GB',
            operator: 'BT Mobile',
            status: 'ASSIGNED',
            capabilities: 'SMS, 2FA',
            assignedAt: new Date(now - 40 * 86400000).toISOString(),
            monthlyCost: 2.8,
          },
        ],
        recentSms: [],
        smsStats: {
          totalSms: 84000,
          deliveredSms: 82900,
          failedSms: 900,
          pendingSms: 200,
          successRate: 98.7,
          totalSpent: 28400.0,
          dailyVolume: [],
        },
        apiCredentials: [],
      },
      {
        id: 'cli-prof-004',
        userId: 'user-client-cloudotp',
        username: 'meiling.tan',
        firstName: 'Mei-Ling',
        lastName: 'Tan',
        email: 'meiling@cloudotp.sg',
        companyName: 'CloudOTP Global Auth Ltd',
        contact: '+65 6789 0120',
        billingType: 'PREPAID',
        status: 'ACTIVE',
        managerId: 'mgr-profile-003', // Marcus Vance
        agentId: 'agent-prof-004', // Kenji Takahashi
        balance: 4120.0,
        creditLimit: 15000.0,
        currency: 'USD',
        lastRechargeDate: new Date(now - 10 * 86400000).toISOString(),
        lastRechargeAmount: 3000.0,
        totalSpent: 16500.0,
        permissions: [...DEFAULT_ROLE_PERMISSIONS.CLIENT],
        createdAt: new Date(now - 45 * 86400000).toISOString(),
        updatedAt: new Date(now - 3 * 86400000).toISOString(),
        lastLoginAt: new Date(now - 8 * 3600000).toISOString(),
        numbers: [
          {
            id: 'num-010',
            e164Number: '+6567890124',
            country: 'Singapore',
            countryCode: 'SG',
            operator: 'Singtel Mobile',
            status: 'ASSIGNED',
            capabilities: 'SMS',
            assignedAt: new Date(now - 40 * 86400000).toISOString(),
            monthlyCost: 3.2,
          },
        ],
        recentSms: [],
        smsStats: {
          totalSms: 54200,
          deliveredSms: 53500,
          failedSms: 600,
          pendingSms: 100,
          successRate: 98.7,
          totalSpent: 16500.0,
          dailyVolume: [],
        },
        apiCredentials: [],
      },
      {
        id: 'cli-prof-005',
        userId: 'user-client-swiftpay',
        username: 'alicia.keyser',
        firstName: 'Alicia',
        lastName: 'Keyser',
        email: 'alicia@swiftpay-mobile.io',
        companyName: 'SwiftPay Mobile Authentication',
        contact: '+1 (312) 555-0182',
        billingType: 'PREPAID',
        status: 'ACTIVE',
        managerId: 'mgr-profile-001', // Elena Rostova
        agentId: 'agent-prof-001', // Marcus Brody
        balance: 8200.0,
        creditLimit: 20000.0,
        currency: 'USD',
        lastRechargeDate: new Date(now - 7 * 86400000).toISOString(),
        lastRechargeAmount: 4000.0,
        totalSpent: 22100.0,
        permissions: [...DEFAULT_ROLE_PERMISSIONS.CLIENT],
        createdAt: new Date(now - 35 * 86400000).toISOString(),
        updatedAt: new Date(now - 2 * 86400000).toISOString(),
        lastLoginAt: new Date(now - 24 * 3600000).toISOString(),
        numbers: [],
        recentSms: [],
        smsStats: {
          totalSms: 72100,
          deliveredSms: 71200,
          failedSms: 800,
          pendingSms: 100,
          successRate: 98.8,
          totalSpent: 22100.0,
          dailyVolume: [],
        },
        apiCredentials: [],
      },
      {
        id: 'cli-prof-006',
        userId: 'user-client-mumbaifin',
        username: 'rajesh.nair',
        firstName: 'Rajesh',
        lastName: 'Nair',
        email: 'ops@mumbai-fintech.in',
        companyName: 'Mumbai FinTech Gateway',
        contact: '+91 22 2847 9000',
        billingType: 'PREPAID',
        status: 'ACTIVE',
        managerId: 'mgr-profile-001', // Elena Rostova
        agentId: 'agent-prof-002', // Priya Sharma
        balance: 12400.0,
        creditLimit: 25000.0,
        currency: 'USD',
        lastRechargeDate: new Date(now - 4 * 86400000).toISOString(),
        lastRechargeAmount: 6000.0,
        totalSpent: 38200.0,
        permissions: [...DEFAULT_ROLE_PERMISSIONS.CLIENT],
        createdAt: new Date(now - 30 * 86400000).toISOString(),
        updatedAt: new Date(now - 2 * 86400000).toISOString(),
        lastLoginAt: new Date(now - 6 * 3600000).toISOString(),
        numbers: [
          {
            id: 'num-006',
            e164Number: '+919820012345',
            country: 'India',
            countryCode: 'IN',
            operator: 'Airtel India',
            status: 'ASSIGNED',
            capabilities: 'SMS, 2FA',
            assignedAt: new Date(now - 25 * 86400000).toISOString(),
            monthlyCost: 1.8,
          },
        ],
        recentSms: [],
        smsStats: {
          totalSms: 112000,
          deliveredSms: 110400,
          failedSms: 1400,
          pendingSms: 200,
          successRate: 98.6,
          totalSpent: 38200.0,
          dailyVolume: [],
        },
        apiCredentials: [],
      },
      {
        id: 'cli-prof-007',
        userId: 'user-client-delhiretail',
        username: 'aarav.patel',
        firstName: 'Aarav',
        lastName: 'Patel',
        email: 'admin@delhi-retail-otp.com',
        companyName: 'Delhi Retail Express',
        contact: '+91 11 4152 8000',
        billingType: 'PREPAID',
        status: 'ACTIVE',
        managerId: 'mgr-profile-001', // Elena Rostova
        agentId: 'agent-prof-002', // Priya Sharma
        balance: 3800.0,
        creditLimit: 10000.0,
        currency: 'USD',
        lastRechargeDate: new Date(now - 12 * 86400000).toISOString(),
        lastRechargeAmount: 2000.0,
        totalSpent: 11400.0,
        permissions: [...DEFAULT_ROLE_PERMISSIONS.CLIENT],
        createdAt: new Date(now - 20 * 86400000).toISOString(),
        updatedAt: new Date(now - 1 * 86400000).toISOString(),
        lastLoginAt: new Date(now - 14 * 3600000).toISOString(),
        numbers: [],
        recentSms: [],
        smsStats: {
          totalSms: 31000,
          deliveredSms: 30450,
          failedSms: 500,
          pendingSms: 50,
          successRate: 98.2,
          totalSpent: 11400.0,
          dailyVolume: [],
        },
        apiCredentials: [],
      },
      {
        id: 'cli-prof-008',
        userId: 'user-client-dubai-fin',
        username: 'zayed.alfahim',
        firstName: 'Zayed',
        lastName: 'Al-Fahim',
        email: 'zayed@dubai-fin.ae',
        companyName: 'Emirates Secure Gateway LLC',
        contact: '+971 4 800 2345',
        billingType: 'PREPAID',
        status: 'ACTIVE',
        managerId: null, // Unassigned manager
        agentId: 'agent-prof-005', // Tariq Mansoor
        balance: 5500.0,
        creditLimit: 15000.0,
        currency: 'USD',
        lastRechargeDate: new Date(now - 6 * 86400000).toISOString(),
        lastRechargeAmount: 3000.0,
        totalSpent: 18900.0,
        permissions: [...DEFAULT_ROLE_PERMISSIONS.CLIENT],
        createdAt: new Date(now - 20 * 86400000).toISOString(),
        updatedAt: new Date(now - 2 * 86400000).toISOString(),
        lastLoginAt: new Date(now - 12 * 3600000).toISOString(),
        numbers: [
          {
            id: 'num-012',
            e164Number: '+971501234567',
            country: 'United Arab Emirates',
            countryCode: 'AE',
            operator: 'Etisalat UAE',
            status: 'ASSIGNED',
            capabilities: 'SMS, 2FA',
            assignedAt: new Date(now - 18 * 86400000).toISOString(),
            monthlyCost: 4.0,
          },
        ],
        recentSms: [],
        smsStats: {
          totalSms: 48900,
          deliveredSms: 48200,
          failedSms: 600,
          pendingSms: 100,
          successRate: 98.6,
          totalSpent: 18900.0,
          dailyVolume: [],
        },
        apiCredentials: [],
      },
      {
        id: 'cli-prof-009',
        userId: 'user-client-paris-sms',
        username: 'camille.renard',
        firstName: 'Camille',
        lastName: 'Renard',
        email: 'c.renard@paris-express.fr',
        companyName: 'Paris Express Messaging',
        contact: '+33 1 42 68 55 20',
        billingType: 'PREPAID',
        status: 'SUSPENDED',
        managerId: 'mgr-profile-002', // Viktor Kraus
        agentId: 'agent-prof-006', // Clara Dubois
        balance: 2100.0,
        creditLimit: 10000.0,
        currency: 'USD',
        lastRechargeDate: new Date(now - 20 * 86400000).toISOString(),
        lastRechargeAmount: 1500.0,
        totalSpent: 9800.0,
        permissions: ['numbers.view', 'sms.view'],
        createdAt: new Date(now - 50 * 86400000).toISOString(),
        updatedAt: new Date(now - 10 * 86400000).toISOString(),
        lastLoginAt: new Date(now - 12 * 86400000).toISOString(),
        numbers: [
          {
            id: 'num-014',
            e164Number: '+33612345678',
            country: 'France',
            countryCode: 'FR',
            operator: 'Orange France',
            status: 'ASSIGNED',
            capabilities: 'SMS',
            assignedAt: new Date(now - 50 * 86400000).toISOString(),
            monthlyCost: 2.2,
          },
        ],
        recentSms: [],
        smsStats: {
          totalSms: 24500,
          deliveredSms: 23900,
          failedSms: 500,
          pendingSms: 100,
          successRate: 97.5,
          totalSpent: 9800.0,
          dailyVolume: [],
        },
        apiCredentials: [],
      },
      {
        id: 'cli-prof-010',
        userId: 'user-client-dormant',
        username: 'dormant.account',
        firstName: 'Dormant',
        lastName: 'Account',
        email: 'disabled@smshub.local',
        companyName: 'Dormant Security Corp',
        contact: '+1 (800) 555-0100',
        billingType: 'PREPAID',
        status: 'SUSPENDED',
        managerId: 'mgr-profile-001',
        agentId: 'agent-prof-001',
        balance: 0.0,
        creditLimit: 0.0,
        currency: 'USD',
        lastRechargeDate: null,
        lastRechargeAmount: null,
        totalSpent: 0.0,
        permissions: [],
        createdAt: new Date(now - 90 * 86400000).toISOString(),
        updatedAt: new Date(now - 30 * 86400000).toISOString(),
        lastLoginAt: null,
        numbers: [],
        recentSms: [],
        smsStats: {
          totalSms: 0,
          deliveredSms: 0,
          failedSms: 0,
          pendingSms: 0,
          successRate: 100.0,
          totalSpent: 0.0,
          dailyVolume: [],
        },
        apiCredentials: [],
      },
    ];

    for (const client of seedClients) {
      clientRegistry.set(client.id, client);

      // Ensure user account exists in UserRepository
      const existingUser = await UserRepository.findByEmail(client.email);
      if (!existingUser) {
        try {
          await UserRepository.createUser({
            email: client.email,
            passwordRaw: env.SEED_CLIENT_PASSWORD,
            role: 'CLIENT',
            firstName: client.firstName,
            lastName: client.lastName,
            status: client.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
            managerId: client.managerId,
            agentId: client.agentId,
            clientId: client.id,
          });
        } catch {
          // ignore if already existing
        }
      }
    }

    isInitialized = true;
    logger.info(`Client repository initialized with ${clientRegistry.size} client profiles.`);
  }

  /**
   * Helper: Resolves manager profile information.
   */
  private static async getManagerInfo(managerId: string | null) {
    if (!managerId) return null;
    const mgr = await ManagerService.getManagerById(managerId);
    if (!mgr) return null;
    return {
      id: mgr.id,
      userId: mgr.userId,
      name: mgr.name,
      email: mgr.email,
      department: mgr.department,
    };
  }

  /**
   * Helper: Resolves agent profile information.
   */
  private static async getAgentInfo(agentId: string | null) {
    if (!agentId) return null;
    const all = await AgentService.listAgents({ limit: 100 }, {
      userId: 'system',
      email: 'system@smshub.local',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      tokenId: 'sys',
    });
    const agent = all.items.find((a) => a.id === agentId);
    if (!agent) return null;
    return {
      id: agent.id,
      userId: agent.userId,
      name: agent.name,
      email: agent.email,
      commissionRate: agent.commissionRate,
    };
  }

  /**
   * Helper: Resolves ManagerProfile ID associated with an actor (if actor is MANAGER).
   */
  static async resolveActorManagerId(actor: AuthTokenPayload): Promise<string | null> {
    if (actor.role !== 'MANAGER') return null;
    const mgr = await ManagerService.getManagerByUserId(actor.userId);
    if (mgr) return mgr.id;
    const all = await ManagerService.listManagers({ limit: 100 });
    const match = all.items.find((m) => m.email.toLowerCase() === actor.email.toLowerCase());
    return match ? match.id : null;
  }

  /**
   * Helper: Resolves AgentProfile ID associated with an actor (if actor is AGENT).
   */
  static async resolveActorAgentId(actor: AuthTokenPayload): Promise<string | null> {
    if (actor.role !== 'AGENT') return null;
    const all = await AgentService.listAgents({ limit: 100 }, {
      userId: 'system',
      email: 'system@smshub.local',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      tokenId: 'sys',
    });
    const match = all.items.find(
      (a) => a.userId === actor.userId || a.email.toLowerCase() === actor.email.toLowerCase()
    );
    return match ? match.id : null;
  }

  /**
   * Helper: Resolves ClientProfile ID associated with an actor (if actor is CLIENT).
   */
  static async resolveActorClientId(actor: AuthTokenPayload): Promise<string | null> {
    if (actor.role !== 'CLIENT') return null;
    await this.initializeSeedClients();
    for (const c of clientRegistry.values()) {
      if (
        c.userId === actor.userId ||
        c.id === actor.userId ||
        c.email.toLowerCase() === actor.email.toLowerCase()
      ) {
        return c.id;
      }
    }
    return null;
  }

  /**
   * Scope Authorization Validator:
   * Enforces that the actor has legal permission to view or manage the targeted client.
   * - Super Admin: unrestricted.
   * - Manager: client.managerId === actor's ManagerProfile ID OR client's agent belongs to this manager.
   * - Agent: client.agentId === actor's AgentProfile ID.
   * - Client: client.userId === actor.userId OR client.id === actor.userId OR client.email === actor.email.
   * Throws Error with 403 Forbidden semantics if unauthorized.
   */
  static async assertAccess(
    clientId: string,
    actor: AuthTokenPayload,
    actionDesc: string = 'access'
  ): Promise<StoredClientRecord> {
    await this.initializeSeedClients();

    // Support 'me' alias
    if (clientId === 'me') {
      const resolvedId = await this.resolveActorClientId(actor);
      if (!resolvedId) {
        throw new Error("Client profile not found for authenticated user.");
      }
      clientId = resolvedId;
    }

    // Lookup client by ID or userId
    let client = clientRegistry.get(clientId);
    if (!client) {
      for (const c of clientRegistry.values()) {
        if (c.userId === clientId) {
          client = c;
          break;
        }
      }
    }

    if (!client) {
      throw new Error(`Client with ID '${clientId}' not found.`);
    }

    // 1. Super Admin: full unrestricted access
    if (actor.role === 'SUPER_ADMIN') {
      return client;
    }

    // 2. Manager: scoped to clients in this manager's portfolio (either directly or via their agents)
    if (actor.role === 'MANAGER') {
      const actorManagerId = await this.resolveActorManagerId(actor);
      if (!actorManagerId) {
        throw new Error(
          `Forbidden: Insufficient scope. You can only ${actionDesc} clients within your operational managerial hierarchy.`
        );
      }

      // Check if client is directly assigned to manager
      if (client.managerId === actorManagerId) {
        return client;
      }

      // Check if client is assigned to an agent belonging to this manager
      if (client.agentId) {
        const agent = await this.getAgentInfo(client.agentId);
        // Find agent record to inspect managerId
        const allAgents = await AgentService.listAgents(
          { managerId: actorManagerId, limit: 100 },
          actor
        );
        if (allAgents.items.some((a) => a.id === client.agentId)) {
          return client;
        }
      }

      throw new Error(
        `Forbidden: Scope violation. You can only ${actionDesc} clients within your operational managerial hierarchy.`
      );
    }

    // 3. Agent: scoped exclusively to own assigned clients
    if (actor.role === 'AGENT') {
      const actorAgentId = await this.resolveActorAgentId(actor);
      if (!actorAgentId || client.agentId !== actorAgentId) {
        throw new Error(
          `Forbidden: Access denied. Agents can only ${actionDesc} clients assigned to their portfolio.`
        );
      }
      return client;
    }

    // 4. Client: scoped exclusively to their own account
    if (actor.role === 'CLIENT') {
      const actorClientId = await this.resolveActorClientId(actor);
      if (
        client.id !== actorClientId &&
        client.userId !== actor.userId &&
        client.email.toLowerCase() !== actor.email.toLowerCase()
      ) {
        throw new Error(
          `Forbidden: Access denied. Clients can only ${actionDesc} their own client account.`
        );
      }
      return client;
    }

    throw new Error('Forbidden: Unauthorized role.');
  }

  /**
   * Helper: Formats StoredClientRecord to ClientListItem.
   */
  private static async toListItem(c: StoredClientRecord): Promise<ClientListItem> {
    const mgr = await this.getManagerInfo(c.managerId);
    const agt = await this.getAgentInfo(c.agentId);
    const activeApi = c.apiCredentials.some((a) => a.status === 'ACTIVE');

    return {
      id: c.id,
      userId: c.userId,
      username: c.username,
      firstName: c.firstName,
      lastName: c.lastName,
      name: `${c.firstName} ${c.lastName}`.trim(),
      email: c.email,
      companyName: c.companyName,
      contact: c.contact,
      billingType: c.billingType,
      status: c.status,
      managerId: c.managerId,
      managerName: mgr?.name || (c.managerId ? 'Assigned Manager' : null),
      managerEmail: mgr?.email || null,
      agentId: c.agentId,
      agentName: agt?.name || (c.agentId ? 'Assigned Agent' : null),
      agentEmail: agt?.email || null,
      assignedNumbersCount: c.numbers.length,
      balance: c.balance,
      smsCount: c.smsStats.totalSms,
      apiAccessEnabled: activeApi,
      permissions: c.permissions,
      lastLoginAt: c.lastLoginAt,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  /**
   * Helper: Formats StoredClientRecord to full ClientDetail.
   */
  private static async toDetail(c: StoredClientRecord): Promise<ClientDetail> {
    const listItem = await this.toListItem(c);
    const mgr = await this.getManagerInfo(c.managerId);
    const agt = await this.getAgentInfo(c.agentId);
    const recentActivity = await AuditService.getLogsForEntity(c.id, 20);

    return {
      ...listItem,
      manager: mgr,
      agent: agt,
      numbers: c.numbers,
      smsStats: c.smsStats,
      balanceInfo: {
        balance: c.balance,
        currency: c.currency,
        billingType: c.billingType,
        creditLimit: c.creditLimit,
        totalSpent: c.totalSpent,
        lastRechargeDate: c.lastRechargeDate,
        lastRechargeAmount: c.lastRechargeAmount,
      },
      recentActivity: recentActivity.map((l) => ({
        id: l.id,
        action: l.action,
        reason: l.reason,
        timestamp: l.timestamp,
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
      })),
      apiCredentials: c.apiCredentials,
      recentSms: c.recentSms,
    };
  }

  /**
   * 1. List clients with search, filters, pagination, and scoped authorization.
   */
  static async listClients(
    query: ClientListQuery,
    actor: AuthTokenPayload
  ): Promise<PaginatedClients> {
    await this.initializeSeedClients();

    let all = Array.from(clientRegistry.values());

    // Role-based hierarchy scoping
    let isScopedToManager = false;
    let isScopedToAgent = false;
    let scopedManagerId: string | null = null;
    let scopedAgentId: string | null = null;

    if (actor.role === 'MANAGER') {
      isScopedToManager = true;
      scopedManagerId = await this.resolveActorManagerId(actor);
      if (scopedManagerId) {
        // Collect agents under this manager
        const agentsInScope = await AgentService.listAgents(
          { managerId: scopedManagerId, limit: 100 },
          actor
        );
        const agentIdsInScope = new Set(agentsInScope.items.map((a) => a.id));

        all = all.filter(
          (c) => c.managerId === scopedManagerId || (c.agentId && agentIdsInScope.has(c.agentId))
        );
      } else {
        all = [];
      }
    } else if (actor.role === 'AGENT') {
      isScopedToAgent = true;
      scopedAgentId = await this.resolveActorAgentId(actor);
      if (scopedAgentId) {
        all = all.filter((c) => c.agentId === scopedAgentId);
      } else {
        all = [];
      }
    } else if (actor.role === 'CLIENT') {
      const clientId = await this.resolveActorClientId(actor);
      all = all.filter(
        (c) =>
          c.id === clientId ||
          c.userId === actor.userId ||
          c.email.toLowerCase() === actor.email.toLowerCase()
      );
    }

    // Apply explicit query filters
    if (query.status && query.status !== 'ALL') {
      all = all.filter((c) => c.status === query.status);
    }
    if (query.billingType && query.billingType !== 'ALL') {
      all = all.filter((c) => c.billingType === query.billingType);
    }
    if (query.managerId && query.managerId !== 'ALL') {
      all = all.filter((c) => c.managerId === query.managerId);
    }
    if (query.agentId && query.agentId !== 'ALL') {
      all = all.filter((c) => c.agentId === query.agentId);
    }

    // Apply text search
    if (query.search && query.search.trim() !== '') {
      const term = query.search.toLowerCase().trim();
      all = all.filter(
        (c) =>
          c.firstName.toLowerCase().includes(term) ||
          c.lastName.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          c.companyName.toLowerCase().includes(term) ||
          c.username.toLowerCase().includes(term) ||
          c.contact.toLowerCase().includes(term)
      );
    }

    // Aggregate statistics across filtered dataset
    const stats = {
      total: all.length,
      active: all.filter((c) => c.status === 'ACTIVE').length,
      suspended: all.filter((c) => c.status === 'SUSPENDED').length,
      pending: all.filter((c) => c.status === 'PENDING').length,
      totalNumbers: all.reduce((sum, c) => sum + c.numbers.length, 0),
      totalBalance: all.reduce((sum, c) => sum + c.balance, 0),
      totalSms: all.reduce((sum, c) => sum + c.smsStats.totalSms, 0),
    };

    // Sorting
    const sortBy = query.sortBy || 'createdAt';
    const sortDir = query.sortDir === 'asc' ? 1 : -1;

    all.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortBy === 'name') {
        valA = `${a.firstName} ${a.lastName}`.toLowerCase();
        valB = `${b.firstName} ${b.lastName}`.toLowerCase();
      } else if (sortBy === 'companyName') {
        valA = a.companyName.toLowerCase();
        valB = b.companyName.toLowerCase();
      } else if (sortBy === 'email') {
        valA = a.email.toLowerCase();
        valB = b.email.toLowerCase();
      } else if (sortBy === 'balance') {
        valA = a.balance;
        valB = b.balance;
      } else if (sortBy === 'smsCount') {
        valA = a.smsStats.totalSms;
        valB = b.smsStats.totalSms;
      } else if (sortBy === 'assignedNumbersCount') {
        valA = a.numbers.length;
        valB = b.numbers.length;
      } else {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      }

      if (valA < valB) return -1 * sortDir;
      if (valA > valB) return 1 * sortDir;
      return 0;
    });

    // Pagination
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const total = all.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIdx = (page - 1) * limit;
    const paginated = all.slice(startIdx, startIdx + limit);

    const items = await Promise.all(paginated.map((c) => this.toListItem(c)));

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      stats,
      scopeInfo: {
        actorRole: actor.role,
        isScopedToManager,
        isScopedToAgent,
        managerId: scopedManagerId,
        agentId: scopedAgentId,
      },
    };
  }

  /**
   * 2. View client profile by ID.
   */
  static async getClientById(id: string, actor: AuthTokenPayload): Promise<ClientDetail> {
    const client = await this.assertAccess(id, actor, 'view');
    return this.toDetail(client);
  }

  /**
   * 3. Create a new client.
   * Enforces hierarchical scope:
   * - Super Admin: can set any manager and agent.
   * - Manager: managerId locked to self; agentId must belong to this manager.
   * - Agent: agentId locked to self; managerId assigned to agent's manager.
   * - Client: forbidden.
   */
  static async createClient(
    data: CreateClientDTO,
    actor: AuthTokenPayload,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<{ client: ClientDetail; generatedPassword?: string; apiKey?: ClientApiCredential }> {
    await this.initializeSeedClients();

    if (actor.role === 'CLIENT') {
      throw new Error('Forbidden: Clients cannot create client accounts.');
    }

    // Check unique email and username
    const normalizedEmail = data.email.toLowerCase().trim();
    for (const existing of clientRegistry.values()) {
      if (existing.email.toLowerCase() === normalizedEmail) {
        throw new Error(`A client with email '${data.email}' already exists.`);
      }
      if (existing.username.toLowerCase() === data.username.toLowerCase().trim()) {
        throw new Error(`A client with username '${data.username}' already exists.`);
      }
    }

    let managerId: string | null = data.managerId || null;
    let agentId: string | null = data.agentId || null;

    // Scope enforcement for Manager
    if (actor.role === 'MANAGER') {
      const actorManagerId = await this.resolveActorManagerId(actor);
      if (!actorManagerId) {
        throw new Error('Forbidden: Could not resolve manager portfolio.');
      }
      managerId = actorManagerId;

      if (agentId) {
        const agent = await this.getAgentInfo(agentId);
        const agentsInScope = await AgentService.listAgents(
          { managerId: actorManagerId, limit: 100 },
          actor
        );
        if (!agentsInScope.items.some((a) => a.id === agentId)) {
          throw new Error('Forbidden: Cannot assign client to agent outside your manager scope.');
        }
      }
    }

    // Scope enforcement for Agent
    if (actor.role === 'AGENT') {
      const actorAgentId = await this.resolveActorAgentId(actor);
      if (!actorAgentId) {
        throw new Error('Forbidden: Could not resolve agent profile.');
      }
      agentId = actorAgentId;
      // Resolve agent's manager
      const agentAll = await AgentService.listAgents({ limit: 100 }, {
        userId: 'system',
        email: 'system@smshub.local',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        tokenId: 'sys',
      });
      const agentRecord = agentAll.items.find((a) => a.id === actorAgentId);
      managerId = agentRecord?.managerId || null;
    }

    // Generate password if not provided
    const plainPassword =
      data.password ||
      `Client#${crypto.randomBytes(4).toString('hex').toUpperCase()}!2026`;

    const clientId = `cli-prof-${crypto.randomBytes(4).toString('hex')}`;

    // Provision user in UserRepository
    const newUser = await UserRepository.createUser({
      email: normalizedEmail,
      passwordRaw: plainPassword,
      role: 'CLIENT',
      firstName: data.firstName,
      lastName: data.lastName,
      status: data.status || 'ACTIVE',
      managerId,
      agentId,
      clientId,
    });

    const nowIso = new Date().toISOString();
    const permissions = data.permissions && data.permissions.length > 0
      ? data.permissions
      : [...DEFAULT_ROLE_PERMISSIONS.CLIENT];

    let apiCredentials: ClientApiCredential[] = [];
    let initialPlainApiKey: ClientApiCredential | undefined;

    if (data.enableApiAccess) {
      const keyId = `key_live_${crypto.randomBytes(8).toString('hex')}`;
      const rawSecret = `sec_live_${crypto.randomBytes(16).toString('hex')}`;
      const maskedSecret = `sec_live_••••••••${rawSecret.slice(-4)}`;

      const newCred: ClientApiCredential = {
        id: `api-cred-${crypto.randomBytes(4).toString('hex')}`,
        clientId: keyId,
        clientSecret: maskedSecret,
        plainSecret: rawSecret,
        name: 'Default API Key',
        status: 'ACTIVE',
        rateLimit: 60,
        ipWhitelist: [],
        lastUsedAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      apiCredentials.push(newCred);
      initialPlainApiKey = newCred;
    }

    const newClientRecord: StoredClientRecord = {
      id: clientId,
      userId: newUser.id,
      username: data.username.toLowerCase().trim(),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: normalizedEmail,
      companyName: data.companyName.trim(),
      contact: data.contact.trim(),
      billingType: data.billingType || 'PREPAID',
      status: data.status || 'ACTIVE',
      managerId,
      agentId,
      balance: data.initialBalance || 0.0,
      creditLimit: 10000.0,
      currency: 'USD',
      lastRechargeDate: data.initialBalance ? nowIso : null,
      lastRechargeAmount: data.initialBalance || null,
      totalSpent: 0.0,
      permissions,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastLoginAt: null,
      numbers: [],
      recentSms: [],
      smsStats: {
        totalSms: 0,
        deliveredSms: 0,
        failedSms: 0,
        pendingSms: 0,
        successRate: 100.0,
        totalSpent: 0.0,
        dailyVolume: [],
      },
      apiCredentials,
    };

    clientRegistry.set(clientId, newClientRecord);

    await AuditService.recordEvent({
      userId: actor.userId,
      email: actor.email,
      action: 'CLIENT_CREATED',
      reason: `Client created: ${newClientRecord.companyName} (${newClientRecord.email})`,
      entityType: 'CLIENT',
      entityId: clientId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        clientId,
        email: normalizedEmail,
        companyName: newClientRecord.companyName,
        managerId,
        agentId,
        actorRole: actor.role,
      },
    });

    const detail = await this.toDetail(newClientRecord);
    return {
      client: detail,
      generatedPassword: data.password ? undefined : plainPassword,
      apiKey: initialPlainApiKey,
    };
  }

  /**
   * 4. Edit client details.
   */
  static async updateClient(
    id: string,
    data: UpdateClientDTO,
    actor: AuthTokenPayload,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<ClientDetail> {
    const client = await this.assertAccess(id, actor, 'edit');

    if (actor.role === 'CLIENT') {
      throw new Error('Forbidden: Clients cannot edit organizational parameters.');
    }

    // Role-specific reassignment restrictions
    if (data.managerId !== undefined) {
      if (actor.role !== 'SUPER_ADMIN') {
        throw new Error('Forbidden: Only Super Admin can reassign client manager hierarchy.');
      }
      client.managerId = data.managerId || null;
    }

    if (data.agentId !== undefined) {
      if (actor.role === 'AGENT') {
        throw new Error('Forbidden: Agents cannot reassign client agent ownership.');
      }
      if (actor.role === 'MANAGER') {
        const actorManagerId = await this.resolveActorManagerId(actor);
        if (data.agentId) {
          const agentsInScope = await AgentService.listAgents(
            { managerId: actorManagerId!, limit: 100 },
            actor
          );
          if (!agentsInScope.items.some((a) => a.id === data.agentId)) {
            throw new Error('Forbidden: Cannot reassign client to an agent outside your scope.');
          }
        }
      }
      client.agentId = data.agentId || null;
    }

    if (data.firstName) client.firstName = data.firstName.trim();
    if (data.lastName) client.lastName = data.lastName.trim();
    if (data.companyName) client.companyName = data.companyName.trim();
    if (data.contact) client.contact = data.contact.trim();
    if (data.billingType) client.billingType = data.billingType;
    if (data.status) client.status = data.status;

    client.updatedAt = new Date().toISOString();

    await AuditService.recordEvent({
      userId: actor.userId,
      email: actor.email,
      action: 'CLIENT_UPDATED',
      reason: `Client profile updated: ${client.companyName}`,
      entityType: 'CLIENT',
      entityId: client.id,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        clientId: client.id,
        updates: data,
        actorRole: actor.role,
      },
    });

    return this.toDetail(client);
  }

  /**
   * 5. Enable, disable, or suspend client status.
   */
  static async updateStatus(
    id: string,
    status: ClientStatus,
    reason: string | undefined,
    actor: AuthTokenPayload,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<ClientDetail> {
    const client = await this.assertAccess(id, actor, 'modify status of');

    if (actor.role === 'CLIENT') {
      throw new Error('Forbidden: Clients cannot modify account activation status.');
    }

    const prevStatus = client.status;
    client.status = status;
    client.updatedAt = new Date().toISOString();

    // Synchronize underlying user status so suspended login is rejected
    await UserRepository.updateStatus(client.userId, status);

    await AuditService.recordEvent({
      userId: actor.userId,
      email: actor.email,
      action: 'CLIENT_STATUS_CHANGED',
      reason: `Client status changed from ${prevStatus} to ${status}. Reason: ${reason || 'Administrative action'}`,
      entityType: 'CLIENT',
      entityId: client.id,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        clientId: client.id,
        previousStatus: prevStatus,
        newStatus: status,
        reason,
      },
    });

    return this.toDetail(client);
  }

  /**
   * 6. Reset password for a client.
   */
  static async resetPassword(
    id: string,
    options: { newPassword?: string; autoGenerate?: boolean },
    actor: AuthTokenPayload,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<{ newPassword: string; temporary: boolean; email: string }> {
    const client = await this.assertAccess(id, actor, 'reset password of');

    if (actor.role === 'CLIENT') {
      throw new Error('Forbidden: Clients cannot reset passwords via administrative endpoints.');
    }

    const newPassword =
      options.newPassword ||
      `Client#${crypto.randomBytes(4).toString('hex').toUpperCase()}!2026`;

    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters in length.');
    }

    await UserRepository.resetPassword(client.userId, newPassword);

    await AuditService.recordEvent({
      userId: actor.userId,
      email: actor.email,
      action: 'CLIENT_PASSWORD_RESET',
      reason: `Administrative password reset executed for client ${client.email}`,
      entityType: 'CLIENT',
      entityId: client.id,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        clientId: client.id,
        email: client.email,
        actorRole: actor.role,
      },
    });

    return {
      newPassword,
      temporary: !options.newPassword,
      email: client.email,
    };
  }

  /**
   * 7. Configure granular security permissions for a client.
   */
  static async updatePermissions(
    id: string,
    permissions: string[],
    actor: AuthTokenPayload,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<ClientDetail> {
    const client = await this.assertAccess(id, actor, 'configure permissions for');

    if (actor.role === 'CLIENT') {
      throw new Error('Forbidden: Clients cannot configure permission policies.');
    }

    client.permissions = [...new Set(permissions)];
    client.updatedAt = new Date().toISOString();

    await AuditService.recordEvent({
      userId: actor.userId,
      email: actor.email,
      action: 'CLIENT_PERMISSIONS_UPDATED',
      reason: `Client permissions reconfigured: ${permissions.length} active scopes`,
      entityType: 'CLIENT',
      entityId: client.id,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        clientId: client.id,
        permissions,
        actorRole: actor.role,
      },
    });

    return this.toDetail(client);
  }

  /**
   * 8. Configure API Access for client (generate, revoke, rate limits, IP whitelist).
   */
  static async configureApiAccess(
    id: string,
    dto: ConfigureClientApiDTO,
    actor: AuthTokenPayload,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<{ apiCredential: ClientApiCredential; allCredentials: ClientApiCredential[] }> {
    const client = await this.assertAccess(id, actor, 'configure API access for');

    const nowIso = new Date().toISOString();

    let credential = client.apiCredentials.find((c) => c.status === 'ACTIVE');

    if (dto.enableApiAccess) {
      if (!credential || dto.regenerateKey) {
        // Generate new API key pair
        const keyId = `key_live_${crypto.randomBytes(8).toString('hex')}`;
        const plainSecret = `sec_live_${crypto.randomBytes(16).toString('hex')}`;
        const maskedSecret = `sec_live_••••••••${plainSecret.slice(-4)}`;

        // If regenerating, revoke old ones
        if (dto.regenerateKey) {
          client.apiCredentials.forEach((c) => {
            c.status = 'REVOKED';
            c.updatedAt = nowIso;
          });
        }

        credential = {
          id: `api-cred-${crypto.randomBytes(4).toString('hex')}`,
          clientId: keyId,
          clientSecret: maskedSecret,
          plainSecret, // Revealed only in response to this creation/rotation call
          name: dto.name || 'Default REST API Key',
          status: 'ACTIVE',
          rateLimit: dto.rateLimit || 60,
          ipWhitelist: dto.ipWhitelist || [],
          lastUsedAt: null,
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        client.apiCredentials.unshift(credential);
      } else {
        // Update existing credential parameters
        if (dto.name) credential.name = dto.name;
        if (dto.rateLimit) credential.rateLimit = dto.rateLimit;
        if (dto.ipWhitelist) credential.ipWhitelist = dto.ipWhitelist;
        if (dto.status) credential.status = dto.status;
        credential.updatedAt = nowIso;
      }
    } else {
      // Disable / revoke
      if (credential) {
        credential.status = 'DISABLED';
        credential.updatedAt = nowIso;
      }
    }

    client.updatedAt = nowIso;

    await AuditService.recordEvent({
      userId: actor.userId,
      email: actor.email,
      action: 'CLIENT_API_ACCESS_CONFIGURED',
      reason: `API access configured for client ${client.companyName}: ${dto.enableApiAccess ? 'ENABLED' : 'DISABLED'}`,
      entityType: 'CLIENT',
      entityId: client.id,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        clientId: client.id,
        enableApiAccess: dto.enableApiAccess,
        keyId: credential?.clientId,
        status: credential?.status,
      },
    });

    return {
      apiCredential: credential || client.apiCredentials[0],
      allCredentials: client.apiCredentials,
    };
  }

  /**
   * 9. View assigned phone numbers for a client.
   */
  static async getNumbers(id: string, actor: AuthTokenPayload): Promise<ClientAssignedNumber[]> {
    const client = await this.assertAccess(id, actor, 'view numbers of');
    return client.numbers;
  }

  /**
   * 10. View SMS statistics for a client.
   */
  static async getStatistics(id: string, actor: AuthTokenPayload): Promise<ClientSmsStatistics> {
    const client = await this.assertAccess(id, actor, 'view statistics of');
    return client.smsStats;
  }

  /**
   * 11. View balance and ledger info for a client.
   */
  static async getBalance(id: string, actor: AuthTokenPayload): Promise<ClientBalanceInfo> {
    const client = await this.assertAccess(id, actor, 'view balance of');
    return {
      balance: client.balance,
      currency: client.currency,
      billingType: client.billingType,
      creditLimit: client.creditLimit,
      totalSpent: client.totalSpent,
      lastRechargeDate: client.lastRechargeDate,
      lastRechargeAmount: client.lastRechargeAmount,
    };
  }

  /**
   * 12. View audit activity logs for a client.
   */
  static async getActivity(id: string, actor: AuthTokenPayload): Promise<ClientActivity[]> {
    const client = await this.assertAccess(id, actor, 'view activity of');
    const logs = await AuditService.getLogsForEntity(client.id, 50);
    return logs.map((l) => ({
      id: l.id,
      action: l.action,
      reason: l.reason,
      timestamp: l.timestamp,
      ipAddress: l.ipAddress,
      userAgent: l.userAgent,
    }));
  }

  /**
   * 13. Comprehensive Client Dashboard Data.
   * Returns:
   * - Assigned numbers
   * - SMS count
   * - Recent SMS
   * - Balance
   * - Earnings/usage where applicable
   * - API status
   */
  static async getDashboardData(id: string, actor: AuthTokenPayload): Promise<ClientDashboardData> {
    const client = await this.assertAccess(id, actor, 'view dashboard of');
    const listItem = await this.toListItem(client);

    const activeKeys = client.apiCredentials.filter((k) => k.status === 'ACTIVE');

    return {
      client: listItem,
      assignedNumbers: client.numbers,
      smsCount: client.smsStats.totalSms,
      recentSms: client.recentSms,
      balance: {
        balance: client.balance,
        currency: client.currency,
        billingType: client.billingType,
        creditLimit: client.creditLimit,
        totalSpent: client.totalSpent,
        lastRechargeDate: client.lastRechargeDate,
        lastRechargeAmount: client.lastRechargeAmount,
      },
      smsStats: client.smsStats,
      apiStatus: {
        enabled: activeKeys.length > 0,
        activeKeysCount: activeKeys.length,
        rateLimit: activeKeys[0]?.rateLimit || 60,
        credentials: client.apiCredentials,
      },
    };
  }
}
