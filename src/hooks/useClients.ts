/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ClientItem,
  ClientDetail,
  ClientKpiSummary,
  ClientFilterState,
  CreateClientPayload,
  UpdateClientPayload,
  ClientStatus,
  AgentSummary,
  ManagerSummary,
} from '../types/clients';
import { clientsService } from '../services/clients';

const DEFAULT_FILTER_STATE: ClientFilterState = {
  search: '',
  status: 'ALL',
  billingType: 'ALL',
  agentId: 'ALL',
  managerId: 'ALL',
  balanceRange: 'ALL',
  sortBy: 'createdAt',
  sortDir: 'desc',
  page: 1,
  limit: 10,
};

export function useClients() {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [kpis, setKpis] = useState<ClientKpiSummary>({
    totalClients: 0,
    activeClients: 0,
    suspendedClients: 0,
    totalAssignedNumbers: 0,
    totalWalletBalance: 0,
    totalSmsCount: 0,
    averageBalance: 0,
  });
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [managers, setManagers] = useState<ManagerSummary[]>([]);
  const [filterState, setFilterState] = useState<ClientFilterState>(DEFAULT_FILTER_STATE);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Selected client for details view (/clients/:id)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const match = path.match(/^\/clients\/([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    }
    return null;
  });

  const [selectedClientDetail, setSelectedClientDetail] = useState<ClientDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  // Load clients
  const loadClients = useCallback(async (isSilentRefresh = false) => {
    if (isSilentRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await clientsService.fetchClients(filterState);
      setClients(result.items);
      setTotalCount(result.total);
      setKpis(result.kpis);
    } catch (err: any) {
      setError(err?.message || 'Failed to load client accounts. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filterState]);

  // Load auxiliary data (agents and managers)
  const loadAuxiliaryData = useCallback(async () => {
    try {
      const [agentList, mgrList] = await Promise.all([
        clientsService.fetchAgents(),
        clientsService.fetchManagers(),
      ]);
      setAgents(agentList);
      setManagers(mgrList);
    } catch {
      // Ignore
    }
  }, []);

  // Fetch detailed client by ID
  const loadClientDetail = useCallback(async (id: string) => {
    setIsLoadingDetail(true);
    try {
      const detail = await clientsService.fetchClientById(id);
      setSelectedClientDetail(detail);
    } catch (err: any) {
      console.error('[Clients] Failed to load client details for ID:', id, err);
      setSelectedClientDetail(null);
      setError(err?.message || 'Failed to load client profile details');
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  // Sync with selectedClientId
  useEffect(() => {
    if (selectedClientId) {
      loadClientDetail(selectedClientId);
    } else {
      setSelectedClientDetail(null);
    }
  }, [selectedClientId, loadClientDetail]);

  // Handle browser back / forward navigation
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const match = window.location.pathname.match(/^\/clients\/([a-zA-Z0-9_-]+)/);
        const newId = match ? match[1] : null;
        console.log('[Clients] Popstate triggered. Current client ID:', newId);
        setSelectedClientId(newId);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initial load and filter updates
  useEffect(() => {
    loadClients();
    loadAuxiliaryData();
  }, [loadClients, loadAuxiliaryData]);

  // Update filter parameters
  const updateFilter = useCallback(
    <K extends keyof ClientFilterState>(key: K, value: ClientFilterState[K]) => {
      setFilterState((prev) => ({
        ...prev,
        [key]: value,
        page: key === 'page' ? (value as number) : 1, // reset page to 1 on filter change
      }));
    },
    []
  );

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilterState(DEFAULT_FILTER_STATE);
  }, []);

  // Navigation handlers
  const selectClient = useCallback((id: string) => {
    setSelectedClientId(id);
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', `/clients/${id}`);
    }
  }, []);

  const clearSelectedClient = useCallback(() => {
    setSelectedClientId(null);
    setSelectedClientDetail(null);
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', '/clients');
    }
  }, []);

  // Mutations
  const createClient = useCallback(
    async (payload: CreateClientPayload): Promise<ClientItem> => {
      setIsMutating(true);
      try {
        const created = await clientsService.createClient(payload);
        await loadClients(true);
        await loadAuxiliaryData();
        return created;
      } finally {
        setIsMutating(false);
      }
    },
    [loadClients, loadAuxiliaryData]
  );

  const updateClient = useCallback(
    async (id: string, payload: UpdateClientPayload): Promise<ClientItem> => {
      setIsMutating(true);
      try {
        const updated = await clientsService.updateClient(id, payload);
        await loadClients(true);
        await loadAuxiliaryData();
        if (selectedClientId === id) {
          await loadClientDetail(id);
        }
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    [loadClients, loadAuxiliaryData, selectedClientId, loadClientDetail]
  );

  const updateClientStatus = useCallback(
    async (id: string, status: ClientStatus, reason?: string): Promise<ClientItem> => {
      setIsMutating(true);
      try {
        const updated = await clientsService.updateClientStatus(id, status, reason);
        await loadClients(true);
        if (selectedClientId === id) {
          await loadClientDetail(id);
        }
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    [loadClients, selectedClientId, loadClientDetail]
  );

  const assignAgent = useCallback(
    async (clientId: string, agentId: string | null): Promise<ClientItem> => {
      setIsMutating(true);
      try {
        const updated = await clientsService.assignAgent(clientId, agentId);
        await loadClients(true);
        await loadAuxiliaryData();
        if (selectedClientId === clientId) {
          await loadClientDetail(clientId);
        }
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    [loadClients, loadAuxiliaryData, selectedClientId, loadClientDetail]
  );

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalCount / filterState.limit));
  }, [totalCount, filterState.limit]);

  return {
    clients,
    totalCount,
    kpis,
    agents,
    managers,
    filterState,
    totalPages,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    selectedClientId,
    selectedClientDetail,
    isLoadingDetail,
    updateFilter,
    resetFilters,
    selectClient,
    clearSelectedClient,
    createClient,
    updateClient,
    updateClientStatus,
    assignAgent,
    refresh: () => loadClients(true),
  };
}
