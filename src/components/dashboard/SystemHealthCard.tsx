import React from 'react';
import { Activity, Database, Cpu, Clock, CheckCircle2, AlertTriangle, XCircle, HardDrive } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { SystemHealthReport } from '../../types/api';

interface SystemHealthCardProps {
  health: SystemHealthReport | null;
  latency: number | null;
  isLoading: boolean;
}

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({
  health,
  latency,
  isLoading,
}) => {
  const getDbBadge = (status?: string) => {
    switch (status) {
      case 'CONNECTED':
        return (
          <Badge variant="success" size="sm">
            <CheckCircle2 className="w-3 h-3" /> Connected
          </Badge>
        );
      case 'UNCONFIGURED':
        return (
          <Badge variant="warning" size="sm">
            <AlertTriangle className="w-3 h-3" /> Unconfigured (.env)
          </Badge>
        );
      default:
        return (
          <Badge variant="error" size="sm">
            <XCircle className="w-3 h-3" /> Disconnected
          </Badge>
        );
    }
  };

  return (
    <Card id="system-health-card">
      <CardHeader
        title="Infrastructure & API Gateway Status"
        subtitle="Real-time Node.js runtime, process memory, and Prisma database telemetry"
        icon={<Activity className="w-4 h-4 text-blue-500" />}
        action={
          <Badge
            variant={
              health?.status === 'healthy'
                ? 'success'
                : health?.status === 'degraded'
                  ? 'warning'
                  : 'neutral'
            }
            size="md"
          >
            {health?.status ? health.status.toUpperCase() : 'CHECKING'}
          </Badge>
        }
      />
      <CardContent>
        {isLoading && !health ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Querying server health endpoint (/api/health)...
          </div>
        ) : health ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: API Response & Latency */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>API Roundtrip</span>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-xl font-semibold text-slate-900 dark:text-slate-100 font-mono">
                {latency !== null ? `${latency} ms` : '--'}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Express 4 Gateway
              </div>
            </div>

            {/* Metric 2: Uptime */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Process Uptime</span>
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-xl font-semibold text-slate-900 dark:text-slate-100 font-mono">
                {health.uptimeFormatted}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Node {health.system.nodeVersion}
              </div>
            </div>

            {/* Metric 3: Memory Usage */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Heap Memory</span>
                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-xl font-semibold text-slate-900 dark:text-slate-100 font-mono">
                {health.system.memory.heapUsedMb} MB
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Total Allocated: {health.system.memory.heapTotalMb} MB
              </div>
            </div>

            {/* Metric 4: Database Connection */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>PostgreSQL / Prisma</span>
                <Database className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="mt-1">{getDbBadge(health.database.status)}</div>
              <div className="text-[11px] text-slate-500 mt-1 truncate" title={health.database.message}>
                {health.database.message || 'Prisma ORM v6.19'}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
            Unable to connect to /api/health. Please verify that the Express backend server is running.
          </div>
        )}
      </CardContent>
      {health && (
        <CardFooter className="flex items-center justify-between">
          <span>Environment: <strong className="font-mono text-slate-700 dark:text-slate-300">{health.environment}</strong></span>
          <span className="font-mono text-[11px]">Last verified: {new Date(health.timestamp).toLocaleTimeString()}</span>
        </CardFooter>
      )}
    </Card>
  );
};
