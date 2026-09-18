/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo, useRef, type Dispatch, type SetStateAction } from 'react';
import { UsersService } from '../services/users';
import {
  UserItem,
  UserFilterState,
  UserKpiSummary,
  CreateUserPayload,
  UserStatus,
} from '../types/users';

const INITIAL_FILTERS: UserFilterState = {
  search: '',
  role: 'ALL',
  status: 'ALL',
  sortBy: 'createdAt',
  sortDir: 'desc',
  page: 1,
  limit: 10,
};

export interface UseUsersReturn {
  users: UserItem[];
  allUsers: UserItem[];
  totalCount: number;
  filteredCount: number;
  kpis: UserKpiSummary;
  filterState: UserFilterState;
  setFilterState: Dispatch<SetStateAction<UserFilterState>>;
  updateFilter: <K extends keyof UserFilterState>(key: K, value: UserFilterState[K]) => void;
  resetFilters: () => void;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  selectedUserId: string | null;
  selectedUser: UserItem | null;
  isLoadingDetail: boolean;
  selectUser: (id: string) => void;
  clearSelectedUser: () => void;
  setSelectedUser: (user: UserItem | null) => void;
  refresh: () => Promise<void>;
  createUser: (payload: CreateUserPayload) => Promise<UserItem>;
  updateUserStatus: (id: string, status: UserStatus, reason?: string) => Promise<UserItem>;
}

export function useUsers(initialFilters: Partial<UserFilterState> = {}): UseUsersReturn {
  const [filterState, setFilterState] = useState<UserFilterState>({
    ...INITIAL_FILTERS,
    ...initialFilters,
  });

  const [users, setUsers] = useState<UserItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Selected user ID from URL or user click
  const [selectedUserId, setSelectedUserId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const match = path.match(/^\/users\/([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    }
    return null;
  });

  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  const isFetchingRef = useRef<boolean>(false);

  const loadData = useCallback(async (isManualRefresh: boolean = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Fetch both unfiltered (for KPIs) and filtered users
      const [allResult, filteredResult] = await Promise.all([
        UsersService.fetchUsers({}),
        UsersService.fetchUsers(filterState),
      ]);

      setAllUsers(allResult.users);
      setUsers(filteredResult.users);
      setTotalCount(filteredResult.total);
      setError(null);
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      console.error('[Users] Failed to fetch users directory:', errorObj);
      setError(errorObj);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [filterState]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Load single user detail if selectedUserId is set
  const loadUserDetail = useCallback(async (id: string) => {
    setIsLoadingDetail(true);
    try {
      const user = await UsersService.fetchUserById(id);
      setSelectedUser(user);
    } catch (err) {
      console.error('[Users] Failed to load user details for ID:', id, err);
      setSelectedUser(null);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadUserDetail(selectedUserId);
    } else {
      setSelectedUser(null);
      setIsLoadingDetail(false);
    }
  }, [selectedUserId, loadUserDetail]);

  // Handle browser popstate for back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const match = path.match(/^\/users\/([a-zA-Z0-9_-]+)/);
        const newId = match ? match[1] : null;
        console.log('[Users] Popstate triggered. Current user ID:', newId);
        setSelectedUserId(newId);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const selectUser = useCallback((id: string) => {
    setSelectedUserId(id);
    if (typeof window !== 'undefined' && window.history) {
      const targetPath = `/users/${id}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
        console.log('[Users] Navigated to:', targetPath);
      }
    }
  }, []);

  const clearSelectedUser = useCallback(() => {
    setSelectedUserId(null);
    setSelectedUser(null);
    if (typeof window !== 'undefined' && window.history) {
      if (window.location.pathname !== '/users') {
        window.history.pushState({}, '', '/users');
        console.log('[Users] Returned to /users');
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  const updateFilter = useCallback(<K extends keyof UserFilterState>(key: K, value: UserFilterState[K]) => {
    setFilterState((prev) => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? (value as number) : 1, // Reset to page 1 on filter change
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilterState(INITIAL_FILTERS);
  }, []);

  const kpis = useMemo<UserKpiSummary>(() => {
    const total = allUsers.length;
    const active = allUsers.filter((u) => u.status === 'ACTIVE').length;
    const pending = allUsers.filter((u) => u.status === 'PENDING').length;
    const suspended = allUsers.filter((u) => u.status === 'SUSPENDED' || u.status === 'DISABLED').length;

    return {
      totalUsers: total,
      activeUsers: active,
      pendingUsers: pending,
      suspendedUsers: suspended,
    };
  }, [allUsers]);

  const handleCreateUser = useCallback(
    async (payload: CreateUserPayload): Promise<UserItem> => {
      try {
        const created = await UsersService.createUser(payload);
        await loadData(true);
        return created;
      } catch (err) {
        console.error('[Users] Failed to create user:', err);
        throw err;
      }
    },
    [loadData]
  );

  const handleUpdateStatus = useCallback(
    async (id: string, status: UserStatus, reason?: string): Promise<UserItem> => {
      try {
        const updated = await UsersService.updateUserStatus(id, status, reason);
        await loadData(true);
        if (selectedUser?.id === id) {
          setSelectedUser(updated);
        }
        return updated;
      } catch (err) {
        console.error('[Users] Failed to update user status:', err);
        throw err;
      }
    },
    [loadData, selectedUser]
  );

  return {
    users,
    allUsers,
    totalCount: allUsers.length,
    filteredCount: totalCount,
    kpis,
    filterState,
    setFilterState,
    updateFilter,
    resetFilters,
    isLoading,
    isRefreshing,
    error,
    selectedUserId,
    selectedUser,
    isLoadingDetail,
    selectUser,
    clearSelectedUser,
    setSelectedUser,
    refresh,
    createUser: handleCreateUser,
    updateUserStatus: handleUpdateStatus,
  };
}
