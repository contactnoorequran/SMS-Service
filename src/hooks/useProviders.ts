/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ProviderItem,
  ProviderDetail,
  ProviderKpiSummary,
  ProviderFilterState,
  CreateProviderPayload,
  UpdateProviderPayload,
  CreateConnectionPayload,
  UpdateConnectionPayload,
  ProviderStatus,
  ProviderConnectionStatus,
  ProviderConnectionSummary,
} from '../types/providers';
import { providersService } from '../services/providers';

const DEFAULT_FILTER_STATE: ProviderFilterState = {
  search: '',
  status: 'ALL',
  type: 'ALL',
  healthState: 'ALL',
  country: 'ALL',
  sortBy: 'volume',
  sortDir: 'desc',
  page: 1,
  limit: 10,
};

export function useProviders() {
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [kpis, setKpis] = useState<ProviderKpiSummary>({
    totalProviders: 0,
    activeProviders: 0,
    suspendedProviders: 0,
    totalConnections: 0,
    healthyConnections: 0,
    totalAssignedNumbers: 0,
    currentTrafficVolume: 0,
  });
  const [filterState, setFilterState] = useState<ProviderFilterState>(DEFAULT_FILTER_STATE);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Selected provider for details view (/providers/:id)
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const match = path.match(/^\/providers\/([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    }
    return null;
  });

  const [selectedProviderDetail, setSelectedProviderDetail] = useState<ProviderDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  // Load providers
  const loadProviders = useCallback(async (isSilentRefresh = false) => {
    if (isSilentRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await providersService.fetchProviders(filterState);
      setProviders(result.items);
      setTotalCount(result.total);
      setKpis(result.kpis);
    } catch (err: any) {
      setError(err?.message || 'Failed to load carrier providers. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filterState]);

  // Fetch detailed provider by ID
  const loadProviderDetail = useCallback(async (id: string) => {
    setIsLoadingDetail(true);
    try {
      const detail = await providersService.fetchProviderById(id);
      setSelectedProviderDetail(detail);
    } catch (err: any) {
      console.error('[Providers] Failed to load provider details for ID:', id, err);
      setSelectedProviderDetail(null);
      setError(err?.message || 'Failed to load carrier provider details');
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  // Sync with selectedProviderId
  useEffect(() => {
    if (selectedProviderId) {
      loadProviderDetail(selectedProviderId);
    } else {
      setSelectedProviderDetail(null);
    }
  }, [selectedProviderId, loadProviderDetail]);

  // Handle browser back / forward navigation
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const match = window.location.pathname.match(/^\/providers\/([a-zA-Z0-9_-]+)/);
        const newId = match ? match[1] : null;
        console.log('[Providers] Popstate triggered. Current provider ID:', newId);
        setSelectedProviderId(newId);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initial load and filter updates
  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  // Update filter parameters
  const updateFilter = useCallback(
    <K extends keyof ProviderFilterState>(key: K, value: ProviderFilterState[K]) => {
      setFilterState((prev) => ({
        ...prev,
        [key]: value,
        page: key === 'page' ? (value as number) : 1, // reset page to 1 on filter alteration
      }));
    },
    []
  );

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilterState(DEFAULT_FILTER_STATE);
  }, []);

  // Navigation handlers
  const selectProvider = useCallback((id: string) => {
    setSelectedProviderId(id);
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', `/providers/${id}`);
    }
  }, []);

  const clearSelectedProvider = useCallback(() => {
    setSelectedProviderId(null);
    setSelectedProviderDetail(null);
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', '/providers');
    }
  }, []);

  // Mutations
  const createProvider = useCallback(
    async (payload: CreateProviderPayload): Promise<ProviderItem> => {
      setIsMutating(true);
      try {
        const created = await providersService.createProvider(payload);
        await loadProviders(true);
        return created;
      } finally {
        setIsMutating(false);
      }
    },
    [loadProviders]
  );

  const updateProvider = useCallback(
    async (id: string, payload: UpdateProviderPayload): Promise<ProviderItem> => {
      setIsMutating(true);
      try {
        const updated = await providersService.updateProvider(id, payload);
        await loadProviders(true);
        if (selectedProviderId === id) {
          await loadProviderDetail(id);
        }
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    [loadProviders, selectedProviderId, loadProviderDetail]
  );

  const updateProviderStatus = useCallback(
    async (id: string, status: ProviderStatus, reason?: string): Promise<ProviderItem> => {
      setIsMutating(true);
      try {
        const updated = await providersService.updateProviderStatus(id, status, reason);
        await loadProviders(true);
        if (selectedProviderId === id) {
          await loadProviderDetail(id);
        }
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    [loadProviders, selectedProviderId, loadProviderDetail]
  );

  const createConnection = useCallback(
    async (providerId: string, payload: CreateConnectionPayload): Promise<ProviderConnectionSummary> => {
      setIsMutating(true);
      try {
        const created = await providersService.createProviderConnection(providerId, payload);
        await loadProviders(true);
        if (selectedProviderId === providerId) {
          await loadProviderDetail(providerId);
        }
        return created;
      } finally {
        setIsMutating(false);
      }
    },
    [loadProviders, selectedProviderId, loadProviderDetail]
  );

  const updateConnection = useCallback(
    async (
      providerId: string,
      connectionId: string,
      payload: UpdateConnectionPayload
    ): Promise<ProviderConnectionSummary> => {
      setIsMutating(true);
      try {
        const updated = await providersService.updateProviderConnection(providerId, connectionId, payload);
        await loadProviders(true);
        if (selectedProviderId === providerId) {
          await loadProviderDetail(providerId);
        }
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    [loadProviders, selectedProviderId, loadProviderDetail]
  );

  const updateConnectionStatus = useCallback(
    async (
      providerId: string,
      connectionId: string,
      status: ProviderConnectionStatus
    ): Promise<ProviderConnectionSummary> => {
      setIsMutating(true);
      try {
        const updated = await providersService.updateProviderConnectionStatus(providerId, connectionId, status);
        await loadProviders(true);
        if (selectedProviderId === providerId) {
          await loadProviderDetail(providerId);
        }
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    [loadProviders, selectedProviderId, loadProviderDetail]
  );

  const testConnection = useCallback(
    async (
      providerId: string,
      connectionId: string
    ): Promise<{ success: boolean; latencyMs: number; message: string; timestamp: string }> => {
      const res = await providersService.testProviderConnection(providerId, connectionId);
      if (selectedProviderId === providerId) {
        await loadProviderDetail(providerId);
      }
      return res;
    },
    [selectedProviderId, loadProviderDetail]
  );

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalCount / filterState.limit));
  }, [totalCount, filterState.limit]);

  return {
    providers,
    totalCount,
    kpis,
    filterState,
    totalPages,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    selectedProviderId,
    selectedProviderDetail,
    isLoadingDetail,
    updateFilter,
    resetFilters,
    selectProvider,
    clearSelectedProvider,
    createProvider,
    updateProvider,
    updateProviderStatus,
    createConnection,
    updateConnection,
    updateConnectionStatus,
    testConnection,
    refresh: () => loadProviders(true),
  };
}
