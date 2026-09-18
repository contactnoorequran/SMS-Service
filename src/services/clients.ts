/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ClientItem,
  ClientDetail,
  ClientStatus,
  BillingType,
  ClientKpiSummary,
  ClientFilterState,
  CreateClientPayload,
  UpdateClientPayload,
  AgentSummary,
  ManagerSummary,
  ClientNumberSummary,
  ClientFinancialSummary,
  ClientTransactionSummary,
  ClientActivityItem,
  ClientRecentSmsItem,
} from '../types/clients';
import { apiClient } from './api';

// Available Supervising Managers
const SEED_MANAGERS: ManagerSummary[] = [
  {
    id: 'mgr-001',
    userId: 'usr-002',
    name: 'Sarah Khan',
    email: 'sarah.khan@smshub.local',
    department: 'Operations',
  },
  {
    id: 'mgr-002',
    userId: 'usr-003',
    name: 'Ahmed Malik',
    email: 'ahmed.malik@smshub.local',
    department: 'Telecom',
  },
  {
    id: 'mgr-003',
    userId: 'usr-004',
    name: 'Elena Rostova',
    email: 'elena.rostova@smshub.local',
    department: 'Carrier Routing',
  },
  {
    id: 'mgr-004',
    userId: 'usr-005',
    name: 'Daniel Smith',
    email: 'daniel.smith@smshub.local',
    department: 'Enterprise Support',
  },
  {
    id: 'mgr-005',
    userId: 'usr-006',
    name: 'Olivia Wilson',
    email: 'olivia.wilson@smshub.local',
    department: 'Financial Clearing',
  },
];

// Available Commercial Agents for Client Assignment
const SEED_AGENTS: AgentSummary[] = [
  {
    id: 'ag-101',
    userId: 'usr-ag-101',
    name: 'Liam O’Connor',
    email: 'liam.o@smshub.local',
    department: 'Operations',
    managerId: 'mgr-001',
    managerName: 'Sarah Khan',
    clientsCount: 14,
    maxClients: 20,
  },
  {
    id: 'ag-102',
    userId: 'usr-ag-102',
    name: 'Sophie Martin',
    email: 'sophie.m@smshub.local',
    department: 'Telecom',
    managerId: 'mgr-002',
    managerName: 'Ahmed Malik',
    clientsCount: 19,
    maxClients: 20,
  },
  {
    id: 'ag-103',
    userId: 'usr-ag-103',
    name: 'Carlos Ramirez',
    email: 'carlos.r@smshub.local',
    department: 'Telecom',
    managerId: 'mgr-002',
    managerName: 'Ahmed Malik',
    clientsCount: 8,
    maxClients: 15,
  },
  {
    id: 'ag-104',
    userId: 'usr-ag-104',
    name: 'Aisha Patel',
    email: 'aisha.p@smshub.local',
    department: 'Enterprise Support',
    managerId: 'mgr-004',
    managerName: 'Daniel Smith',
    clientsCount: 12,
    maxClients: 15,
  },
  {
    id: 'ag-105',
    userId: 'usr-ag-105',
    name: 'Marcus Vance',
    email: 'marcus.v@smshub.local',
    department: 'Carrier Routing',
    managerId: 'mgr-003',
    managerName: 'Elena Rostova',
    clientsCount: 5,
    maxClients: 20,
  },
];

