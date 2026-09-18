/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NumberStatus =
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'SUSPENDED'
  | 'RESERVED'
  | 'DECOMMISSIONED';

export type NumbersSortField =
  | 'e164'
  | 'country'
  | 'operator'
  | 'provider'
  | 'status'
  | 'assignedAt'
  | 'createdAt'
  | 'messages'
  | 'lastActivity';

export interface CountrySummary {
  id: string;
  isoCode: string;
  name: string;
  dialCode: string;
  flag?: string;
}

export interface OperatorSummary {
  id: string;
  name: string;
  countryId: string;
  mccMnc?: string;
}

export interface RangeSummary {
  id: string;
  providerId: string;
  countryId: string;
  operatorId?: string | null;
  startE164: string;
  endE164: string;
  status: string;
}

export interface ProviderSummary {
  id: string;
  name: string;
  status: string;
  type?: string;
  connectionHealth?: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  activeConnectionCount?: number;
}

export interface NumberClientSummary {
  id: string;
  companyName: string;
  name: string;
  email: string;
}

export interface NumberAgentSummary {
  id: string;
  name: string;
  email: string;
}

export interface ActiveAssignmentSummary {
  id: string;
  numberId: string;
  clientId: string;
  client: NumberClientSummary;
  agentId?: string | null;
  agent?: NumberAgentSummary | null;
  assignedAt: string;
  assignedBy?: string;
}

export interface NumberAssignmentHistoryItem {
  id: string;
  numberId: string;
  clientId: string;
  clientName: string;
  agentId?: string | null;
  agentName?: string | null;
  assignedAt: string;
  endedAt: string | null;
  changedBy?: string;
  reason?: string;
}

export interface NumberTrafficSummary {
  smsCount: number;
  inboundVolume: number;
  outboundVolume: number;
  deliveryRate: number; // e.g. 99.4%
  lastMessageAt: string | null;
  throughputTps?: number;
}

export interface NumberActivityItem {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  severity?: 'INFO' | 'WARNING' | 'ERROR';
  actor?: string;
}

export interface NumberItem {
  id: string;
  e164: string;
  country: CountrySummary;
  operator: OperatorSummary | null;
  provider: ProviderSummary;
  range: RangeSummary | null;
  status: NumberStatus;
  activeAssignment: ActiveAssignmentSummary | null;
  monthlyCost?: number;
  currency?: string;
  totalMessages: number;
  lastActivityAt: string | null;
  createdAt: string;
}

export interface NumberDetail extends NumberItem {
  assignmentHistories: NumberAssignmentHistoryItem[];
  traffic: NumberTrafficSummary;
  recentActivity: NumberActivityItem[];
}

export interface NumberKpiSummary {
  totalNumbers: number;
  availableNumbers: number;
  assignedNumbers: number;
  suspendedNumbers: number;
  providersCount: number;
  countriesCount: number;
  assignmentUtilization: number; // e.g. 64.5%
  recentlyAddedCount: number;
}

export interface NumberFilterState {
  search: string;
  status: string; // 'ALL' | NumberStatus
  countryId: string; // 'ALL' | countryId
  operatorId: string; // 'ALL' | operatorId
  providerId: string; // 'ALL' | providerId
  rangeId: string; // 'ALL' | rangeId
  assignmentState: string; // 'ALL' | 'ASSIGNED' | 'AVAILABLE'
  clientId: string; // 'ALL' | clientId
  agentId: string; // 'ALL' | agentId
  sortBy: NumbersSortField;
  sortDir: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface CreateNumberPayload {
  e164: string;
  countryId: string;
  providerId: string;
  operatorId?: string;
  rangeId?: string;
  status?: NumberStatus;
  monthlyCost?: number;
}

export interface UpdateNumberPayload {
  operatorId?: string | null;
  rangeId?: string | null;
  monthlyCost?: number;
}

export interface AssignNumberPayload {
  clientId: string;
  agentId?: string | null;
  reason?: string;
  assignedBy?: string;
}

export interface ReassignNumberPayload {
  targetClientId: string;
  targetAgentId?: string | null;
  reason?: string;
  changedBy?: string;
}

export interface ReleaseNumberPayload {
  reason?: string;
  releasedBy?: string;
}

export interface UpdateNumberStatusPayload {
  status: NumberStatus;
  reason?: string;
}
