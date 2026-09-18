/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  NumberItem,
  NumberDetail,
  NumberKpiSummary,
  NumberFilterState,
  CountrySummary,
  OperatorSummary,
  RangeSummary,
  ProviderSummary,
  NumberClientSummary,
  NumberAgentSummary,
  NumberStatus,
  CreateNumberPayload,
  UpdateNumberPayload,
  AssignNumberPayload,
  ReassignNumberPayload,
  ReleaseNumberPayload,
} from '../types/numbers';
import { numbersService } from '../services/numbers';

const DEFAULT_FILTER_STATE: NumberFilterState = {
  search: '',
  status: 'ALL',
  countryId: 'ALL',
  operatorId: 'ALL',
  providerId: 'ALL',
  rangeId: 'ALL',
  assignmentState: 'ALL',
  clientId: 'ALL',
  agentId: 'ALL',
  sortBy: 'createdAt',
  sortDir: 'desc',
  page: 1,
  limit: 10,
};

export function useNumbers() {
  const [numbers, setNumbers] = useState<NumberItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [kpis, setKpis] = useState<NumberKpiSummary>({
    totalNumbers: 0,
    availableNumbers: 0,
    assignedNumbers: 0,
    suspendedNumbers: 0,
    providersCount: 0,
    countriesCount: 0,
    assignmentUtilization: 0,
    recentlyAddedCount: 0,
  });
  const [filterState, setFilterState] = useState<NumberFilterState>(DEFAULT_FILTER_STATE);

  // Lookups
  const [countries, setCountries] = useState<CountrySummary[]>([]);
  const [operators, setOperators] = useState<OperatorSummary[]>([]);
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [ranges, setRanges] = useState<RangeSummary[]>([]);
  const [clients, setClients] = useState<NumberClientSummary[]>([]);
  const [agents, setAgents] = useState<NumberAgentSummary[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Deep-link routing state (/numbers/:id)
  const [selectedNumberId, setSelectedNumberId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const match = path.match(/^\/numbers\/([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    }
    return null;
  });

  const [selectedNumberDetail, setSelectedNumberDetail] = useState<NumberDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  // Load lookup datasets once
  useEffect(() => {
    async function loadLookups() {
      try {
        const [cList, opList, pList, rList, clList, agList] = await Promise.all([
          numbersService.fetchCountries(),
          numbersService.fetchOperators(),
          numbersService.fetchProviders(),
          numbersService.fetchRanges(),
          numbersService.fetchClients(),
          numbersService.fetchAgents(),
        ]);
        setCountries(cList);
        setOperators(opList);
        setProviders(pList);
        setRanges(rList);
        setClients(clList);
        setAgents(agList);
      } catch (err: any) {
        console.error('Failed to load lookup references:', err);
      }
    }
    loadLookups();
  }, []);

  // Main data loader
  const loadNumbers = useCallback(
    async (isSilentRefresh = false) => {
      if (isSilentRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const result = await numbersService.fetchNumbers(filterState);
        setNumbers(result.items);
        setTotalCount(result.total);
        setKpis(result.kpis);
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch phone number inventory');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filterState]
  );

  // Single number detail loader
  const loadNumberDetail = useCallback(async (id: string) => {
    setIsLoadingDetail(true);
    try {
      const detail = await numbersService.fetchNumberById(id);
      setSelectedNumberDetail(detail);
    } catch (err: any) {
      console.error('[Numbers] Failed to load number details for ID:', id, err);
      setSelectedNumberDetail(null);
      setError(err?.message || `Failed to load details for number ${id}`);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  // Sync with selectedNumberId
  useEffect(() => {
    if (selectedNumberId) {
      loadNumberDetail(selectedNumberId);
    } else {
      setSelectedNumberDetail(null);
    }
  }, [selectedNumberId, loadNumberDetail]);

  // Handle browser back / forward navigation
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const match = window.location.pathname.match(/^\/numbers\/([a-zA-Z0-9_-]+)/);
        const newId = match ? match[1] : null;
        console.log('[Numbers] Popstate triggered. Current number ID:', newId);
        setSelectedNumberId(newId);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initial and reactive load
  useEffect(() => {
    loadNumbers();
  }, [loadNumbers]);

  // Filter modifiers
  const updateFilter = useCallback(
    <K extends keyof NumberFilterState>(key: K, value: NumberFilterState[K]) => {
      setFilterState((prev) => ({
        ...prev,
        [key]: value,
        page: key === 'page' ? (value as number) : 1, // reset page to 1 on filter alteration
      }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilterState(DEFAULT_FILTER_STATE);
  }, []);

  // Navigation handlers
  const selectNumber = useCallback((id: string) => {
    setSelectedNumberId(id);
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', `/numbers/${id}`);
    }
  }, []);

  const clearSelectedNumber = useCallback(() => {
    setSelectedNumberId(null);
    setSelectedNumberDetail(null);
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', '/numbers');
    }
  }, []);

  // Mutations
  const createNumber = useCallback(
    async (payload: CreateNumberPayload): Promise<NumberItem> => {
      setIsMutating(true);
      try {
        const created = await numbersService.createNumber(payload);
        await loadNumbers(true);
        return created;
      } finally {
        setIsMutating(false);
      }
    },
    [loadNumbers]
  );

  const updateNumber = useCallback(
    async (id: string, payload: UpdateNumberPayload): Promise<NumberItem> => {
      setIsMutating(true);
      try {
        const updated = await numbersService.updateNumber(id, payload);
        await loadNumbers(true);
        if (selectedNumberId === id) {
          await loadNumberDetail(id);
        }
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    [loadNumbers, selectedNumberId, loadNumberDetail]
  );

  const updateNumberStatus = useCallback(
    async (id: string, status: NumberStatus, reason?: string): Promise<NumberItem> => {
      setIsMutating(true);
      try {
        const updated = await numbersService.updateNumberStatus(id, status, reason);
        await loadNumbers(true);
        if (selectedNumberId === id) {
          await loadNumberDetail(id);
        }
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    [loadNumbers, selectedNumberId, loadNumberDetail]
  );

  const assignNumber = useCallback(
    async (numberId: string, payload: AssignNumberPayload): Promise<NumberItem> => {
      setIsMutating(true);
      try {
        const updated = await numbersService.assignNumber(numberId, payload);
        await loadNumbers(true);
        if (selectedNumberId === numberId) {
          await loadNumberDetail(numberId);
        }
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    [loadNumbers, selectedNumberId, loadNumberDetail]
  );

  const reassignNumber = useCallback(
    async (numberId: string, payload: ReassignNumberPayload): Promise<NumberItem> => {
      setIsMutating(true);
      try {
        const updated = await numbersService.reassignNumber(numberId, payload);
        await loadNumbers(true);
        if (selectedNumberId === numberId) {
          await loadNumberDetail(numberId);
        }
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    [loadNumbers, selectedNumberId, loadNumberDetail]
  );

  const releaseNumber = useCallback(
    async (numberId: string, payload: ReleaseNumberPayload): Promise<NumberItem> => {
      setIsMutating(true);
      try {
        const updated = await numbersService.releaseNumber(numberId, payload);
        await loadNumbers(true);
        if (selectedNumberId === numberId) {
          await loadNumberDetail(numberId);
        }
        return updated;
      } finally {
        setIsMutating(false);
      }
    },
    [loadNumbers, selectedNumberId, loadNumberDetail]
  );

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalCount / filterState.limit));
  }, [totalCount, filterState.limit]);

  return {
    numbers,
    totalCount,
    kpis,
    filterState,
    totalPages,
    countries,
    operators,
    providers,
    ranges,
    clients,
    agents,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    selectedNumberId,
    selectedNumberDetail,
    isLoadingDetail,
    updateFilter,
    resetFilters,
    selectNumber,
    clearSelectedNumber,
    createNumber,
    updateNumber,
    updateNumberStatus,
    assignNumber,
    reassignNumber,
    releaseNumber,
    refresh: () => loadNumbers(true),
  };
}