// Comprehensive Initial Seed Clients
const INITIAL_CLIENTS_SEED: ClientDetail[] = [
  {
    id: 'cl-001',
    userId: 'usr-cl-001',
    name: 'Marcus Vance',
    email: 'billing@alphaexpress.com',
    companyName: 'Alpha Express Logistics Ltd',
    contactPhone: '+44 20 7946 0912',
    billingType: 'POSTPAID',
    status: 'ACTIVE',
    managerId: 'mgr-001',
    managerName: 'Sarah Khan',
    agentId: 'ag-101',
    agentName: 'Liam O’Connor',
    agentEmail: 'liam.o@smshub.local',
    assignedNumbersCount: 6,
    balance: 2450.0,
    currency: 'USD',
    smsCount: 38420,
    inboundSmsCount: 14200,
    outboundSmsCount: 24220,
    permissions: ['messages.send', 'numbers.read', 'billing.view', 'reports.read'],
    lastLoginAt: '2026-09-15T19:45:00.000Z',
    createdAt: '2026-01-20T12:00:00.000Z',
    organization: 'Alpha Global Group',
    address: '142 Canary Wharf, London, UK E14 5AB',
    website: 'https://alphaexpress.co.uk',
    apiAccess: {
      enabled: true,
      rateLimitPerSecond: 100,
      activeKeysCount: 2,
      lastUsedAt: '2026-09-15T22:10:00.000Z',
    },
    agent: SEED_AGENTS[0],
    manager: SEED_MANAGERS[0],
    numbers: [
      {
        id: 'num-cl-001',
        e164Number: '+447911123456',
        country: 'United Kingdom',
        countryCode: 'GB',
        operator: 'Vodafone UK',
        provider: 'Twilio Gateway',
        status: 'ASSIGNED',
        assignedAt: '2026-01-22T10:00:00.000Z',
        capabilities: ['SMS', 'MMS', 'VOICE'],
        monthlyCost: 2.5,
      },
      {
        id: 'num-cl-002',
        e164Number: '+447911123457',
        country: 'United Kingdom',
        countryCode: 'GB',
        operator: 'EE UK',
        provider: 'Infobip Direct',
        status: 'ASSIGNED',
        assignedAt: '2026-01-22T10:00:00.000Z',
        capabilities: ['SMS'],
        monthlyCost: 1.8,
      },
      {
        id: 'num-cl-003',
        e164Number: '+12025550143',
        country: 'United States',
        countryCode: 'US',
        operator: 'Verizon Wireless',
        provider: 'Bandwidth Inc',
        status: 'ASSIGNED',
        assignedAt: '2026-02-10T14:30:00.000Z',
        capabilities: ['SMS', 'MMS'],
        monthlyCost: 1.5,
      },
      {
        id: 'num-cl-004',
        e164Number: '+12025550144',
        country: 'United States',
        countryCode: 'US',
        operator: 'AT&T USA',
        provider: 'Bandwidth Inc',
        status: 'ASSIGNED',
        assignedAt: '2026-02-10T14:30:00.000Z',
        capabilities: ['SMS'],
        monthlyCost: 1.5,
      },
      {
        id: 'num-cl-005',
        e164Number: '+4915123456789',
        country: 'Germany',
        countryCode: 'DE',
        operator: 'Telekom Deutschland',
        provider: 'Sinch Tier-1',
        status: 'ASSIGNED',
        assignedAt: '2026-03-01T09:00:00.000Z',
        capabilities: ['SMS'],
        monthlyCost: 3.2,
      },
      {
        id: 'num-cl-006',
        e164Number: '+33612345678',
        country: 'France',
        countryCode: 'FR',
        operator: 'Orange France',
        provider: 'Sinch Tier-1',
        status: 'ASSIGNED',
        assignedAt: '2026-03-15T11:20:00.000Z',
        capabilities: ['SMS', 'VOICE'],
        monthlyCost: 2.8,
      },
    ],
    financials: {
      balance: 2450.0,
      currency: 'USD',
      creditLimit: 5000.0,
      availableCredit: 7450.0,
      totalSpent: 14850.25,
      billingType: 'POSTPAID',
      lastRechargeDate: '2026-09-01T10:00:00.000Z',
      lastRechargeAmount: 3000.0,
      recentTransactions: [
        {
          id: 'tx-001',
          type: 'TOPUP',
          amount: 3000.0,
          direction: 'CREDIT',
          balanceAfter: 2450.0,
          description: 'Monthly Postpaid Settlement via Wire Transfer #WT-8941',
          reference: 'WT-8941',
          timestamp: '2026-09-01T10:00:00.000Z',
        },
        {
          id: 'tx-002',
          type: 'SMS_CHARGE',
          amount: 420.5,
          direction: 'DEBIT',
          balanceAfter: -550.0,
          description: 'Bulk Dispatch Billing (42,050 domestic SMS)',
          reference: 'SMS-BATCH-20260831',
          timestamp: '2026-08-31T23:59:59.000Z',
        },
        {
          id: 'tx-003',
          type: 'NUMBER_FEE',
          amount: 13.3,
          direction: 'DEBIT',
          balanceAfter: -129.5,
          description: 'Recurring DID Line Rental (6 phone numbers)',
          reference: 'REC-DID-AUG26',
          timestamp: '2026-08-01T00:00:00.000Z',
        },
      ],
    },
    recentSms: [
      {
        id: 'sms-cl-101',
        sender: '+447911123456',
        recipient: '+447700900123',
        message: 'Your parcel #UK-8921 is out for delivery with driver David.',
        direction: 'OUTBOUND',
        status: 'DELIVERED',
        timestamp: '2026-09-15T21:40:00.000Z',
        cost: 0.012,
      },
      {
        id: 'sms-cl-102',
        sender: '+447700900123',
        recipient: '+447911123456',
        message: 'Please leave with reception, thanks!',
        direction: 'INBOUND',
        status: 'RECEIVED',
        timestamp: '2026-09-15T21:42:15.000Z',
        cost: 0.004,
      },
      {
        id: 'sms-cl-103',
        sender: '+12025550143',
        recipient: '+12125550199',
        message: 'Alpha Express OTP confirmation code is 849201.',
        direction: 'OUTBOUND',
        status: 'DELIVERED',
        timestamp: '2026-09-15T21:50:00.000Z',
        cost: 0.008,
      },
    ],
    recentActivity: [
      {
        id: 'act-001',
        action: 'API_DISPATCH',
        description: 'Dispatched 450 OTP notifications via API Gateway',
        timestamp: '2026-09-15T21:55:00.000Z',
        ipAddress: '194.204.12.8',
        actor: 'API Key (Production)',
      },
      {
        id: 'act-002',
        action: 'INVOICE_SETTLED',
        description: 'Postpaid invoice for August cleared ($3,000.00 USD)',
        timestamp: '2026-09-01T10:00:00.000Z',
        actor: 'Finance Dept',
      },
    ],
  },
  {
    id: 'cl-002',
    userId: 'usr-cl-002',
    name: 'Eleanor Sterling',
    email: 'ops@nexusfin.co.uk',
    companyName: 'Nexus FinTech Limited',
    contactPhone: '+44 20 7183 9920',
    billingType: 'PREPAID',
    status: 'ACTIVE',
    managerId: 'mgr-001',
    managerName: 'Sarah Khan',
    agentId: 'ag-101',
    agentName: 'Liam O’Connor',
    agentEmail: 'liam.o@smshub.local',
    assignedNumbersCount: 8,
    balance: 180.5,
    currency: 'USD',
    smsCount: 142800,
    inboundSmsCount: 12000,
    outboundSmsCount: 130800,
    permissions: ['messages.send', 'numbers.read', 'billing.view'],
    lastLoginAt: '2026-09-15T20:15:00.000Z',
    createdAt: '2026-02-05T09:30:00.000Z',
    organization: 'Nexus FinTech',
    address: '30 St Mary Axe, London, UK EC3A 8EP',
    website: 'https://nexusfintech.io',
    apiAccess: {
      enabled: true,
      rateLimitPerSecond: 250,
      activeKeysCount: 3,
      lastUsedAt: '2026-09-15T22:15:00.000Z',
    },
    agent: SEED_AGENTS[0],
    manager: SEED_MANAGERS[0],
    numbers: [
      {
        id: 'num-cl-007',
        e164Number: '+447911654321',
        country: 'United Kingdom',
        countryCode: 'GB',
        operator: 'EE UK',
        provider: 'Twilio Gateway',
        status: 'ASSIGNED',
        assignedAt: '2026-02-06T11:00:00.000Z',
        capabilities: ['SMS'],
        monthlyCost: 1.8,
      },
    ],
    financials: {
      balance: 180.5,
      currency: 'USD',
      creditLimit: 0,
      availableCredit: 180.5,
      totalSpent: 4230.8,
      billingType: 'PREPAID',
      lastRechargeDate: '2026-09-10T14:20:00.000Z',
      lastRechargeAmount: 500.0,
      recentTransactions: [
        {
          id: 'tx-004',
          type: 'TOPUP',
          amount: 500.0,
          direction: 'CREDIT',
          balanceAfter: 520.5,
          description: 'Prepaid Wallet Recharge via Stripe #ch_3N9281',
          reference: 'STRIPE-9281',
          timestamp: '2026-09-10T14:20:00.000Z',
        },
      ],
    },
    recentSms: [],
    recentActivity: [],
  },
  {
    id: 'cl-003',
    userId: 'usr-cl-003',
    name: 'David Chen',
    email: 'platform@cloudscale.io',
    companyName: 'CloudScale Technologies Inc',
    contactPhone: '+1 415 555 2671',
    billingType: 'POSTPAID',
    status: 'ACTIVE',
    managerId: 'mgr-002',
    managerName: 'Ahmed Malik',
    agentId: 'ag-102',
    agentName: 'Sophie Martin',
    agentEmail: 'sophie.m@smshub.local',
    assignedNumbersCount: 12,
    balance: 8910.0,
    currency: 'USD',
    smsCount: 215600,
    inboundSmsCount: 45000,
    outboundSmsCount: 170600,
    permissions: ['messages.send', 'numbers.read', 'billing.view', 'reports.read'],
    lastLoginAt: '2026-09-15T21:00:00.000Z',
    createdAt: '2026-01-10T08:00:00.000Z',
    organization: 'CloudScale Inc',
    agent: SEED_AGENTS[1],
    manager: SEED_MANAGERS[1],
    numbers: [],
    financials: {
      balance: 8910.0,
      currency: 'USD',
      creditLimit: 15000.0,
      availableCredit: 23910.0,
      totalSpent: 52800.0,
      billingType: 'POSTPAID',
      lastRechargeDate: '2026-09-02T11:00:00.000Z',
      lastRechargeAmount: 10000.0,
      recentTransactions: [],
    },
    recentSms: [],
    recentActivity: [],
  },
  {
    id: 'cl-004',
    userId: 'usr-cl-004',
    name: 'Dr. Rebecca Adams',
    email: 'telehealth@medicare-alert.org',
    companyName: 'MediCare Health Services LLC',
    contactPhone: '+1 617 555 0192',
    billingType: 'PREPAID',
    status: 'ACTIVE',
    managerId: 'mgr-002',
    managerName: 'Ahmed Malik',
    agentId: 'ag-103',
    agentName: 'Carlos Ramirez',
    agentEmail: 'carlos.r@smshub.local',
    assignedNumbersCount: 4,
    balance: 1240.25,
    currency: 'USD',
    smsCount: 54100,
    inboundSmsCount: 18200,
    outboundSmsCount: 35900,
    permissions: ['messages.send', 'numbers.read'],
    lastLoginAt: '2026-09-14T16:20:00.000Z',
    createdAt: '2026-02-18T10:15:00.000Z',
    organization: 'MediCare Alliance',
    agent: SEED_AGENTS[2],
    manager: SEED_MANAGERS[1],
    numbers: [],
    financials: {
      balance: 1240.25,
      currency: 'USD',
      creditLimit: 0,
      availableCredit: 1240.25,
      totalSpent: 3890.0,
      billingType: 'PREPAID',
      lastRechargeDate: '2026-09-08T09:00:00.000Z',
      lastRechargeAmount: 1500.0,
      recentTransactions: [],
    },
    recentSms: [],
    recentActivity: [],
  },
  {
    id: 'cl-005',
    userId: 'usr-cl-005',
    name: 'Julian Thorne',
    email: 'accounts@zenithretail.com',
    companyName: 'Zenith Retail Holdings Ltd',
    contactPhone: '+44 161 496 0221',
    billingType: 'PREPAID',
    status: 'SUSPENDED',
    managerId: 'mgr-004',
    managerName: 'Daniel Smith',
    agentId: 'ag-104',
    agentName: 'Aisha Patel',
    agentEmail: 'aisha.p@smshub.local',
    assignedNumbersCount: 2,
    balance: 0.0,
    currency: 'USD',
    smsCount: 18900,
    inboundSmsCount: 2100,
    outboundSmsCount: 16800,
    permissions: ['messages.send'],
    lastLoginAt: '2026-08-25T11:10:00.000Z',
    createdAt: '2026-03-01T14:00:00.000Z',
    organization: 'Zenith Holdings',
    agent: SEED_AGENTS[3],
    manager: SEED_MANAGERS[3],
    numbers: [],
    financials: {
      balance: 0.0,
      currency: 'USD',
      creditLimit: 0,
      availableCredit: 0.0,
      totalSpent: 1240.0,
      billingType: 'PREPAID',
      lastRechargeDate: null,
      lastRechargeAmount: null,
      recentTransactions: [],
    },
    recentSms: [],
    recentActivity: [
      {
        id: 'act-zenith-1',
        action: 'STATUS_SUSPENDED',
        description: 'Account suspended automatically due to zero credit exhaustion and KYC hold',
        timestamp: '2026-09-01T00:00:00.000Z',
        actor: 'Billing Automation',
      },
    ],
  },
  {
    id: 'cl-006',
    userId: 'usr-cl-006',
    name: 'Frederic Dubois',
    email: 'contact@aerofleet.fr',
    companyName: 'AeroFleet Courier Networks SAS',
    contactPhone: '+33 1 42 68 55 00',
    billingType: 'POSTPAID',
    status: 'ACTIVE',
    managerId: 'mgr-002',
    managerName: 'Ahmed Malik',
    agentId: 'ag-102',
    agentName: 'Sophie Martin',
    agentEmail: 'sophie.m@smshub.local',
    assignedNumbersCount: 15,
    balance: 12450.0,
    currency: 'USD',
    smsCount: 420000,
    inboundSmsCount: 88000,
    outboundSmsCount: 332000,
    permissions: ['messages.send', 'numbers.read', 'billing.view', 'reports.read'],
    lastLoginAt: '2026-09-15T18:30:00.000Z',
    createdAt: '2026-01-05T09:00:00.000Z',
    organization: 'AeroFleet Global',
    agent: SEED_AGENTS[1],
    manager: SEED_MANAGERS[1],
    numbers: [],
    financials: {
      balance: 12450.0,
      currency: 'USD',
      creditLimit: 25000.0,
      availableCredit: 37450.0,
      totalSpent: 98400.0,
      billingType: 'POSTPAID',
      lastRechargeDate: '2026-09-01T08:00:00.000Z',
      lastRechargeAmount: 15000.0,
      recentTransactions: [],
    },
    recentSms: [],
    recentActivity: [],
  },
  {
    id: 'cl-007',
    userId: 'usr-cl-007',
    name: 'Samantha Ross',
    email: 'sec-ops@vanguardsec.co.uk',
    companyName: 'Vanguard CyberSec Ltd',
    contactPhone: '+44 131 496 0882',
    billingType: 'PREPAID',
    status: 'ACTIVE',
    managerId: 'mgr-001',
    managerName: 'Sarah Khan',
    agentId: 'ag-101',
    agentName: 'Liam O’Connor',
    agentEmail: 'liam.o@smshub.local',
    assignedNumbersCount: 5,
    balance: 645.75,
    currency: 'USD',
    smsCount: 89300,
    inboundSmsCount: 14000,
    outboundSmsCount: 75300,
    permissions: ['messages.send', 'numbers.read'],
    lastLoginAt: '2026-09-15T15:10:00.000Z',
    createdAt: '2026-02-28T11:45:00.000Z',
    organization: 'Vanguard Security',
    agent: SEED_AGENTS[0],
    manager: SEED_MANAGERS[0],
    numbers: [],
    financials: {
      balance: 645.75,
      currency: 'USD',
      creditLimit: 0,
      availableCredit: 645.75,
      totalSpent: 2650.0,
      billingType: 'PREPAID',
      lastRechargeDate: '2026-09-05T12:00:00.000Z',
      lastRechargeAmount: 800.0,
      recentTransactions: [],
    },
    recentSms: [],
    recentActivity: [],
  },
  {
    id: 'cl-008',
    userId: 'usr-cl-008',
    name: 'Tariq Mansour',
    email: 'compliance@hypercart.com',
    companyName: 'HyperCart E-Commerce Global',
    contactPhone: '+971 4 362 7000',
    billingType: 'PREPAID',
    status: 'SUSPENDED',
    managerId: 'mgr-002',
    managerName: 'Ahmed Malik',
    agentId: 'ag-103',
    agentName: 'Carlos Ramirez',
    agentEmail: 'carlos.r@smshub.local',
    assignedNumbersCount: 3,
    balance: 0.0,
    currency: 'USD',
    smsCount: 12400,
    inboundSmsCount: 1200,
    outboundSmsCount: 11200,
    permissions: [],
    lastLoginAt: '2026-08-10T12:00:00.000Z',
    createdAt: '2026-03-12T16:20:00.000Z',
    organization: 'HyperCart FZ-LLC',
    agent: SEED_AGENTS[2],
    manager: SEED_MANAGERS[1],
    numbers: [],
    financials: {
      balance: 0.0,
      currency: 'USD',
      creditLimit: 0,
      availableCredit: 0.0,
      totalSpent: 620.0,
      billingType: 'PREPAID',
      lastRechargeDate: null,
      lastRechargeAmount: null,
      recentTransactions: [],
    },
    recentSms: [],
    recentActivity: [],
  },
  {
    id: 'cl-009',
    userId: 'usr-cl-009',
    name: 'Oliver King',
    email: 'wholesale@pulse-mobile.co.uk',
    companyName: 'Pulse Mobile UK Ltd (MVNO)',
    contactPhone: '+44 20 8946 0991',
    billingType: 'POSTPAID',
    status: 'ACTIVE',
    managerId: 'mgr-004',
    managerName: 'Daniel Smith',
    agentId: 'ag-104',
    agentName: 'Aisha Patel',
    agentEmail: 'aisha.p@smshub.local',
    assignedNumbersCount: 24,
    balance: 18720.0,
    currency: 'USD',
    smsCount: 890000,
    inboundSmsCount: 210000,
    outboundSmsCount: 680000,
    permissions: ['messages.send', 'numbers.read', 'billing.view', 'reports.read'],
    lastLoginAt: '2026-09-15T22:05:00.000Z',
    createdAt: '2026-01-02T10:00:00.000Z',
    organization: 'Pulse Telecom Group',
    agent: SEED_AGENTS[3],
    manager: SEED_MANAGERS[3],
    numbers: [],
    financials: {
      balance: 18720.0,
      currency: 'USD',
      creditLimit: 40000.0,
      availableCredit: 58720.0,
      totalSpent: 214000.0,
      billingType: 'POSTPAID',
      lastRechargeDate: '2026-09-01T09:30:00.000Z',
      lastRechargeAmount: 25000.0,
      recentTransactions: [],
    },
    recentSms: [],
    recentActivity: [],
  },
  {
    id: 'cl-010',
    userId: 'usr-cl-010',
    name: 'Clara Oswald',
    email: 'admin@beacon-edutech.com',
    companyName: 'Beacon Learning Systems',
    contactPhone: '+1 312 555 0148',
    billingType: 'PREPAID',
    status: 'PENDING',
    managerId: 'mgr-005',
    managerName: 'Olivia Wilson',
    agentId: null,
    agentName: null,
    agentEmail: null,
    assignedNumbersCount: 1,
    balance: 250.0,
    currency: 'USD',
    smsCount: 2100,
    inboundSmsCount: 300,
    outboundSmsCount: 1800,
    permissions: ['messages.send'],
    lastLoginAt: '2026-09-15T12:00:00.000Z',
    createdAt: '2026-09-12T14:30:00.000Z',
    organization: 'Beacon EduTech',
    agent: null,
    manager: SEED_MANAGERS[4],
    numbers: [],
    financials: {
      balance: 250.0,
      currency: 'USD',
      creditLimit: 0,
      availableCredit: 250.0,
      totalSpent: 120.0,
      billingType: 'PREPAID',
      lastRechargeDate: '2026-09-12T14:40:00.000Z',
      lastRechargeAmount: 250.0,
      recentTransactions: [],
    },
    recentSms: [],
    recentActivity: [],
  },
  {
    id: 'cl-011',
    userId: 'usr-cl-011',
    name: 'Arthur Pendelton',
    email: 'grid-alerts@titan-energy.co.uk',
    companyName: 'Titan Energy Distribution plc',
    contactPhone: '+44 113 496 0552',
    billingType: 'POSTPAID',
    status: 'ACTIVE',
    managerId: 'mgr-001',
    managerName: 'Sarah Khan',
    agentId: 'ag-101',
    agentName: 'Liam O’Connor',
    agentEmail: 'liam.o@smshub.local',
    assignedNumbersCount: 7,
    balance: 4120.5,
    currency: 'USD',
    smsCount: 67800,
    inboundSmsCount: 9200,
    outboundSmsCount: 58600,
    permissions: ['messages.send', 'numbers.read', 'billing.view'],
    lastLoginAt: '2026-09-15T14:00:00.000Z',
    createdAt: '2026-02-14T09:00:00.000Z',
    organization: 'Titan Energy plc',
    agent: SEED_AGENTS[0],
    manager: SEED_MANAGERS[0],
    numbers: [],
    financials: {
      balance: 4120.5,
      currency: 'USD',
      creditLimit: 10000.0,
      availableCredit: 14120.5,
      totalSpent: 18450.0,
      billingType: 'POSTPAID',
      lastRechargeDate: '2026-09-01T12:00:00.000Z',
      lastRechargeAmount: 5000.0,
      recentTransactions: [],
    },
    recentSms: [],
    recentActivity: [],
  },
  {
    id: 'cl-012',
    userId: 'usr-cl-012',
    name: 'Vikram Joshi',
    email: 'trading@quantum-capital.com',
    companyName: 'Quantum Capital Markets LLC',
    contactPhone: '+1 212 555 0891',
    billingType: 'PREPAID',
    status: 'ACTIVE',
    managerId: 'mgr-002',
    managerName: 'Ahmed Malik',
    agentId: 'ag-102',
    agentName: 'Sophie Martin',
    agentEmail: 'sophie.m@smshub.local',
    assignedNumbersCount: 10,
    balance: 3800.0,
    currency: 'USD',
    smsCount: 175000,
    inboundSmsCount: 22000,
    outboundSmsCount: 153000,
    permissions: ['messages.send', 'numbers.read', 'billing.view', 'reports.read'],
    lastLoginAt: '2026-09-15T21:20:00.000Z',
    createdAt: '2026-01-25T11:00:00.000Z',
    organization: 'Quantum Capital',
    agent: SEED_AGENTS[1],
    manager: SEED_MANAGERS[1],
    numbers: [],
    financials: {
      balance: 3800.0,
      currency: 'USD',
      creditLimit: 0,
      availableCredit: 3800.0,
      totalSpent: 28400.0,
      billingType: 'PREPAID',
      lastRechargeDate: '2026-09-07T16:00:00.000Z',
      lastRechargeAmount: 5000.0,
      recentTransactions: [],
    },
    recentSms: [],
    recentActivity: [],
  },
];

