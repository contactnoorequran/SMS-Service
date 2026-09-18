/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ManagerStatus = 'ACTIVE' | 'SUSPENDED' | 'DISABLED' | 'PENDING';
export type CapacityStatus = 'AVAILABLE' | 'NEAR_CAPACITY' | 'FULL';

export interface ManagerAgentItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  assignedAt: string;
  clientsCount: number;
}

export interface ManagerActivityItem {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  ipAddress?: string;
}

export interface ManagerItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  department: string;
  status: ManagerStatus;
  maxAgents: number;
  assignedAgentsCount: number;
  availableSlots: number;
  capacityPercentage: number;
  capacityStatus: CapacityStatus;
  permissions: string[];
  createdAt: string;
  lastLoginAt: string | null;
}

export interface ManagerDetail extends ManagerItem {
  agents: ManagerAgentItem[];
  recentActivity: ManagerActivityItem[];
}

export interface ManagerKpiSummary {
  totalManagers: number;
  activeManagers: number;
  suspendedManagers: number;
  availableCapacity: number;
  totalAssignedAgents: number;
  totalMaxCapacity: number;
}

export type ManagersSortField =
  | 'name'
  | 'email'
  | 'department'
  | 'status'
  | 'agents'
  | 'capacity'
  | 'available'
  | 'createdAt';

export interface ManagerFilterState {
  search: string;
  status: string; // 'ALL' | ManagerStatus
  department: string; // 'ALL' | specific department
  capacityStatus: string; // 'ALL' | CapacityStatus
  sortBy: ManagersSortField;
  sortDir: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface CreateManagerPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: string;
  maxAgents: number;
  status: ManagerStatus;
  role: 'MANAGER';
  permissions?: string[];
}

export interface UpdateManagerPayload {
  name?: string;
  department?: string;
  maxAgents?: number;
  status?: ManagerStatus;
  permissions?: string[];
}

export interface AgentPoolItem {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  assignedManagerId: string | null;
  assignedManagerName: string | null;
  clientsCount: number;
}
