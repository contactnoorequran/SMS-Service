/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  NumberItem,
  NumberDetail,
  NumberStatus,
  NumberKpiSummary,
  NumberFilterState,
  CountrySummary,
  OperatorSummary,
  RangeSummary,
  ProviderSummary,
  NumberClientSummary,
  NumberAgentSummary,
  NumberAssignmentHistoryItem,
  NumberTrafficSummary,
  NumberActivityItem,
  CreateNumberPayload,
  UpdateNumberPayload,
  AssignNumberPayload,
  ReassignNumberPayload,
  ReleaseNumberPayload,
} from '../types/numbers';
import { apiClient } from './api';

// ---------------------------------------------------------------------------
// REFERENCE LOOKUPS
// ---------------------------------------------------------------------------

export const SEED_COUNTRIES: CountrySummary[] = [
  { id: 'cnt-us', isoCode: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { id: 'cnt-gb', isoCode: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { id: 'cnt-de', isoCode: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { id: 'cnt-fr', isoCode: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { id: 'cnt-jp', isoCode: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { id: 'cnt-sg', isoCode: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { id: 'cnt-au', isoCode: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { id: 'cnt-in', isoCode: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { id: 'cnt-br', isoCode: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
];

export const SEED_OPERATORS: OperatorSummary[] = [
  { id: 'op-us-verizon', name: 'Verizon Wireless', countryId: 'cnt-us', mccMnc: '311-480' },
  { id: 'op-us-att', name: 'AT&T Mobility', countryId: 'cnt-us', mccMnc: '310-410' },
  { id: 'op-gb-vodafone', name: 'Vodafone UK', countryId: 'cnt-gb', mccMnc: '234-15' },
  { id: 'op-gb-ee', name: 'EE Mobile', countryId: 'cnt-gb', mccMnc: '234-30' },
  { id: 'op-de-telekom', name: 'Deutsche Telekom', countryId: 'cnt-de', mccMnc: '262-01' },
  { id: 'op-fr-orange', name: 'Orange France', countryId: 'cnt-fr', mccMnc: '208-01' },
  { id: 'op-jp-docomo', name: 'NTT Docomo', countryId: 'cnt-jp', mccMnc: '440-10' },
  { id: 'op-sg-singtel', name: 'Singtel Mobile', countryId: 'cnt-sg', mccMnc: '525-01' },
  { id: 'op-au-telstra', name: 'Telstra Corp', countryId: 'cnt-au', mccMnc: '505-01' },
  { id: 'op-in-jio', name: 'Reliance Jio', countryId: 'cnt-in', mccMnc: '405-840' },
];

export const SEED_PROVIDERS: ProviderSummary[] = [
  { id: 'prov-001', name: 'Sinch Global Direct', status: 'ACTIVE', type: 'TIER_1_CARRIER', connectionHealth: 'HEALTHY', activeConnectionCount: 3 },
  { id: 'prov-002', name: 'Twilio Telecom Carrier Hub', status: 'ACTIVE', type: 'TIER_1_CARRIER', connectionHealth: 'HEALTHY', activeConnectionCount: 2 },
  { id: 'prov-003', name: 'Infobip Carrier Services', status: 'ACTIVE', type: 'DIRECT_SMPP', connectionHealth: 'HEALTHY', activeConnectionCount: 2 },
  { id: 'prov-004', name: 'Bandwidth Inc High-Throughput', status: 'ACTIVE', type: 'TIER_1_CARRIER', connectionHealth: 'HEALTHY', activeConnectionCount: 2 },
  { id: 'prov-005', name: 'Vodafone Direct Interconnect', status: 'ACTIVE', type: 'DIRECT_SMPP', connectionHealth: 'HEALTHY', activeConnectionCount: 2 },
  { id: 'prov-006', name: 'Orange Wholesale Carrier', status: 'ACTIVE', type: 'AGGREGATOR', connectionHealth: 'HEALTHY', activeConnectionCount: 2 },
  { id: 'prov-007', name: 'Tata Communications Trans-Global', status: 'ACTIVE', type: 'TIER_1_CARRIER', connectionHealth: 'HEALTHY', activeConnectionCount: 2 },
];

export const SEED_RANGES: RangeSummary[] = [
  { id: 'rng-us-01', providerId: 'prov-004', countryId: 'cnt-us', operatorId: 'op-us-verizon', startE164: '+12025550100', endE164: '+12025550199', status: 'ACTIVE' },
  { id: 'rng-us-02', providerId: 'prov-002', countryId: 'cnt-us', operatorId: 'op-us-att', startE164: '+14155552000', endE164: '+14155552999', status: 'ACTIVE' },
  { id: 'rng-gb-01', providerId: 'prov-001', countryId: 'cnt-gb', operatorId: 'op-gb-vodafone', startE164: '+447911120000', endE164: '+447911129999', status: 'ACTIVE' },
  { id: 'rng-gb-02', providerId: 'prov-005', countryId: 'cnt-gb', operatorId: 'op-gb-ee', startE164: '+447700900000', endE164: '+447700900999', status: 'ACTIVE' },
  { id: 'rng-de-01', providerId: 'prov-003', countryId: 'cnt-de', operatorId: 'op-de-telekom', startE164: '+491511200000', endE164: '+491511299999', status: 'ACTIVE' },
  { id: 'rng-fr-01', providerId: 'prov-006', countryId: 'cnt-fr', operatorId: 'op-fr-orange', startE164: '+33612340000', endE164: '+33612349999', status: 'ACTIVE' },
  { id: 'rng-jp-01', providerId: 'prov-001', countryId: 'cnt-jp', operatorId: 'op-jp-docomo', startE164: '+819012340000', endE164: '+819012349999', status: 'ACTIVE' },
  { id: 'rng-sg-01', providerId: 'prov-001', countryId: 'cnt-sg', operatorId: 'op-sg-singtel', startE164: '+6581230000', endE164: '+6581239999', status: 'ACTIVE' },
  { id: 'rng-au-01', providerId: 'prov-002', countryId: 'cnt-au', operatorId: 'op-au-telstra', startE164: '+61412340000', endE164: '+61412349999', status: 'ACTIVE' },
  { id: 'rng-in-01', providerId: 'prov-007', countryId: 'cnt-in', operatorId: 'op-in-jio', startE164: '+919820010000', endE164: '+919820019999', status: 'ACTIVE' },
];

export const SEED_CLIENTS: NumberClientSummary[] = [
  { id: 'cl-001', companyName: 'Apex Capital FinTech', name: 'Marcus Vance', email: 'vance@apexcapital.io' },
  { id: 'cl-002', companyName: 'Helios Global Logistics', name: 'Elena Rostova', email: 'elena@helios-logistics.de' },
  { id: 'cl-003', companyName: 'Veloce Courier Express', name: 'Matteo Rossi', email: 'ops@veloce-express.it' },
  { id: 'cl-004', companyName: 'Zenith Health Systems', name: 'Dr. Sarah Jenkins', email: 's.jenkins@zenith-health.org' },
  { id: 'cl-005', companyName: 'Quantum E-Commerce Ltd', name: 'Kenji Takahashi', email: 'kenji@quantum-retail.jp' },
  { id: 'cl-006', companyName: 'Nordic Secure Bank', name: 'Lars Lindqvist', email: 'security@nordic-sec.se' },
  { id: 'cl-007', companyName: 'SwiftPay Mobile UK', name: 'Alicia Patel', email: 'alicia@swiftpay-mobile.io' },
  { id: 'cl-008', companyName: 'Mumbai FinTech Gateway', name: 'Rajesh Sharma', email: 'ops@mumbai-fintech.in' },
];

export const SEED_AGENTS: NumberAgentSummary[] = [
  { id: 'agent-001', name: 'Priya Sharma', email: 'p.sharma@sms-telecom.net' },
  { id: 'agent-002', name: 'Sarah Jenkins', email: 's.jenkins@sms-platform.internal' },
  { id: 'agent-003', name: 'Daisuke Sato', email: 'd.sato@sms-platform.internal' },
  { id: 'agent-004', name: 'Claire Renard', email: 'c.renard@paris-express.fr' },
];

// ---------------------------------------------------------------------------
// SEED PHONE NUMBERS DATASET
// ---------------------------------------------------------------------------

let IN_MEMORY_NUMBERS: NumberDetail[] = [
  {
    id: 'num-001',
    e164: '+12025550110',
    country: SEED_COUNTRIES[0], // US
    operator: SEED_OPERATORS[0], // Verizon
    provider: SEED_PROVIDERS[3], // Bandwidth Inc
    range: SEED_RANGES[0],
    status: 'ASSIGNED',
    activeAssignment: {
      id: 'asgn-001',
      numberId: 'num-001',
      clientId: 'cl-001',
      client: SEED_CLIENTS[0],
      agentId: 'agent-001',
      agent: SEED_AGENTS[0],
      assignedAt: '2026-03-10T14:22:00Z',
      assignedBy: 'admin@smshub.local',
    },
    monthlyCost: 1.50,
    currency: 'USD',
    totalMessages: 48920,
    lastActivityAt: '2026-09-16T03:45:00Z',
    createdAt: '2026-01-15T09:00:00Z',
    assignmentHistories: [
      {
        id: 'hist-001-1',
        numberId: 'num-001',
        clientId: 'cl-003',
        clientName: 'Veloce Courier Express',
        agentId: 'agent-002',
        agentName: 'Sarah Jenkins',
        assignedAt: '2026-01-20T10:00:00Z',
        endedAt: '2026-03-09T18:00:00Z',
        changedBy: 'admin@smshub.local',
        reason: 'Client migration to dedicated UK shortcode',
      },
      {
        id: 'hist-001-2',
        numberId: 'num-001',
        clientId: 'cl-001',
        clientName: 'Apex Capital FinTech',
        agentId: 'agent-001',
        agentName: 'Priya Sharma',
        assignedAt: '2026-03-10T14:22:00Z',
        endedAt: null,
        changedBy: 'admin@smshub.local',
        reason: 'Primary 2FA OTP ingress assignment',
      },
    ],
    traffic: {
      smsCount: 48920,
      inboundVolume: 44210,
      outboundVolume: 4710,
      deliveryRate: 99.8,
      lastMessageAt: '2026-09-16T03:45:00Z',
      throughputTps: 18.4,
    },
    recentActivity: [
      { id: 'act-001-1', action: 'INBOUND_SMS', description: '2FA authentication challenge received from subscriber', timestamp: '2026-09-16T03:45:00Z', severity: 'INFO', actor: 'E.164 Ingress Router' },
      { id: 'act-001-2', action: 'ASSIGNMENT_RENEWED', description: 'Monthly dedicated DID reservation renewed for client', timestamp: '2026-09-01T00:00:00Z', severity: 'INFO', actor: 'Billing Engine' },
      { id: 'act-001-3', action: 'HEALTH_CHECK', description: 'Carrier SMPP bind heartbeat acknowledged in 28ms', timestamp: '2026-09-15T23:00:00Z', severity: 'INFO', actor: 'Monitor Bot' },
    ],
  },
  {
    id: 'num-002',
    e164: '+12025550111',
    country: SEED_COUNTRIES[0], // US
    operator: SEED_OPERATORS[0], // Verizon
    provider: SEED_PROVIDERS[3], // Bandwidth Inc
    range: SEED_RANGES[0],
    status: 'AVAILABLE',
    activeAssignment: null,
    monthlyCost: 1.50,
    currency: 'USD',
    totalMessages: 1240,
    lastActivityAt: '2026-08-20T11:15:00Z',
    createdAt: '2026-01-15T09:00:00Z',
    assignmentHistories: [
      {
        id: 'hist-002-1',
        numberId: 'num-002',
        clientId: 'cl-004',
        clientName: 'Zenith Health Systems',
        agentId: 'agent-002',
        agentName: 'Sarah Jenkins',
        assignedAt: '2026-02-01T08:00:00Z',
        endedAt: '2026-08-15T12:00:00Z',
        changedBy: 'admin@smshub.local',
        reason: 'Temporary vaccination campaign completed',
      },
    ],
    traffic: {
      smsCount: 1240,
      inboundVolume: 1240,
      outboundVolume: 0,
      deliveryRate: 100.0,
      lastMessageAt: '2026-08-20T11:15:00Z',
      throughputTps: 0,
    },
    recentActivity: [
      { id: 'act-002-1', action: 'RELEASED', description: 'Released back to available pool following campaign cooldown', timestamp: '2026-08-15T12:00:00Z', severity: 'INFO', actor: 'admin@smshub.local' },
    ],
  },
  {
    id: 'num-003',
    e164: '+447911123456',
    country: SEED_COUNTRIES[1], // GB
    operator: SEED_OPERATORS[2], // Vodafone UK
    provider: SEED_PROVIDERS[0], // Sinch Global
    range: SEED_RANGES[2],
    status: 'ASSIGNED',
    activeAssignment: {
      id: 'asgn-003',
      numberId: 'num-003',
      clientId: 'cl-007',
      client: SEED_CLIENTS[6],
      agentId: 'agent-001',
      agent: SEED_AGENTS[0],
      assignedAt: '2026-02-14T11:00:00Z',
      assignedBy: 'admin@smshub.local',
    },
    monthlyCost: 2.00,
    currency: 'GBP',
    totalMessages: 132400,
    lastActivityAt: '2026-09-16T03:52:00Z',
    createdAt: '2026-01-10T10:00:00Z',
    assignmentHistories: [
      {
        id: 'hist-003-1',
        numberId: 'num-003',
        clientId: 'cl-007',
        clientName: 'SwiftPay Mobile UK',
        agentId: 'agent-001',
        agentName: 'Priya Sharma',
        assignedAt: '2026-02-14T11:00:00Z',
        endedAt: null,
        changedBy: 'admin@smshub.local',
        reason: 'UK Banking authorization notifications',
      },
    ],
    traffic: {
      smsCount: 132400,
      inboundVolume: 128900,
      outboundVolume: 3500,
      deliveryRate: 99.9,
      lastMessageAt: '2026-09-16T03:52:00Z',
      throughputTps: 34.2,
    },
    recentActivity: [
      { id: 'act-003-1', action: 'INBOUND_SMS', description: 'Card verification response routed to webhook', timestamp: '2026-09-16T03:52:00Z', severity: 'INFO', actor: 'SMPP Ingress Bind' },
    ],
  },
  {
    id: 'num-004',
    e164: '+447911123457',
    country: SEED_COUNTRIES[1], // GB
    operator: SEED_OPERATORS[2], // Vodafone UK
    provider: SEED_PROVIDERS[0], // Sinch Global
    range: SEED_RANGES[2],
    status: 'AVAILABLE',
    activeAssignment: null,
    monthlyCost: 2.00,
    currency: 'GBP',
    totalMessages: 0,
    lastActivityAt: null,
    createdAt: '2026-02-01T12:00:00Z',
    assignmentHistories: [],
    traffic: {
      smsCount: 0,
      inboundVolume: 0,
      outboundVolume: 0,
      deliveryRate: 100.0,
      lastMessageAt: null,
      throughputTps: 0,
    },
    recentActivity: [
      { id: 'act-004-1', action: 'INVENTORY_IMPORT', description: 'Batch provisioned from Sinch wholesale block', timestamp: '2026-02-01T12:00:00Z', severity: 'INFO', actor: 'admin@smshub.local' },
    ],
  },
  {
    id: 'num-005',
    e164: '+491511200334',
    country: SEED_COUNTRIES[2], // DE
    operator: SEED_OPERATORS[4], // Deutsche Telekom
    provider: SEED_PROVIDERS[2], // Infobip
    range: SEED_RANGES[4],
    status: 'ASSIGNED',
    activeAssignment: {
      id: 'asgn-005',
      numberId: 'num-005',
      clientId: 'cl-002',
      client: SEED_CLIENTS[1],
      agentId: 'agent-002',
      agent: SEED_AGENTS[1],
      assignedAt: '2026-01-28T09:30:00Z',
      assignedBy: 'admin@smshub.local',
    },
    monthlyCost: 2.20,
    currency: 'EUR',
    totalMessages: 84310,
    lastActivityAt: '2026-09-16T02:12:00Z',
    createdAt: '2026-01-12T08:00:00Z',
    assignmentHistories: [
      {
        id: 'hist-005-1',
        numberId: 'num-005',
        clientId: 'cl-002',
        clientName: 'Helios Global Logistics',
        agentId: 'agent-002',
        agentName: 'Sarah Jenkins',
        assignedAt: '2026-01-28T09:30:00Z',
        endedAt: null,
        changedBy: 'admin@smshub.local',
        reason: 'Central European telematics dispatch line',
      },
    ],
    traffic: {
      smsCount: 84310,
      inboundVolume: 79200,
      outboundVolume: 5110,
      deliveryRate: 99.4,
      lastMessageAt: '2026-09-16T02:12:00Z',
      throughputTps: 12.0,
    },
    recentActivity: [
      { id: 'act-005-1', action: 'INBOUND_SMS', description: 'Fleet container telemetry update received', timestamp: '2026-09-16T02:12:00Z', severity: 'INFO', actor: 'SMPP Ingress' },
    ],
  },
  {
    id: 'num-006',
    e164: '+33612345678',
    country: SEED_COUNTRIES[3], // FR
    operator: SEED_OPERATORS[5], // Orange France
    provider: SEED_PROVIDERS[5], // Orange Wholesale
    range: SEED_RANGES[5],
    status: 'SUSPENDED',
    activeAssignment: null,
    monthlyCost: 1.80,
    currency: 'EUR',
    totalMessages: 6300,
    lastActivityAt: '2026-08-30T16:00:00Z',
    createdAt: '2026-01-20T10:00:00Z',
    assignmentHistories: [
      {
        id: 'hist-006-1',
        numberId: 'num-006',
        clientId: 'cl-003',
        clientName: 'Veloce Courier Express',
        agentId: 'agent-004',
        agentName: 'Claire Renard',
        assignedAt: '2026-02-10T10:00:00Z',
        endedAt: '2026-08-30T16:00:00Z',
        changedBy: 'admin@smshub.local',
        reason: 'Regulatory compliance audit review pending',
      },
    ],
    traffic: {
      smsCount: 6300,
      inboundVolume: 6300,
      outboundVolume: 0,
      deliveryRate: 98.1,
      lastMessageAt: '2026-08-30T16:00:00Z',
      throughputTps: 0,
    },
    recentActivity: [
      { id: 'act-006-1', action: 'SUSPENDED', description: 'Suspended by admin due to regulatory check', timestamp: '2026-08-30T16:00:00Z', severity: 'WARNING', actor: 'admin@smshub.local' },
    ],
  },
  {
    id: 'num-007',
    e164: '+819012345678',
    country: SEED_COUNTRIES[4], // JP
    operator: SEED_OPERATORS[6], // NTT Docomo
    provider: SEED_PROVIDERS[0], // Sinch Global
    range: SEED_RANGES[6],
    status: 'ASSIGNED',
    activeAssignment: {
      id: 'asgn-007',
      numberId: 'num-007',
      clientId: 'cl-005',
      client: SEED_CLIENTS[4],
      agentId: 'agent-003',
      agent: SEED_AGENTS[2],
      assignedAt: '2026-03-01T04:00:00Z',
      assignedBy: 'admin@smshub.local',
    },
    monthlyCost: 3.50,
    currency: 'USD',
    totalMessages: 51200,
    lastActivityAt: '2026-09-16T03:10:00Z',
    createdAt: '2026-02-15T09:00:00Z',
    assignmentHistories: [
      {
        id: 'hist-007-1',
        numberId: 'num-007',
        clientId: 'cl-005',
        clientName: 'Quantum E-Commerce Ltd',
        agentId: 'agent-003',
        agentName: 'Daisuke Sato',
        assignedAt: '2026-03-01T04:00:00Z',
        endedAt: null,
        changedBy: 'admin@smshub.local',
        reason: 'Tokyo order confirmation inbound endpoint',
      },
    ],
    traffic: {
      smsCount: 51200,
      inboundVolume: 49800,
      outboundVolume: 1400,
      deliveryRate: 99.7,
      lastMessageAt: '2026-09-16T03:10:00Z',
      throughputTps: 8.5,
    },
    recentActivity: [
      { id: 'act-007-1', action: 'INBOUND_SMS', description: 'Order delivery status confirmed by customer', timestamp: '2026-09-16T03:10:00Z', severity: 'INFO', actor: 'Sinch Japan Gateway' },
    ],
  },
  {
    id: 'num-008',
    e164: '+6581234567',
    country: SEED_COUNTRIES[5], // SG
    operator: SEED_OPERATORS[7], // Singtel
    provider: SEED_PROVIDERS[0], // Sinch Global
    range: SEED_RANGES[7],
    status: 'RESERVED',
    activeAssignment: null,
    monthlyCost: 2.80,
    currency: 'USD',
    totalMessages: 0,
    lastActivityAt: null,
    createdAt: '2026-03-05T07:00:00Z',
    assignmentHistories: [],
    traffic: {
      smsCount: 0,
      inboundVolume: 0,
      outboundVolume: 0,
      deliveryRate: 100.0,
      lastMessageAt: null,
      throughputTps: 0,
    },
    recentActivity: [
      { id: 'act-008-1', action: 'RESERVED', description: 'Reserved for upcoming APAC enterprise bank onboarding', timestamp: '2026-03-05T07:00:00Z', severity: 'INFO', actor: 'sales@smshub.local' },
    ],
  },
  {
    id: 'num-009',
    e164: '+61412345678',
    country: SEED_COUNTRIES[6], // AU
    operator: SEED_OPERATORS[8], // Telstra
    provider: SEED_PROVIDERS[1], // Twilio
    range: SEED_RANGES[8],
    status: 'ASSIGNED',
    activeAssignment: {
      id: 'asgn-009',
      numberId: 'num-009',
      clientId: 'cl-006',
      client: SEED_CLIENTS[5],
      agentId: 'agent-001',
      agent: SEED_AGENTS[0],
      assignedAt: '2026-04-12T02:00:00Z',
      assignedBy: 'admin@smshub.local',
    },
    monthlyCost: 2.10,
    currency: 'AUD',
    totalMessages: 29400,
    lastActivityAt: '2026-09-15T21:40:00Z',
    createdAt: '2026-03-01T06:00:00Z',
    assignmentHistories: [
      {
        id: 'hist-009-1',
        numberId: 'num-009',
        clientId: 'cl-006',
        clientName: 'Nordic Secure Bank',
        agentId: 'agent-001',
        agentName: 'Priya Sharma',
        assignedAt: '2026-04-12T02:00:00Z',
        endedAt: null,
        changedBy: 'admin@smshub.local',
        reason: 'Sydney branch fraud detection hotline',
      },
    ],
    traffic: {
      smsCount: 29400,
      inboundVolume: 28100,
      outboundVolume: 1300,
      deliveryRate: 99.6,
      lastMessageAt: '2026-09-15T21:40:00Z',
      throughputTps: 4.2,
    },
    recentActivity: [
      { id: 'act-009-1', action: 'INBOUND_SMS', description: 'Transaction verification acknowledgment', timestamp: '2026-09-15T21:40:00Z', severity: 'INFO', actor: 'Telstra Interconnect' },
    ],
  },
  {
    id: 'num-010',
    e164: '+919820012345',
    country: SEED_COUNTRIES[7], // IN
    operator: SEED_OPERATORS[9], // Jio
    provider: SEED_PROVIDERS[6], // Tata Communications
    range: SEED_RANGES[9],
    status: 'ASSIGNED',
    activeAssignment: {
      id: 'asgn-010',
      numberId: 'num-010',
      clientId: 'cl-008',
      client: SEED_CLIENTS[7],
      agentId: 'agent-001',
      agent: SEED_AGENTS[0],
      assignedAt: '2026-05-18T10:00:00Z',
      assignedBy: 'admin@smshub.local',
    },
    monthlyCost: 1.20,
    currency: 'INR',
    totalMessages: 219800,
    lastActivityAt: '2026-09-16T03:58:00Z',
    createdAt: '2026-03-15T05:00:00Z',
    assignmentHistories: [
      {
        id: 'hist-010-1',
        numberId: 'num-010',
        clientId: 'cl-008',
        clientName: 'Mumbai FinTech Gateway',
        agentId: 'agent-001',
        agentName: 'Priya Sharma',
        assignedAt: '2026-05-18T10:00:00Z',
        endedAt: null,
        changedBy: 'admin@smshub.local',
        reason: 'National UPI instant confirmation ingress',
      },
    ],
    traffic: {
      smsCount: 219800,
      inboundVolume: 212400,
      outboundVolume: 7400,
      deliveryRate: 99.8,
      lastMessageAt: '2026-09-16T03:58:00Z',
      throughputTps: 62.8,
    },
    recentActivity: [
      { id: 'act-010-1', action: 'HIGH_THROUGHPUT_SPIKE', description: 'Peak 64 TPS sustained across morning market open', timestamp: '2026-09-16T03:58:00Z', severity: 'INFO', actor: 'Tata Gateway' },
    ],
  },
  {
    id: 'num-011',
    e164: '+14155552010',
    country: SEED_COUNTRIES[0], // US
    operator: SEED_OPERATORS[1], // AT&T
    provider: SEED_PROVIDERS[1], // Twilio
    range: SEED_RANGES[1],
    status: 'DECOMMISSIONED',
    activeAssignment: null,
    monthlyCost: 1.50,
    currency: 'USD',
    totalMessages: 15400,
    lastActivityAt: '2026-07-01T10:00:00Z',
    createdAt: '2025-11-10T08:00:00Z',
    assignmentHistories: [
      {
        id: 'hist-011-1',
        numberId: 'num-011',
        clientId: 'cl-001',
        clientName: 'Apex Capital FinTech',
        agentId: 'agent-001',
        agentName: 'Priya Sharma',
        assignedAt: '2025-11-15T09:00:00Z',
        endedAt: '2026-06-30T23:59:00Z',
        changedBy: 'admin@smshub.local',
        reason: 'Carrier block retired by upstream vendor',
      },
    ],
    traffic: {
      smsCount: 15400,
      inboundVolume: 15400,
      outboundVolume: 0,
      deliveryRate: 99.1,
      lastMessageAt: '2026-07-01T10:00:00Z',
      throughputTps: 0,
    },
    recentActivity: [
      { id: 'act-011-1', action: 'DECOMMISSIONED', description: 'Number retired permanently from platform routing table', timestamp: '2026-07-01T10:00:00Z', severity: 'WARNING', actor: 'admin@smshub.local' },
    ],
  },
  {
    id: 'num-012',
    e164: '+447700900123',
    country: SEED_COUNTRIES[1], // GB
    operator: SEED_OPERATORS[3], // EE Mobile
    provider: SEED_PROVIDERS[4], // Vodafone Direct
    range: SEED_RANGES[3],
    status: 'AVAILABLE',
    activeAssignment: null,
    monthlyCost: 1.90,
    currency: 'GBP',
    totalMessages: 0,
    lastActivityAt: null,
    createdAt: '2026-04-01T09:00:00Z',
    assignmentHistories: [],
    traffic: {
      smsCount: 0,
      inboundVolume: 0,
      outboundVolume: 0,
      deliveryRate: 100.0,
      lastMessageAt: null,
      throughputTps: 0,
    },
    recentActivity: [
      { id: 'act-012-1', action: 'PROVISIONED', description: 'Added to inventory from EE national range', timestamp: '2026-04-01T09:00:00Z', severity: 'INFO', actor: 'Carrier Sync Task' },
    ],
  },
];

// ---------------------------------------------------------------------------
// SERVICE CLASS
// ---------------------------------------------------------------------------

class NumbersService {
  /**
   * Fetch numbers matching filters, sorting, and pagination
   */
  async fetchNumbers(filterState: NumberFilterState): Promise<{
    items: NumberItem[];
    total: number;
    kpis: NumberKpiSummary;
  }> {
    try {
      const liveRes = await apiClient.getNumbers({
        search: filterState.search,
        status: filterState.status,
        countryId: filterState.countryId,
        operatorId: filterState.operatorId,
        clientId: filterState.clientId,
        page: filterState.page,
        limit: filterState.limit,
      });

      if (liveRes && liveRes.items && Array.isArray(liveRes.items) && liveRes.items.length > 0) {
        const items: NumberItem[] = liveRes.items.map((n: any) => ({
          id: n.id,
          e164: n.e164,
          country: n.country
            ? { id: n.country.id, isoCode: n.country.iso2 || 'US', name: n.country.name, dialCode: n.country.prefix || '+1', flag: '🌐' }
            : SEED_COUNTRIES[0],
          operator: n.operator
            ? { id: n.operator.id, name: n.operator.name, countryId: n.operator.countryId, mccMnc: n.operator.mccMnc || '000-00' }
            : null,
          provider: n.provider
            ? { id: n.provider.id, name: n.provider.name, status: n.provider.status || 'ACTIVE', type: n.provider.type || 'TIER_1_CARRIER', connectionHealth: 'HEALTHY', activeConnectionCount: 1 }
            : SEED_PROVIDERS[0],
          range: null,
          status: n.status as NumberStatus,
          activeAssignment: n.activeAssignment
            ? {
                id: n.activeAssignment.id,
                numberId: n.id,
                clientId: n.activeAssignment.clientId,
                client: {
                  id: n.activeAssignment.clientId,
                  name: n.activeAssignment.client?.name || 'Client',
                  companyName: n.activeAssignment.client?.companyName || 'Client Company',
                  email: n.activeAssignment.client?.email || 'client@sms.local',
                },
                agentId: n.activeAssignment.agentId,
                agent: n.activeAssignment.agent
                  ? {
                      id: n.activeAssignment.agentId,
                      name: n.activeAssignment.agent.user?.name || 'Agent',
                      email: n.activeAssignment.agent.user?.email || 'agent@sms.local',
                    }
                  : null,
                assignedAt: n.activeAssignment.assignedAt || new Date().toISOString(),
                assignedBy: 'admin@smshub.local',
              }
            : null,
          monthlyCost: n.monthlyCost ? Number(n.monthlyCost) : 1.5,
          currency: n.currency || 'USD',
          totalMessages: n._count?.inboundMessages ?? 0,
          lastActivityAt: n.updatedAt || new Date().toISOString(),
          createdAt: n.createdAt || new Date().toISOString(),
        }));

        const totalNumbers = liveRes.total || items.length;
        const assignedNumbers = items.filter((n) => n.activeAssignment !== null || n.status === 'ASSIGNED').length;
        const availableNumbers = items.filter((n) => n.status === 'AVAILABLE').length;
        const suspendedNumbers = items.filter((n) => n.status === 'SUSPENDED').length;
        const uniqueProviders = new Set(items.map((n) => n.provider.id)).size;
        const uniqueCountries = new Set(items.map((n) => n.country.id)).size;
        const assignmentUtilization = totalNumbers > 0 ? (assignedNumbers / totalNumbers) * 100 : 0;

        return {
          items,
          total: liveRes.total || items.length,
          kpis: {
            totalNumbers,
            availableNumbers,
            assignedNumbers,
            suspendedNumbers,
            providersCount: uniqueProviders,
            countriesCount: uniqueCountries,
            assignmentUtilization,
            recentlyAddedCount: items.length,
          },
        };
      }
    } catch (err) {
      console.warn('[NumbersService] Live API fetch failed, falling back to local dataset:', err);
    }

    await new Promise((resolve) => setTimeout(resolve, 80)); // realistic async delay

    let filtered = [...IN_MEMORY_NUMBERS];

    // Search by E.164 number or operator/country
    if (filterState.search.trim()) {
      const q = filterState.search.trim().toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.e164.toLowerCase().includes(q) ||
          n.country.name.toLowerCase().includes(q) ||
          (n.operator && n.operator.name.toLowerCase().includes(q)) ||
          n.provider.name.toLowerCase().includes(q) ||
          (n.activeAssignment && n.activeAssignment.client.companyName.toLowerCase().includes(q))
      );
    }

    // Filter by Status
    if (filterState.status && filterState.status !== 'ALL') {
      filtered = filtered.filter((n) => n.status === filterState.status);
    }

    // Filter by Country
    if (filterState.countryId && filterState.countryId !== 'ALL') {
      filtered = filtered.filter((n) => n.country.id === filterState.countryId || n.country.isoCode === filterState.countryId);
    }

    // Filter by Operator
    if (filterState.operatorId && filterState.operatorId !== 'ALL') {
      filtered = filtered.filter((n) => n.operator && n.operator.id === filterState.operatorId);
    }

    // Filter by Provider
    if (filterState.providerId && filterState.providerId !== 'ALL') {
      filtered = filtered.filter((n) => n.provider.id === filterState.providerId);
    }

    // Filter by Range
    if (filterState.rangeId && filterState.rangeId !== 'ALL') {
      filtered = filtered.filter((n) => n.range && n.range.id === filterState.rangeId);
    }

    // Filter by Assignment State
    if (filterState.assignmentState && filterState.assignmentState !== 'ALL') {
      if (filterState.assignmentState === 'ASSIGNED') {
        filtered = filtered.filter((n) => n.activeAssignment !== null);
      } else if (filterState.assignmentState === 'AVAILABLE') {
        filtered = filtered.filter((n) => n.activeAssignment === null && n.status === 'AVAILABLE');
      }
    }

    // Filter by Client
    if (filterState.clientId && filterState.clientId !== 'ALL') {
      filtered = filtered.filter((n) => n.activeAssignment && n.activeAssignment.clientId === filterState.clientId);
    }

    // Filter by Agent
    if (filterState.agentId && filterState.agentId !== 'ALL') {
      filtered = filtered.filter((n) => n.activeAssignment && n.activeAssignment.agentId === filterState.agentId);
    }

    // Sorting
    filtered.sort((a, b) => {
      const dir = filterState.sortDir === 'asc' ? 1 : -1;
      switch (filterState.sortBy) {
        case 'e164':
          return a.e164.localeCompare(b.e164) * dir;
        case 'country':
          return a.country.name.localeCompare(b.country.name) * dir;
        case 'operator': {
          const opA = a.operator ? a.operator.name : '';
          const opB = b.operator ? b.operator.name : '';
          return opA.localeCompare(opB) * dir;
        }
        case 'provider':
          return a.provider.name.localeCompare(b.provider.name) * dir;
        case 'status':
          return a.status.localeCompare(b.status) * dir;
        case 'messages':
          return (a.totalMessages - b.totalMessages) * dir;
        case 'createdAt':
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
        case 'assignedAt': {
          const tA = a.activeAssignment ? new Date(a.activeAssignment.assignedAt).getTime() : 0;
          const tB = b.activeAssignment ? new Date(b.activeAssignment.assignedAt).getTime() : 0;
          return (tA - tB) * dir;
        }
        case 'lastActivity': {
          const tA = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
          const tB = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
          return (tA - tB) * dir;
        }
        default:
          return (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) * dir;
      }
    });

    // Calculate dynamic KPIs over all numbers
    const totalNumbers = IN_MEMORY_NUMBERS.length;
    const availableNumbers = IN_MEMORY_NUMBERS.filter((n) => n.status === 'AVAILABLE').length;
    const assignedNumbers = IN_MEMORY_NUMBERS.filter((n) => n.status === 'ASSIGNED').length;
    const suspendedNumbers = IN_MEMORY_NUMBERS.filter((n) => n.status === 'SUSPENDED').length;
    const uniqueProviders = new Set(IN_MEMORY_NUMBERS.map((n) => n.provider.id)).size;
    const uniqueCountries = new Set(IN_MEMORY_NUMBERS.map((n) => n.country.id)).size;
    const assignmentUtilization = totalNumbers > 0 ? (assignedNumbers / totalNumbers) * 100 : 0;
    const recentlyAddedCount = IN_MEMORY_NUMBERS.filter((n) => {
      const ageMs = Date.now() - new Date(n.createdAt).getTime();
      return ageMs < 90 * 24 * 60 * 60 * 1000;
    }).length;

    const kpis: NumberKpiSummary = {
      totalNumbers,
      availableNumbers,
      assignedNumbers,
      suspendedNumbers,
      providersCount: uniqueProviders,
      countriesCount: uniqueCountries,
      assignmentUtilization,
      recentlyAddedCount,
    };

    // Pagination
    const page = filterState.page || 1;
    const limit = filterState.limit || 10;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      items: paginated,
      total: filtered.length,
      kpis,
    };
  }

  /**
   * Fetch single number details by ID
   */
  async fetchNumberById(id: string): Promise<NumberDetail> {
    try {
      const live = await apiClient.getNumberById(id);
      if (live && live.number) {
        const n = live.number;
        return {
          id: n.id,
          e164: n.e164,
          country: n.country
            ? { id: n.country.id, isoCode: n.country.iso2 || 'US', name: n.country.name, dialCode: n.country.prefix || '+1', flag: '🌐' }
            : SEED_COUNTRIES[0],
          operator: n.operator
            ? { id: n.operator.id, name: n.operator.name, countryId: n.operator.countryId, mccMnc: n.operator.mccMnc || '000-00' }
            : null,
          provider: n.provider
            ? { id: n.provider.id, name: n.provider.name, status: n.provider.status || 'ACTIVE', type: n.provider.type || 'TIER_1_CARRIER', connectionHealth: 'HEALTHY', activeConnectionCount: 1 }
            : SEED_PROVIDERS[0],
          range: null,
          status: n.status as NumberStatus,
          activeAssignment: n.activeAssignment
            ? {
                id: n.activeAssignment.id,
                numberId: n.id,
                clientId: n.activeAssignment.clientId,
                client: {
                  id: n.activeAssignment.clientId,
                  name: n.activeAssignment.client?.name || 'Client',
                  companyName: n.activeAssignment.client?.companyName || 'Client Company',
                  email: n.activeAssignment.client?.email || 'client@sms.local',
                },
                agentId: n.activeAssignment.agentId,
                agent: n.activeAssignment.agent
                  ? {
                      id: n.activeAssignment.agentId,
                      name: n.activeAssignment.agent.user?.name || 'Agent',
                      email: n.activeAssignment.agent.user?.email || 'agent@sms.local',
                    }
                  : null,
                assignedAt: n.activeAssignment.assignedAt || new Date().toISOString(),
                assignedBy: 'admin@smshub.local',
              }
            : null,
          monthlyCost: n.monthlyCost ? Number(n.monthlyCost) : 1.5,
          currency: n.currency || 'USD',
          totalMessages: n._count?.inboundMessages ?? 0,
          lastActivityAt: n.updatedAt || new Date().toISOString(),
          createdAt: n.createdAt || new Date().toISOString(),
          assignmentHistories: (n.assignmentHistories || []).map((h: any) => ({
            id: h.id,
            numberId: n.id,
            clientId: h.clientId,
            clientName: h.client?.name || 'Client',
            agentId: h.agentId,
            agentName: h.agent?.user?.name || null,
            assignedAt: h.assignedAt || new Date().toISOString(),
            endedAt: h.releasedAt || null,
            changedBy: 'admin@smshub.local',
            reason: h.reason || 'Assignment lifecycle',
          })),
          traffic: {
            smsCount: n._count?.inboundMessages ?? 0,
            inboundVolume: n._count?.inboundMessages ?? 0,
            outboundVolume: 0,
            deliveryRate: 100.0,
            lastMessageAt: n.updatedAt || null,
            throughputTps: 0,
          },
          recentActivity: [],
        };
      }
    } catch (err) {
      console.warn('[NumbersService] Live number by ID failed, checking local:', err);
    }

    await new Promise((resolve) => setTimeout(resolve, 60));
    const found = IN_MEMORY_NUMBERS.find((n) => n.id === id);
    if (!found) {
      throw new Error(`Phone number with ID ${id} not found.`);
    }
    return JSON.parse(JSON.stringify(found));
  }

  /**
   * Create a new phone number in inventory
   */
  async createNumber(payload: CreateNumberPayload): Promise<NumberItem> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Validate E.164 uniqueness
    if (IN_MEMORY_NUMBERS.some((n) => n.e164 === payload.e164)) {
      throw new Error(`Number ${payload.e164} already exists in inventory.`);
    }

    const country = SEED_COUNTRIES.find((c) => c.id === payload.countryId) || SEED_COUNTRIES[0];
    const provider = SEED_PROVIDERS.find((p) => p.id === payload.providerId) || SEED_PROVIDERS[0];
    const operator = payload.operatorId ? SEED_OPERATORS.find((op) => op.id === payload.operatorId) || null : null;
    const range = payload.rangeId ? SEED_RANGES.find((r) => r.id === payload.rangeId) || null : null;

    const newNumber: NumberDetail = {
      id: `num-${Date.now()}`,
      e164: payload.e164,
      country,
      operator,
      provider,
      range,
      status: payload.status || 'AVAILABLE',
      activeAssignment: null,
      monthlyCost: payload.monthlyCost || 1.50,
      currency: 'USD',
      totalMessages: 0,
      lastActivityAt: null,
      createdAt: new Date().toISOString(),
      assignmentHistories: [],
      traffic: {
        smsCount: 0,
        inboundVolume: 0,
        outboundVolume: 0,
        deliveryRate: 100.0,
        lastMessageAt: null,
        throughputTps: 0,
      },
      recentActivity: [
        {
          id: `act-${Date.now()}`,
          action: 'NUMBER_PROVISIONED',
          description: `Number ${payload.e164} registered in inventory under ${provider.name}`,
          timestamp: new Date().toISOString(),
          severity: 'INFO',
          actor: 'admin@smshub.local',
        },
      ],
    };

    IN_MEMORY_NUMBERS.unshift(newNumber);
    return newNumber;
  }

  /**
   * Update number mutable metadata
   */
  async updateNumber(id: string, payload: UpdateNumberPayload): Promise<NumberItem> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const target = IN_MEMORY_NUMBERS.find((n) => n.id === id);
    if (!target) {
      throw new Error(`Number ${id} not found.`);
    }

    if (payload.operatorId !== undefined) {
      target.operator = payload.operatorId ? SEED_OPERATORS.find((op) => op.id === payload.operatorId) || null : null;
    }
    if (payload.rangeId !== undefined) {
      target.range = payload.rangeId ? SEED_RANGES.find((r) => r.id === payload.rangeId) || null : null;
    }
    if (payload.monthlyCost !== undefined) {
      target.monthlyCost = payload.monthlyCost;
    }

    return target;
  }

  /**
   * Update number operational status
   */
  async updateNumberStatus(id: string, newStatus: NumberStatus, reason?: string): Promise<NumberItem> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const target = IN_MEMORY_NUMBERS.find((n) => n.id === id);
    if (!target) {
      throw new Error(`Number ${id} not found.`);
    }

    // Business validation: cannot set status to AVAILABLE if active assignment exists
    if (newStatus === 'AVAILABLE' && target.activeAssignment) {
      throw new Error('Cannot set status to AVAILABLE while an active assignment exists. Release the assignment first.');
    }

    const previousStatus = target.status;
    target.status = newStatus;

    target.recentActivity.unshift({
      id: `act-${Date.now()}`,
      action: 'STATUS_CHANGED',
      description: `Status changed from ${previousStatus} to ${newStatus}. ${reason ? `Reason: ${reason}` : ''}`,
      timestamp: new Date().toISOString(),
      severity: newStatus === 'SUSPENDED' || newStatus === 'DECOMMISSIONED' ? 'WARNING' : 'INFO',
      actor: 'admin@smshub.local',
    });

    return target;
  }

  /**
   * Assign number to client (and optional agent)
   */
  async assignNumber(numberId: string, payload: AssignNumberPayload): Promise<NumberItem> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const target = IN_MEMORY_NUMBERS.find((n) => n.id === numberId);
    if (!target) {
      throw new Error(`Number ${numberId} not found.`);
    }

    if (target.status === 'DECOMMISSIONED') {
      throw new Error('Cannot assign a decommissioned number.');
    }
    if (target.status === 'SUSPENDED') {
      throw new Error('Cannot assign a suspended number. Restore status first.');
    }
    if (target.activeAssignment) {
      throw new Error(`Number is already assigned to ${target.activeAssignment.client.companyName}. Use reassign instead.`);
    }

    const client = SEED_CLIENTS.find((c) => c.id === payload.clientId);
    if (!client) {
      throw new Error(`Client ${payload.clientId} not found.`);
    }

    const agent = payload.agentId ? SEED_AGENTS.find((a) => a.id === payload.agentId) || null : null;
    const now = new Date().toISOString();

    // 1. Create ActiveAssignment
    target.activeAssignment = {
      id: `asgn-${Date.now()}`,
      numberId: target.id,
      clientId: client.id,
      client,
      agentId: agent ? agent.id : null,
      agent,
      assignedAt: now,
      assignedBy: payload.assignedBy || 'admin@smshub.local',
    };

    // 2. Append to AssignmentHistory
    target.assignmentHistories.unshift({
      id: `hist-${Date.now()}`,
      numberId: target.id,
      clientId: client.id,
      clientName: client.companyName,
      agentId: agent ? agent.id : null,
      agentName: agent ? agent.name : null,
      assignedAt: now,
      endedAt: null,
      changedBy: payload.assignedBy || 'admin@smshub.local',
      reason: payload.reason || 'Initial dedicated client allocation',
    });

    // 3. Update status
    target.status = 'ASSIGNED';

    // 4. Log activity
    target.recentActivity.unshift({
      id: `act-${Date.now()}`,
      action: 'NUMBER_ASSIGNED',
      description: `Assigned to ${client.companyName}${agent ? ` (Supervised by ${agent.name})` : ''}`,
      timestamp: now,
      severity: 'INFO',
      actor: payload.assignedBy || 'admin@smshub.local',
    });

    return target;
  }

  /**
   * Reassign number to a different client (and optional agent)
   */
  async reassignNumber(numberId: string, payload: ReassignNumberPayload): Promise<NumberItem> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const target = IN_MEMORY_NUMBERS.find((n) => n.id === numberId);
    if (!target) {
      throw new Error(`Number ${numberId} not found.`);
    }

    if (!target.activeAssignment) {
      throw new Error('Number does not have an active assignment to reassign. Use assign instead.');
    }

    if (target.status === 'DECOMMISSIONED' || target.status === 'SUSPENDED') {
      throw new Error(`Cannot reassign a ${target.status.toLowerCase()} number.`);
    }

    const targetClient = SEED_CLIENTS.find((c) => c.id === payload.targetClientId);
    if (!targetClient) {
      throw new Error(`Target client ${payload.targetClientId} not found.`);
    }

    const targetAgent = payload.targetAgentId ? SEED_AGENTS.find((a) => a.id === payload.targetAgentId) || null : null;
    const now = new Date().toISOString();
    const prevClientName = target.activeAssignment.client.companyName;

    // 1. Close current ActiveAssignment in history
    const activeHist = target.assignmentHistories.find((h) => h.endedAt === null);
    if (activeHist) {
      activeHist.endedAt = now;
    }

    // 2. Replace ActiveAssignment
    target.activeAssignment = {
      id: `asgn-${Date.now()}`,
      numberId: target.id,
      clientId: targetClient.id,
      client: targetClient,
      agentId: targetAgent ? targetAgent.id : null,
      agent: targetAgent,
      assignedAt: now,
      assignedBy: payload.changedBy || 'admin@smshub.local',
    };

    // 3. Append new entry to AssignmentHistory
    target.assignmentHistories.unshift({
      id: `hist-${Date.now()}`,
      numberId: target.id,
      clientId: targetClient.id,
      clientName: targetClient.companyName,
      agentId: targetAgent ? targetAgent.id : null,
      agentName: targetAgent ? targetAgent.name : null,
      assignedAt: now,
      endedAt: null,
      changedBy: payload.changedBy || 'admin@smshub.local',
      reason: payload.reason || `Reassigned from ${prevClientName}`,
    });

    target.status = 'ASSIGNED';

    // 4. Log activity
    target.recentActivity.unshift({
      id: `act-${Date.now()}`,
      action: 'NUMBER_REASSIGNED',
      description: `Reassigned from ${prevClientName} to ${targetClient.companyName}`,
      timestamp: now,
      severity: 'INFO',
      actor: payload.changedBy || 'admin@smshub.local',
    });

    return target;
  }

  /**
   * Release number back to available pool
   */
  async releaseNumber(numberId: string, payload: ReleaseNumberPayload): Promise<NumberItem> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const target = IN_MEMORY_NUMBERS.find((n) => n.id === numberId);
    if (!target) {
      throw new Error(`Number ${numberId} not found.`);
    }

    if (!target.activeAssignment) {
      throw new Error('Number is not currently assigned. Cannot release an unassigned number.');
    }

    const now = new Date().toISOString();
    const prevClientName = target.activeAssignment.client.companyName;

    // 1. Close history entry
    const activeHist = target.assignmentHistories.find((h) => h.endedAt === null);
    if (activeHist) {
      activeHist.endedAt = now;
      if (payload.reason) {
        activeHist.reason = `${activeHist.reason || ''} [Released: ${payload.reason}]`.trim();
      }
    }

    // 2. Clear ActiveAssignment
    target.activeAssignment = null;

    // 3. Set status to AVAILABLE
    target.status = 'AVAILABLE';

    // 4. Log activity
    target.recentActivity.unshift({
      id: `act-${Date.now()}`,
      action: 'NUMBER_RELEASED',
      description: `Released from ${prevClientName} to available inventory pool. ${payload.reason ? `Reason: ${payload.reason}` : ''}`,
      timestamp: now,
      severity: 'INFO',
      actor: payload.releasedBy || 'admin@smshub.local',
    });

    return target;
  }

  /**
   * Get reference datasets
   */
  async fetchCountries(): Promise<CountrySummary[]> {
    return [...SEED_COUNTRIES];
  }

  async fetchOperators(countryId?: string): Promise<OperatorSummary[]> {
    if (countryId && countryId !== 'ALL') {
      return SEED_OPERATORS.filter((op) => op.countryId === countryId);
    }
    return [...SEED_OPERATORS];
  }

  async fetchProviders(): Promise<ProviderSummary[]> {
    return [...SEED_PROVIDERS];
  }

  async fetchRanges(providerId?: string, countryId?: string): Promise<RangeSummary[]> {
    let list = [...SEED_RANGES];
    if (providerId && providerId !== 'ALL') {
      list = list.filter((r) => r.providerId === providerId);
    }
    if (countryId && countryId !== 'ALL') {
      list = list.filter((r) => r.countryId === countryId);
    }
    return list;
  }

  async fetchClients(): Promise<NumberClientSummary[]> {
    return [...SEED_CLIENTS];
  }

  async fetchAgents(): Promise<NumberAgentSummary[]> {
    return [...SEED_AGENTS];
  }
}

export const numbersService = new NumbersService();
