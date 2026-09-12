export interface ApiSuccessResponse<T> {
  success: true;
  status: number;
  message?: string;
  data: T;
  meta?: Record<string, unknown>;
  timestamp: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  status: number;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[] | unknown;
  };
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface DbHealthStatus {
  status: 'CONNECTED' | 'DISCONNECTED' | 'UNCONFIGURED';
  latencyMs?: number;
  provider: 'postgresql';
  message?: string;
}

export interface SystemHealthReport {
  name: string;
  version: string;
  phase: string;
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  uptimeSeconds: number;
  uptimeFormatted: string;
  environment: string;
  system: {
    nodeVersion: string;
    platform: string;
    memory: {
      heapUsedMb: number;
      heapTotalMb: number;
      rssMb: number;
    };
  };
  database: DbHealthStatus;
  subsystems: {
    name: string;
    phase: string;
    status: 'READY' | 'PLANNED' | 'STANDBY';
  }[];
}