class ClientsService {
  private clients: ClientDetail[] = [...INITIAL_CLIENTS_SEED];
  private agents: AgentSummary[] = [...SEED_AGENTS];
  private managers: ManagerSummary[] = [...SEED_MANAGERS];

  /**
   * Fetch paginated and filtered list of clients with KPIs
   */
  public async fetchClients(
    filterState: Partial<ClientFilterState> = {}
  ): Promise<{ items: ClientItem[]; total: number; kpis: ClientKpiSummary }> {
    try {
      const liveRes = await apiClient.getClients({
        search: filterState.search,
        status: filterState.status !== 'ALL' ? filterState.status : undefined,
        billingType: filterState.billingType !== 'ALL' ? filterState.billingType : undefined,
        agentId: filterState.agentId !== 'ALL' ? filterState.agentId : undefined,
        managerId: filterState.managerId !== 'ALL' ? filterState.managerId : undefined,
        page: filterState.page,
        limit: filterState.limit,
        sortBy: filterState.sortBy,
        sortDir: filterState.sortDir,
      });

      if (liveRes && Array.isArray(liveRes.items) && liveRes.items.length > 0) {
        return {
          items: liveRes.items,
          total: liveRes.pagination?.total ?? liveRes.items.length,
          kpis: this.calculateKpis(liveRes.items),
        };
      }
    } catch {
      // Graceful fallback to deterministic mock data
    }

    let filtered = [...this.clients];

    // Search filter (name, email, company)
    if (filterState.search && filterState.search.trim()) {
      const q = filterState.search.toLowerCase().trim();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.companyName.toLowerCase().includes(q) ||
          (c.agentName && c.agentName.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (filterState.status && filterState.status !== 'ALL') {
      filtered = filtered.filter((c) => c.status === filterState.status);
    }

    // Billing type filter
    if (filterState.billingType && filterState.billingType !== 'ALL') {
      filtered = filtered.filter((c) => c.billingType === filterState.billingType);
    }

    // Agent filter
    if (filterState.agentId && filterState.agentId !== 'ALL') {
      if (filterState.agentId === 'UNASSIGNED') {
        filtered = filtered.filter((c) => !c.agentId);
      } else {
        filtered = filtered.filter((c) => c.agentId === filterState.agentId);
      }
    }

    // Manager filter
    if (filterState.managerId && filterState.managerId !== 'ALL') {
      if (filterState.managerId === 'UNASSIGNED') {
        filtered = filtered.filter((c) => !c.managerId);
      } else {
        filtered = filtered.filter((c) => c.managerId === filterState.managerId);
      }
    }

    // Balance range filter
    if (filterState.balanceRange && filterState.balanceRange !== 'ALL') {
      switch (filterState.balanceRange) {
        case 'ZERO':
          filtered = filtered.filter((c) => c.balance <= 0);
          break;
        case '1-1000':
          filtered = filtered.filter((c) => c.balance > 0 && c.balance <= 1000);
          break;
        case '1001-10000':
          filtered = filtered.filter((c) => c.balance > 1000 && c.balance <= 10000);
          break;
        case '10000+':
          filtered = filtered.filter((c) => c.balance > 10000);
          break;
      }
    }

    // Sorting
    const sortField = filterState.sortBy || 'createdAt';
    const sortDir = filterState.sortDir === 'asc' ? 1 : -1;

    filtered.sort((a, b) => {
      switch (sortField) {
        case 'name':
          return sortDir * a.name.localeCompare(b.name);
        case 'companyName':
          return sortDir * a.companyName.localeCompare(b.companyName);
        case 'balance':
          return sortDir * (a.balance - b.balance);
        case 'smsCount':
          return sortDir * (a.smsCount - b.smsCount);
        case 'numbers':
          return sortDir * (a.assignedNumbersCount - b.assignedNumbersCount);
        case 'lastActivity':
          return (
            sortDir *
            (new Date(a.lastLoginAt || 0).getTime() - new Date(b.lastLoginAt || 0).getTime())
          );
        case 'createdAt':
        default:
          return (
            sortDir *
            (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          );
      }
    });

    const total = filtered.length;
    const page = filterState.page || 1;
    const limit = filterState.limit || 10;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      items: paginated,
      total,
      kpis: this.calculateKpis(this.clients),
    };
  }

  /**
   * Calculate executive KPIs across clients
   */
  public calculateKpis(allClients: ClientItem[]): ClientKpiSummary {
    const totalClients = allClients.length;
    const activeClients = allClients.filter((c) => c.status === 'ACTIVE').length;
    const suspendedClients = allClients.filter((c) => c.status === 'SUSPENDED').length;
    const totalAssignedNumbers = allClients.reduce((acc, c) => acc + (c.assignedNumbersCount || 0), 0);
    const totalWalletBalance = allClients.reduce((acc, c) => acc + (c.balance || 0), 0);
    const totalSmsCount = allClients.reduce((acc, c) => acc + (c.smsCount || 0), 0);
    const averageBalance = totalClients > 0 ? totalWalletBalance / totalClients : 0;

    return {
      totalClients,
      activeClients,
      suspendedClients,
      totalAssignedNumbers,
      totalWalletBalance,
      totalSmsCount,
      averageBalance,
    };
  }

  /**
   * Fetch single client details by ID
   */
  public async fetchClientById(id: string): Promise<ClientDetail> {
    try {
      const live = await apiClient.getClientById(id);
      if (live) {
        return live;
      }
    } catch {
      // Fallback
    }

    const found = this.clients.find((c) => c.id === id);
    if (!found) {
      throw new Error(`Client account with ID '${id}' not found`);
    }

    return found;
  }

  /**
   * Create new client account
   */
  public async createClient(payload: CreateClientPayload): Promise<ClientItem> {
    const newId = `cl-${String(this.clients.length + 1).padStart(3, '0')}`;
    const newUserId = `usr-cl-${String(this.clients.length + 1).padStart(3, '0')}`;

    let assignedAgent: AgentSummary | null = null;
    let assignedManager: ManagerSummary | null = null;

    if (payload.agentId) {
      assignedAgent = this.agents.find((a) => a.id === payload.agentId) || null;
      if (assignedAgent?.managerId) {
        assignedManager = this.managers.find((m) => m.id === assignedAgent!.managerId) || null;
      }
    }

    const initialBalance = payload.initialBalance || 0;
    const creditLimit = payload.creditLimit || 0;

    const newClient: ClientDetail = {
      id: newId,
      userId: newUserId,
      name: payload.name,
      email: payload.email,
      companyName: payload.companyName,
      contactPhone: payload.contactPhone,
      billingType: payload.billingType,
      status: payload.status,
      managerId: assignedManager?.id || null,
      managerName: assignedManager?.name || null,
      agentId: assignedAgent?.id || null,
      agentName: assignedAgent?.name || null,
      agentEmail: assignedAgent?.email || null,
      assignedNumbersCount: 0,
      balance: initialBalance,
      currency: 'USD',
      smsCount: 0,
      inboundSmsCount: 0,
      outboundSmsCount: 0,
      permissions: ['messages.send', 'numbers.read', 'billing.view'],
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      organization: payload.companyName,
      agent: assignedAgent,
      manager: assignedManager,
      numbers: [],
      financials: {
        balance: initialBalance,
        currency: 'USD',
        creditLimit: creditLimit,
        availableCredit: payload.billingType === 'POSTPAID' ? initialBalance + creditLimit : initialBalance,
        totalSpent: 0,
        billingType: payload.billingType,
        lastRechargeDate: initialBalance > 0 ? new Date().toISOString() : null,
        lastRechargeAmount: initialBalance > 0 ? initialBalance : null,
        recentTransactions: initialBalance > 0 ? [
          {
            id: `tx-${Date.now()}`,
            type: 'TOPUP',
            amount: initialBalance,
            direction: 'CREDIT',
            balanceAfter: initialBalance,
            description: 'Initial Wallet Balance Allocation',
            reference: 'INIT-TOPUP',
            timestamp: new Date().toISOString(),
          }
        ] : [],
      },
      recentSms: [],
      recentActivity: [
        {
          id: `act-${Date.now()}`,
          action: 'CLIENT_CREATED',
          description: `Account created for ${payload.companyName} (${payload.billingType})`,
          timestamp: new Date().toISOString(),
          actor: 'Super Admin / Manager',
        },
      ],
      apiAccess: {
        enabled: true,
        rateLimitPerSecond: 100,
        activeKeysCount: 1,
        lastUsedAt: null,
      },
    };

    this.clients.unshift(newClient);

    // Update agent client count
    if (assignedAgent) {
      assignedAgent.clientsCount += 1;
    }

    try {
      await apiClient.createClient({
        name: payload.name,
        email: payload.email,
        companyName: payload.companyName,
        contact: payload.contactPhone,
        billingType: payload.billingType,
        agentId: payload.agentId,
        status: payload.status,
        initialBalance: payload.initialBalance,
      });
    } catch {
      // Fallback
    }

    return newClient;
  }

  /**
   * Update mutable client profile fields
   */
  public async updateClient(id: string, payload: UpdateClientPayload): Promise<ClientItem> {
    const target = this.clients.find((c) => c.id === id);
    if (!target) {
      throw new Error(`Client with ID '${id}' not found`);
    }

    if (payload.name) target.name = payload.name;
    if (payload.companyName) target.companyName = payload.companyName;
    if (payload.contactPhone) target.contactPhone = payload.contactPhone;
    if (payload.billingType) {
      target.billingType = payload.billingType;
      target.financials.billingType = payload.billingType;
    }
    if (payload.status) target.status = payload.status;
    if (payload.creditLimit !== undefined) {
      target.financials.creditLimit = payload.creditLimit;
      target.financials.availableCredit = target.billingType === 'POSTPAID'
        ? target.balance + payload.creditLimit
        : target.balance;
    }

    // Agent Reassignment
    if (payload.agentId !== undefined && payload.agentId !== target.agentId) {
      const prevAgentId = target.agentId;
      if (prevAgentId) {
        const oldAgent = this.agents.find((a) => a.id === prevAgentId);
        if (oldAgent) oldAgent.clientsCount = Math.max(0, oldAgent.clientsCount - 1);
      }

      if (payload.agentId) {
        const newAgent = this.agents.find((a) => a.id === payload.agentId);
        if (newAgent) {
          newAgent.clientsCount += 1;
          target.agentId = newAgent.id;
          target.agentName = newAgent.name;
          target.agentEmail = newAgent.email;
          target.agent = newAgent;

          if (newAgent.managerId) {
            const mgr = this.managers.find((m) => m.id === newAgent.managerId);
            if (mgr) {
              target.managerId = mgr.id;
              target.managerName = mgr.name;
              target.manager = mgr;
            }
          }
        }
      } else {
        target.agentId = null;
        target.agentName = null;
        target.agentEmail = null;
        target.agent = null;
      }
    }

    target.recentActivity.unshift({
      id: `act-${Date.now()}`,
      action: 'PROFILE_UPDATED',
      description: 'Client operational profile details updated',
      timestamp: new Date().toISOString(),
      actor: 'Admin / Manager',
    });

    try {
      await apiClient.updateClient(id, payload);
    } catch {
      // Fallback
    }

    return target;
  }

  /**
   * Update client status with operational impact reason
   */
  public async updateClientStatus(
    id: string,
    status: ClientStatus,
    reason?: string
  ): Promise<ClientItem> {
    const target = this.clients.find((c) => c.id === id);
    if (!target) {
      throw new Error(`Client with ID '${id}' not found`);
    }

    const prev = target.status;
    target.status = status;

    target.recentActivity.unshift({
      id: `act-${Date.now()}`,
      action: `STATUS_${status}`,
      description: `Status changed from ${prev} to ${status}${reason ? `: ${reason}` : ''}`,
      timestamp: new Date().toISOString(),
      actor: 'Admin / Compliance Officer',
    });

    try {
      await apiClient.updateClientStatus(id, status, reason);
    } catch {
      // Fallback
    }

    return target;
  }

  /**
   * Assign or reassign supervising agent
   */
  public async assignAgent(clientId: string, agentId: string | null): Promise<ClientItem> {
    const client = this.clients.find((c) => c.id === clientId);
    if (!client) {
      throw new Error(`Client with ID '${clientId}' not found`);
    }

    const previousAgentName = client.agentName || 'Unassigned (Direct)';

    // Decrement previous agent count
    if (client.agentId) {
      const prevAgent = this.agents.find((a) => a.id === client.agentId);
      if (prevAgent) {
        prevAgent.clientsCount = Math.max(0, prevAgent.clientsCount - 1);
      }
    }

    if (agentId) {
      const newAgent = this.agents.find((a) => a.id === agentId);
      if (!newAgent) {
        throw new Error(`Agent with ID '${agentId}' not found`);
      }

      newAgent.clientsCount += 1;
      client.agentId = newAgent.id;
      client.agentName = newAgent.name;
      client.agentEmail = newAgent.email;
      client.agent = newAgent;

      if (newAgent.managerId) {
        const mgr = this.managers.find((m) => m.id === newAgent.managerId);
        if (mgr) {
          client.managerId = mgr.id;
          client.managerName = mgr.name;
          client.manager = mgr;
        }
      }

      client.recentActivity.unshift({
        id: `act-${Date.now()}`,
        action: 'AGENT_REASSIGNED',
        description: `Supervising representative reassigned from ${previousAgentName} to ${newAgent.name}`,
        timestamp: new Date().toISOString(),
        actor: 'Admin / Manager',
      });
    } else {
      client.agentId = null;
      client.agentName = null;
      client.agentEmail = null;
      client.agent = null;

      client.recentActivity.unshift({
        id: `act-${Date.now()}`,
        action: 'AGENT_UNASSIGNED',
        description: `Unassigned from representative ${previousAgentName}`,
        timestamp: new Date().toISOString(),
        actor: 'Admin / Manager',
      });
    }

    try {
      await apiClient.updateClient(clientId, { agentId });
    } catch {
      // Fallback
    }

    return client;
  }

  /**
   * Fetch available agents for selection
   */
  public async fetchAgents(): Promise<AgentSummary[]> {
    return [...this.agents];
  }

  /**
   * Fetch available managers for selection
   */
  public async fetchManagers(): Promise<ManagerSummary[]> {
    return [...this.managers];
  }

  /**
   * Fetch client phone numbers
   */
  public async fetchClientNumbers(clientId: string): Promise<ClientNumberSummary[]> {
    const client = this.clients.find((c) => c.id === clientId);
    return client ? [...client.numbers] : [];
  }

  /**
   * Fetch client financials
   */
  public async fetchClientFinancials(clientId: string): Promise<ClientFinancialSummary | null> {
    const client = this.clients.find((c) => c.id === clientId);
    return client ? client.financials : null;
  }

  /**
   * Fetch client transactions
   */
  public async fetchClientTransactions(clientId: string): Promise<ClientTransactionSummary[]> {
    const client = this.clients.find((c) => c.id === clientId);
    return client ? [...client.financials.recentTransactions] : [];
  }

  /**
   * Fetch client activity
   */
  public async fetchClientActivity(clientId: string): Promise<ClientActivityItem[]> {
    const client = this.clients.find((c) => c.id === clientId);
    return client ? [...client.recentActivity] : [];
  }

  /**
   * Fetch client recent SMS transmissions
   */
  public async fetchClientSmsStream(clientId: string): Promise<ClientRecentSmsItem[]> {
    const client = this.clients.find((c) => c.id === clientId);
    return client ? [...client.recentSms] : [];
  }
}

export const clientsService = new ClientsService();
