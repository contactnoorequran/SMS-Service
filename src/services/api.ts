import { ApiSuccessResponse, SystemHealthReport } from '../types/api';
import { SafeUser } from '../types/auth';
import { DashboardResponseData, AppNotification } from '../types/dashboard';

/**
 * Validates whether a JWT string is structurally sound and unexpired.
 * Includes a 15-second safety skew buffer to preemptively refresh tokens.
 */
export function isJwtExpired(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    if (!parsed || typeof parsed.exp !== 'number') return false;
    // Buffer with 15 seconds margin
    return Date.now() >= (parsed.exp * 1000 - 15000);
  } catch {
    return true;
  }
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private reauthHandler: (() => Promise<string | null>) | null = null;
  private reauthPromise: Promise<string | null> | null = null;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
    // Restore token from localStorage only if strictly valid and unexpired
    try {
      const stored = localStorage.getItem('sms_auth_token');
      if (stored && !isJwtExpired(stored)) {
        this.token = stored;
      } else {
        this.token = null;
        if (stored) {
          localStorage.removeItem('sms_auth_token');
        }
      }
    } catch {
      this.token = null;
    }
  }

  public setToken(token: string | null) {
    if (token && isJwtExpired(token)) {
      this.token = null;
      try {
        localStorage.removeItem('sms_auth_token');
      } catch {
        // ignore
      }
      return;
    }

    this.token = token;
    try {
      if (token) {
        localStorage.setItem('sms_auth_token', token);
      } else {
        localStorage.removeItem('sms_auth_token');
      }
    } catch {
      // ignore
    }
  }

  public getToken(): string | null {
    if (this.token && isJwtExpired(this.token)) {
      this.setToken(null);
      return null;
    }
    return this.token;
  }

  /**
   * Registers a callback invoked to seamlessly acquire fresh tokens on 401 / session expiry.
   */
  public setReauthHandler(handler: () => Promise<string | null>) {
    this.reauthHandler = handler;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry: boolean = false
  ): Promise<ApiSuccessResponse<T>> {
    // If token is currently expired, purge before making authenticated calls
    if (this.token && isJwtExpired(this.token)) {
      this.setToken(null);
    }

    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    let data: any;
    try {
      data = await res.json();
    } catch {
      data = { success: false, error: { message: `HTTP ${res.status}: ${res.statusText}` } };
    }

    // Intercept 401 Unauthorized (expired token or invalid session)
    if (res.status === 401 && !isRetry && this.reauthHandler && !endpoint.includes('/auth/login')) {
      try {
        if (!this.reauthPromise) {
          this.reauthPromise = this.reauthHandler().finally(() => {
            this.reauthPromise = null;
          });
        }
        const refreshedToken = await this.reauthPromise;
        if (refreshedToken) {
          // Retry original request once with fresh token
          return await this.request<T>(endpoint, options, true);
        }
      } catch {
        // Re-auth failed, notify listeners and continue to throw
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
        }
      }
    }

    if (!res.ok || data.success === false) {
      const errorMessage = data?.error?.message || `Request failed with status ${res.status}`;
      const err = new Error(errorMessage) as any;
      err.status = res.status;
      err.code = data?.error?.code;
      throw err;
    }

    return data as ApiSuccessResponse<T>;
  }

  // System & Health
  async getHealth(): Promise<{ data: SystemHealthReport; latencyMs: number }> {
    const start = performance.now();
    const response = await this.request<SystemHealthReport>('/health');
    const latencyMs = Math.round(performance.now() - start);
    return { data: response.data, latencyMs };
  }

  async getRootInfo(): Promise<ApiSuccessResponse<unknown>> {
    return this.request('/');
  }

  async getDatabaseArchitecture(): Promise<ApiSuccessResponse<any>> {
    return this.request('/database/architecture');
  }

  // Authentication
  async login(email: string, password: string): Promise<{ user: SafeUser; token: string }> {
    const response = await this.request<{ user: SafeUser; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.data.token);
    return response.data;
  }

  async refreshToken(): Promise<{ user: SafeUser; token: string }> {
    const currentToken = this.token || (typeof localStorage !== 'undefined' ? localStorage.getItem('sms_auth_token') : null);
    const response = await this.request<{ user: SafeUser; token: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ token: currentToken }),
    });
    this.setToken(response.data.token);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async getCurrentUser(): Promise<SafeUser> {
    const response = await this.request<{ user: SafeUser }>('/auth/me');
    return response.data.user;
  }

  // Dashboard Stats & Analytics
  async getDashboardStats(): Promise<DashboardResponseData> {
    const response = await this.request<DashboardResponseData>('/dashboard/stats');
    return response.data;
  }

  // Notifications
  async getNotifications(): Promise<{ items: AppNotification[]; unreadCount: number }> {
    const response = await this.request<{ items: AppNotification[]; unreadCount: number }>('/notifications');
    return response.data;
  }

  async markNotificationRead(id: string): Promise<boolean> {
    const response = await this.request<{ read: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
    return response.data.read;
  }

  async markAllNotificationsRead(): Promise<number> {
    const response = await this.request<{ count: number }>('/notifications/mark-all-read', {
      method: 'POST',
    });
    return response.data.count;
  }

  // Users & RBAC
  async getUsers(): Promise<SafeUser[]> {
    const response = await this.request<SafeUser[]>('/users');
    return response.data;
  }

  // Manager Management (Phase 05)
  async getManagers(query: {
    search?: string;
    status?: string;
    department?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<any> {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.status && query.status !== 'ALL') params.set('status', query.status);
    if (query.department && query.department !== 'ALL') params.set('department', query.department);
    if (query.page) params.set('page', query.page.toString());
    if (query.limit) params.set('limit', query.limit.toString());
    if (query.sortBy) params.set('sortBy', query.sortBy);
    if (query.sortDir) params.set('sortDir', query.sortDir);

    const queryString = params.toString();
    const endpoint = `/managers${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<any>(endpoint);
    return response.data;
  }

  async getManagerById(id: string): Promise<any> {
    const response = await this.request<{ manager: any }>(`/managers/${id}`);
    return response.data.manager;
  }

  async createManager(data: any): Promise<{ manager: any; generatedPassword?: string }> {
    const response = await this.request<{ manager: any; generatedPassword?: string }>('/managers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateManager(id: string, data: any): Promise<any> {
    const response = await this.request<{ manager: any }>(`/managers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data.manager;
  }

  async updateManagerStatus(id: string, status: string, reason?: string): Promise<any> {
    const response = await this.request<{ manager: any }>(`/managers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
    return response.data.manager;
  }

  async resetManagerPassword(
    id: string,
    options: { newPassword?: string; autoGenerate?: boolean }
  ): Promise<{ temporaryPassword?: string }> {
    const response = await this.request<{ temporaryPassword?: string }>(`/managers/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
    return response.data;
  }

  async updateManagerPermissions(id: string, permissions: string[]): Promise<any> {
    const response = await this.request<{ manager: any }>(`/managers/${id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
    return response.data.manager;
  }

  async getManagerDepartments(): Promise<string[]> {
    const response = await this.request<{ departments: string[] }>('/managers/departments');
    return response.data.departments;
  }

  async getAvailablePermissions(): Promise<any[]> {
    const response = await this.request<{ permissions: any[] }>('/managers/available-permissions');
    return response.data.permissions;
  }

  // Phase 06: Agent Management APIs
  async getAgents(query: {
    search?: string;
    status?: string;
    managerId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<any> {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.status && query.status !== 'ALL') params.set('status', query.status);
    if (query.managerId && query.managerId !== 'ALL') params.set('managerId', query.managerId);
    if (query.page) params.set('page', query.page.toString());
    if (query.limit) params.set('limit', query.limit.toString());
    if (query.sortBy) params.set('sortBy', query.sortBy);
    if (query.sortDir) params.set('sortDir', query.sortDir);

    const queryString = params.toString();
    const endpoint = `/agents${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<any>(endpoint);
    return response.data;
  }

  async getAgentById(id: string): Promise<any> {
    const response = await this.request<any>(`/agents/${id}`);
    return response.data;
  }

  async createAgent(data: any): Promise<{ agent: any; generatedPassword?: string }> {
    const response = await this.request<{ agent: any; generatedPassword?: string }>('/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateAgent(id: string, data: any): Promise<any> {
    const response = await this.request<any>(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateAgentStatus(id: string, status: string, reason?: string): Promise<any> {
    const response = await this.request<any>(`/agents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
    return response.data;
  }

  async resetAgentPassword(
    id: string,
    options: { newPassword?: string; autoGenerate?: boolean }
  ): Promise<{ temporaryPassword?: string }> {
    const response = await this.request<{ temporaryPassword?: string }>(`/agents/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
    return response.data;
  }

  async updateAgentPermissions(id: string, permissions: string[]): Promise<any> {
    const response = await this.request<any>(`/agents/${id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
    return response.data;
  }

  async assignAgentManager(id: string, managerId: string | null): Promise<any> {
    const response = await this.request<any>(`/agents/${id}/assign-manager`, {
      method: 'PATCH',
      body: JSON.stringify({ managerId }),
    });
    return response.data;
  }

  async getAgentClients(id: string): Promise<any[]> {
    const response = await this.request<any[]>(`/agents/${id}/clients`);
    return response.data;
  }

  async getAgentNumbers(id: string): Promise<any[]> {
    const response = await this.request<any[]>(`/agents/${id}/numbers`);
    return response.data;
  }

  async getAgentStatistics(id: string): Promise<any> {
    const response = await this.request<any>(`/agents/${id}/statistics`);
    return response.data;
  }

  async getAgentActivity(id: string): Promise<any[]> {
    const response = await this.request<any[]>(`/agents/${id}/activity`);
    return response.data;
  }

  // Phase 07: Client Management APIs
  async getClients(query: {
    search?: string;
    status?: string;
    billingType?: string;
    agentId?: string;
    managerId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<any> {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.status && query.status !== 'ALL') params.set('status', query.status);
    if (query.billingType && query.billingType !== 'ALL') params.set('billingType', query.billingType);
    if (query.agentId && query.agentId !== 'ALL') params.set('agentId', query.agentId);
    if (query.managerId && query.managerId !== 'ALL') params.set('managerId', query.managerId);
    if (query.page) params.set('page', query.page.toString());
    if (query.limit) params.set('limit', query.limit.toString());
    if (query.sortBy) params.set('sortBy', query.sortBy);
    if (query.sortDir) params.set('sortDir', query.sortDir);

    const queryString = params.toString();
    const endpoint = `/clients${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<any>(endpoint);
    return response.data;
  }

  async getClientById(id: string): Promise<any> {
    const response = await this.request<any>(`/clients/${id}`);
    return response.data;
  }

  async getCurrentClientProfile(): Promise<any> {
    const response = await this.request<any>('/clients/me');
    return response.data;
  }

  async getCurrentClientDashboard(): Promise<any> {
    const response = await this.request<any>('/clients/me/dashboard');
    return response.data;
  }

  async createClient(data: any): Promise<{ client: any; generatedPassword?: string; generatedApiKey?: any }> {
    const response = await this.request<{ client: any; generatedPassword?: string; generatedApiKey?: any }>('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateClient(id: string, data: any): Promise<any> {
    const response = await this.request<any>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateClientStatus(id: string, status: string, reason?: string): Promise<any> {
    const response = await this.request<any>(`/clients/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
    return response.data;
  }

  async resetClientPassword(
    id: string,
    options: { newPassword?: string; autoGenerate?: boolean }
  ): Promise<{ temporaryPassword?: string }> {
    const response = await this.request<{ temporaryPassword?: string }>(`/clients/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
    return response.data;
  }

  async updateClientPermissions(id: string, permissions: string[]): Promise<any> {
    const response = await this.request<any>(`/clients/${id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
    return response.data;
  }

  async configureClientApiAccess(id: string, data: { enabled: boolean; rateLimitPerSecond?: number; rotateSecret?: boolean }): Promise<any> {
    const response = await this.request<any>(`/clients/${id}/api-access`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async getClientNumbers(id: string): Promise<any[]> {
    const response = await this.request<any[]>(`/clients/${id}/numbers`);
    return response.data;
  }

  async getClientStatistics(id: string): Promise<any> {
    const response = await this.request<any>(`/clients/${id}/statistics`);
    return response.data;
  }

  async getClientBalance(id: string): Promise<any> {
    const response = await this.request<any>(`/clients/${id}/balance`);
    return response.data;
  }

  async getClientActivity(id: string): Promise<any[]> {
    const response = await this.request<any[]>(`/clients/${id}/activity`);
    return response.data;
  }

  // Audit Logs
  async getAuditLogs(): Promise<any[]> {
    const response = await this.request<any[]>('/audit-logs');
    return response.data;
  }

  // Enterprise Providers (Phase 10-12)
  async getProviders(query: { search?: string; status?: string; type?: string; page?: number; limit?: number } = {}): Promise<any> {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.status && query.status !== 'ALL') params.set('status', query.status);
    if (query.type && query.type !== 'ALL') params.set('type', query.type);
    if (query.page) params.set('page', query.page.toString());
    if (query.limit) params.set('limit', query.limit.toString());
    const qs = params.toString();
    const response = await this.request<any>(`/providers${qs ? `?${qs}` : ''}`);
    return response.data;
  }

  async getProviderById(id: string): Promise<any> {
    const response = await this.request<any>(`/providers/${id}`);
    return response.data;
  }

  async createProvider(data: any): Promise<any> {
    const response = await this.request<any>('/providers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateProvider(id: string, data: any): Promise<any> {
    const response = await this.request<any>(`/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteProvider(id: string): Promise<any> {
    const response = await this.request<any>(`/providers/${id}`, {
      method: 'DELETE',
    });
    return response.data;
  }

  async testProviderConnection(id: string): Promise<any> {
    const response = await this.request<any>(`/providers/${id}/test-connection`, {
      method: 'POST',
    });
    return response.data;
  }

  // Enterprise Numbers (Phase 13-15)
  async getNumbers(query: { search?: string; status?: string; countryId?: string; operatorId?: string; clientId?: string; page?: number; limit?: number } = {}): Promise<any> {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.status && query.status !== 'ALL') params.set('status', query.status);
    if (query.countryId && query.countryId !== 'ALL') params.set('countryId', query.countryId);
    if (query.operatorId && query.operatorId !== 'ALL') params.set('operatorId', query.operatorId);
    if (query.clientId && query.clientId !== 'ALL') params.set('clientId', query.clientId);
    if (query.page) params.set('page', query.page.toString());
    if (query.limit) params.set('limit', query.limit.toString());
    const qs = params.toString();
    const response = await this.request<any>(`/numbers${qs ? `?${qs}` : ''}`);
    return response.data;
  }

  async getNumberById(id: string): Promise<any> {
    const response = await this.request<any>(`/numbers/${id}`);
    return response.data;
  }

  async assignNumber(id: string, data: { clientId: string; agentId?: string }): Promise<any> {
    const response = await this.request<any>(`/numbers/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async releaseNumber(id: string, data: { reason?: string } = {}): Promise<any> {
    const response = await this.request<any>(`/numbers/${id}/release`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async reassignNumber(id: string, data: { newClientId: string; newAgentId?: string; reason?: string }): Promise<any> {
    const response = await this.request<any>(`/numbers/${id}/reassign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async getNumberHistory(id: string): Promise<any> {
    const response = await this.request<any>(`/numbers/${id}/history`);
    return response.data;
  }

  async getCountries(): Promise<any[]> {
    const response = await this.request<{ countries: any[] }>('/numbers/countries');
    return response.data.countries;
  }

  async getOperators(): Promise<any[]> {
    const response = await this.request<{ operators: any[] }>('/numbers/operators');
    return response.data.operators;
  }

  // Enterprise Inbound Messaging (Phase 16-17)
  async getInboundMessages(query: { search?: string; status?: string; billingStatus?: string; providerId?: string; clientId?: string; page?: number; limit?: number } = {}): Promise<any> {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.status && query.status !== 'ALL') params.set('status', query.status);
    if (query.billingStatus && query.billingStatus !== 'ALL') params.set('billingStatus', query.billingStatus);
    if (query.providerId && query.providerId !== 'ALL') params.set('providerId', query.providerId);
    if (query.clientId && query.clientId !== 'ALL') params.set('clientId', query.clientId);
    if (query.page) params.set('page', query.page.toString());
    if (query.limit) params.set('limit', query.limit.toString());
    const qs = params.toString();
    const response = await this.request<any>(`/messages${qs ? `?${qs}` : ''}`);
    return response.data;
  }

  async getInboundMessageById(id: string): Promise<any> {
    const response = await this.request<any>(`/messages/${id}`);
    return response.data;
  }

  async ingestInboundMessage(data: { providerId: string; providerMessageId?: string; fromNumber: string; toNumber: string; body?: string }): Promise<any> {
    const response = await this.request<any>('/messages/inbound', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Enterprise CDR & Margin Accounting (Phase 18)
  async getCdrs(query: { search?: string; status?: string; clientId?: string; providerId?: string; page?: number; limit?: number } = {}): Promise<any> {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.status && query.status !== 'ALL') params.set('status', query.status);
    if (query.clientId && query.clientId !== 'ALL') params.set('clientId', query.clientId);
    if (query.providerId && query.providerId !== 'ALL') params.set('providerId', query.providerId);
    if (query.page) params.set('page', query.page.toString());
    if (query.limit) params.set('limit', query.limit.toString());
    const qs = params.toString();
    const response = await this.request<any>(`/cdr${qs ? `?${qs}` : ''}`);
    return response.data;
  }

  async getCdrById(id: string): Promise<any> {
    const response = await this.request<any>(`/cdr/${id}`);
    return response.data;
  }

  async getCdrSummary(): Promise<any> {
    const response = await this.request<any>('/cdr/summary');
    return response.data;
  }

  // Enterprise Billing & Multi-Party Wallets (Phase 19-20)
  async getWallets(): Promise<any[]> {
    const response = await this.request<{ wallets: any[] }>('/billing/wallets');
    return response.data.wallets;
  }

  async getWalletById(id: string): Promise<any> {
    const response = await this.request<any>(`/billing/wallets/${id}`);
    return response.data;
  }

  async getWalletLedger(id: string, query: { page?: number; limit?: number } = {}): Promise<any> {
    const params = new URLSearchParams();
    if (query.page) params.set('page', query.page.toString());
    if (query.limit) params.set('limit', query.limit.toString());
    const qs = params.toString();
    const response = await this.request<any>(`/billing/wallets/${id}/ledger${qs ? `?${qs}` : ''}`);
    return response.data;
  }

  async adjustWalletBalance(data: { walletId: string; amount: number; direction: 'CREDIT' | 'DEBIT'; description?: string }): Promise<any> {
    const response = await this.request<any>('/billing/wallets/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async getBillingEvents(query: { status?: string; eventType?: string; page?: number; limit?: number } = {}): Promise<any> {
    const params = new URLSearchParams();
    if (query.status && query.status !== 'ALL') params.set('status', query.status);
    if (query.eventType && query.eventType !== 'ALL') params.set('eventType', query.eventType);
    if (query.page) params.set('page', query.page.toString());
    if (query.limit) params.set('limit', query.limit.toString());
    const qs = params.toString();
    const response = await this.request<any>(`/billing/events${qs ? `?${qs}` : ''}`);
    return response.data;
  }

  async getBillingSummary(): Promise<any> {
    const response = await this.request<any>('/billing/summary');
    return response.data;
  }
}

export const apiClient = new ApiClient();
