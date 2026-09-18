/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ManagerItem,
  ManagerDetail,
  ManagerKpiSummary,
  ManagerFilterState,
  CreateManagerPayload,
  UpdateManagerPayload,
  ManagerStatus,
  AgentPoolItem,
} from '../types/managers';
import { managersService } from '../services/managers';

const DEFAULT_FILTER_STATE: ManagerFilterState = {
  search: '',
  status: 'ALL',
  department: 'ALL',
  capacityStatus: 'ALL',
  sortBy: 'createdAt',
  sortDir: 'desc',
  page: 1,
  limit: 10,
};

export function useManagers() {
  const [managers, setManagers] = useState<ManagerItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [kpis, setKpis] = useState<ManagerKpiSummary>({
    totalManagers: 0,
    activeManagers: 0,
    suspendedManagers: 0,
    availableCapacity: 0,
    totalAssignedAgents: 0,
    totalMaxCapacity: 0,
  });
  const [departments, setDepartments] = useState<string[]>([]);
  const [filterState, setFilterState] = useState<ManagerFilterState>(DEFAULT_FILTER_STATE);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Selected manager for detail view (/managers/:id)
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const match = path.match(/^\/managers\/([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    }
    return null;
  });

  const [selectedManagerDetail, setSelectedManagerDetail] = useState<ManagerDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  // Available agent pool for assignments
  const [agentPool, setAgentPool] = useState<AgentPoolItem[]>([]);

  // Load managers
  const loadManagers = useCallback(async (isSilentRefresh = false) => {
    if (isSilentRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await managersService.fetchManagers(filterState);
      setManagers(result.items);
      setTotalCount(result.total);
      setKpis(result.kpis);
      setDepartments(result.departments);
    } catch (err: any) {
      setError(err?.message || 'Failed to load managers. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filterState]);

  // Load agent pool
  const loadAgentPool = useCallback(async () => {
    try {
      const pool = await managersService.fetchAvailableAgentsPool();
      setAgentPool(pool);
    } catch {
      // Ignore
    }
  }, []);

  // Fetch detailed manager by ID
  const loadManagerDetail = useCallback(async (id: string) => {
    setIsLoadingDetail(true);
    try {
      const detail = await managersService.fetchManagerById(id);
      setSelectedManagerDetail(detail);
    } catch (err: any) {
      console.error('[Managers] Failed to load manager details for ID:', id, err);
      setSelectedManagerDetail(null);
      setError(err?.message || 'Failed to load manager details');
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  // Sync with selectedManagerId
  useEffect(() => {
    if (selectedManagerId) {
      loadManagerDetail(selectedManagerId);
    } else {
      setSelectedManagerDetail(null);
    }
  }, [selectedManagerId, loadManagerDetail]);

  // Handle browser back / forward navigation
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const match = window.location.pathname.match(/^\/managers\/([a-zA-Z0-9_-]+)/);
        const newId = match ? match[1] : null;
        console.log('[Managers] Popstate triggered. Current manager ID:', newId);
        setSelectedManagerId(newId);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Effect to load managers on filter change
  useEffect(() => {
    loadManagers();
    loadAgentPool();
  }, [loadManagers, loadAgentPool]);

  // Update filter parameter
  const updateFilter = useCallback(
    <K extends keyof ManagerFilterState>(key: K, value: ManagerFilterState[K]) => {
      setFilterState((prev) => ({
        ...prev,
        [key]: value,
        page: key === 'page' ? (value as number) : 1, // reset to page 1 on filter change
      }));
    },
    []
  );

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilterState(DEFAULT_FILTER_STATE);
  }, []);

  // Navigation handlers
  const selectManager = useCallback((id: string) => {
    setSelectedManagerId(id);
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', `/managers/${id}`);
    }
  }, []);

  const clearSelectedManager = useCallback(() => {
    setSelectedManagerId(null);
    setSelectedManagerDetail(null);
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', '/managers');
    }
  }, []);

  // Mutations
  const createManager = useCallback(
    async (payload: CreateManagerPayload): Promise<ManagerItem> => {
      setIsMutating(true);
      try {
        const created = await managersService.createManager(payload);
        await loadManagers(true);
        return created;
      } finally {
        setIsMutating(false);
      }
    },
    [loadManagers]
  );

  const updateManager = useCallback(
    async (id: string, payload: UpdateManagerPayload): Promise<ManagerItem> => {
      setIsMutating(true);
      try {
        const updated = await managersService.updateManager(id, payload);
        await loadManagers(true);
        if (selectedManagerId === id) {
          await loadManagerDetail(id);
        }
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    [loadManagers, selectedManagerId, loadManagerDetail]
  );

  const updateManagerStatus = useCallback(
    async (id: string, status: ManagerStatus, reason?: string): Promise<ManagerItem> => {
      setIsMutating(true);
      try {
        const updated = await managersService.updateManagerStatus(id, status, reason);
        await loadManagers(true);
        if (selectedManagerId === id) {
          await loadManagerDetail(id);
        }
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    [loadManagers, selectedManagerId, loadManagerDetail]
  );

  const assignAgent = useCallback(
    async (managerId: string, agentId: string) => {
      setIsMutating(true);
      try {
        const res = await managersService.assignAgentToManager(managerId, agentId);
        await loadManagers(true);
        await loadAgentPool();
        if (selectedManagerId === managerId) {
          await loadManagerDetail(managerId);
        }
        return res;
      } finally {
        setIsMutating(false);
      }
    },
    [loadManagers, loadAgentPool, selectedManagerId, loadManagerDetail]
  );

  const unassignAgent = useCallback(
    async (managerId: string, agentId: string) => {
      setIsMutating(true);
      try {
        const res = await managersService.unassignAgentFromManager(managerId, agentId);
        await loadManagers(true);
        await loadAgentPool();
        if (selectedManagerId === managerId) {
          await loadManagerDetail(managerId);
        }
        return res;
      } finally {
        setIsMutating(false);
      }
    },
    [loadManagers, loadAgentPool, selectedManagerId, loadManagerDetail]
  );

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalCount / filterState.limit));
  }, [totalCount, filterState.limit]);

  return {
    managers,
    totalCount,
    kpis,
    departments,
    filterState,
    totalPages,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    selectedManagerId,
    selectedManagerDetail,
    isLoadingDetail,
    agentPool,
    updateFilter,
    resetFilters,
    selectManager,
    clearSelectedManager,
    createManager,
    updateManager,
    updateManagerStatus,
    assignAgent,
    unassignAgent,
    refresh: () => loadManagers(true),
  };
}
