/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AgentItem,
  AgentDetail,
  AgentKpiSummary,
  AgentFilterState,
  CreateAgentPayload,
  UpdateAgentPayload,
  AgentStatus,
  ManagerSummary,
} from '../types/agents';
import { agentsService } from '../services/agents';

const DEFAULT_FILTER_STATE: AgentFilterState = {
  search: '',
  status: 'ALL',
  managerId: 'ALL',
  clientCountRange: 'ALL',
  sortBy: 'createdAt',
  sortDir: 'desc',
  page: 1,
  limit: 10,
};

export function useAgents() {
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [kpis, setKpis] = useState<AgentKpiSummary>({
    totalAgents: 0,
    activeAgents: 0,
    suspendedAgents: 0,
    totalClientsManaged: 0,
    totalAssignedNumbers: 0,
    totalCommissionEarned: 0,
    averageClientsPerAgent: 0,
  });
  const [managers, setManagers] = useState<ManagerSummary[]>([]);
  const [filterState, setFilterState] = useState<AgentFilterState>(DEFAULT_FILTER_STATE);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Selected agent for details view (/agents/:id)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const match = path.match(/^\/agents\/([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    }
    return null;
  });

  const [selectedAgentDetail, setSelectedAgentDetail] = useState<AgentDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  // Load agents
  const loadAgents = useCallback(async (isSilentRefresh = false) => {
    if (isSilentRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await agentsService.fetchAgents(filterState);
      setAgents(result.items);
      setTotalCount(result.total);
      setKpis(result.kpis);
    } catch (err: any) {
      setError(err?.message || 'Failed to load agents. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filterState]);

  // Load managers for assignment
  const loadManagers = useCallback(async () => {
    try {
      const mgrList = await agentsService.fetchManagers();
      setManagers(mgrList);
    } catch {
      // Ignore
    }
  }, []);

  // Fetch detailed agent by ID
  const loadAgentDetail = useCallback(async (id: string) => {
    setIsLoadingDetail(true);
    try {
      const detail = await agentsService.fetchAgentById(id);
      setSelectedAgentDetail(detail);
    } catch (err: any) {
      console.error('[Agents] Failed to load agent details for ID:', id, err);
      setSelectedAgentDetail(null);
      setError(err?.message || 'Failed to load agent profile details');
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  // Sync with selectedAgentId
  useEffect(() => {
    if (selectedAgentId) {
      loadAgentDetail(selectedAgentId);
    } else {
      setSelectedAgentDetail(null);
    }
  }, [selectedAgentId, loadAgentDetail]);

  // Handle browser back / forward navigation
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const match = window.location.pathname.match(/^\/agents\/([a-zA-Z0-9_-]+)/);
        const newId = match ? match[1] : null;
        console.log('[Agents] Popstate triggered. Current agent ID:', newId);
        setSelectedAgentId(newId);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initial load and filter updates
  useEffect(() => {
    loadAgents();
    loadManagers();
  }, [loadAgents, loadManagers]);

  // Update filter parameters
  const updateFilter = useCallback(
    <K extends keyof AgentFilterState>(key: K, value: AgentFilterState[K]) => {
      setFilterState((prev) => ({
        ...prev,
        [key]: value,
        page: key === 'page' ? (value as number) : 1, // reset page to 1 on filter modification
      }));
    },
    []
  );

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilterState(DEFAULT_FILTER_STATE);
  }, []);

  // Navigation handlers
  const selectAgent = useCallback((id: string) => {
    setSelectedAgentId(id);
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', `/agents/${id}`);
    }
  }, []);

  const clearSelectedAgent = useCallback(() => {
    setSelectedAgentId(null);
    setSelectedAgentDetail(null);
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', '/agents');
    }
  }, []);

  // Mutations
  const createAgent = useCallback(
    async (payload: CreateAgentPayload): Promise<AgentItem> => {
      setIsMutating(true);
      try {
        const created = await agentsService.createAgent(payload);
        await loadAgents(true);
        return created;
      } finally {
        setIsMutating(false);
      }
    },
    [loadAgents]
  );

  const updateAgent = useCallback(
    async (id: string, payload: UpdateAgentPayload): Promise<AgentItem> => {
      setIsMutating(true);
      try {
        const updated = await agentsService.updateAgent(id, payload);
        await loadAgents(true);
        if (selectedAgentId === id) {
          await loadAgentDetail(id);
        }
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    [loadAgents, selectedAgentId, loadAgentDetail]
  );

  const updateAgentStatus = useCallback(
    async (id: string, status: AgentStatus, reason?: string): Promise<AgentItem> => {
      setIsMutating(true);
      try {
        const updated = await agentsService.updateAgentStatus(id, status, reason);
        await loadAgents(true);
        if (selectedAgentId === id) {
          await loadAgentDetail(id);
        }
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    [loadAgents, selectedAgentId, loadAgentDetail]
  );

  const assignManager = useCallback(
    async (agentId: string, managerId: string | null): Promise<AgentItem> => {
      setIsMutating(true);
      try {
        const updated = await agentsService.assignManager(agentId, managerId);
        await loadAgents(true);
        await loadManagers();
        if (selectedAgentId === agentId) {
          await loadAgentDetail(agentId);
        }
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    [loadAgents, loadManagers, selectedAgentId, loadAgentDetail]
  );

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalCount / filterState.limit));
  }, [totalCount, filterState.limit]);

  return {
    agents,
    totalCount,
    kpis,
    managers,
    filterState,
    totalPages,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    selectedAgentId,
    selectedAgentDetail,
    isLoadingDetail,
    updateFilter,
    resetFilters,
    selectAgent,
    clearSelectedAgent,
    createAgent,
    updateAgent,
    updateAgentStatus,
    assignManager,
    refresh: () => loadAgents(true),
  };
}
