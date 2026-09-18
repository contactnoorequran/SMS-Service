import React from 'react';
import { Layers, CheckCircle2, CircleDashed } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { APP_CONFIG } from '../../../server/config/constants';

export const ArchitectureOverviewCard: React.FC = () => {
  return (
    <Card id="architecture-roadmap-card">
      <CardHeader
        title="Multi-Phase Platform Architecture Roadmap"
        subtitle="Phase-by-phase implementation plan — strictly adhering to scope discipline"
        icon={<Layers className="w-4 h-4 text-[var(--accent-violet)]" />}
        action={
          <Badge variant="purple" size="md">
            Phase 01 Active
          </Badge>
        }
      />
      <CardContent>
        <div className="space-y-3">
          {APP_CONFIG.supportedPhases.map((phase) => {
            const isActive = phase.status === 'ACTIVE';
            return (
              <div
                key={phase.id}
                className={`p-3.5 rounded-lg border flex items-center justify-between gap-4 transition-all ${
                  isActive
                    ? 'bg-[var(--accent-blue-dim)] border-[rgba(59,130,246,0.2)]'
                    : 'bg-[var(--glass-bg)]/40 border-[var(--glass-border)]/80 bg-[var(--bg-surface)]/40 border-[var(--glass-border)]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center font-mono text-xs font-semibold shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-[var(--glass-bg)] bg-[var(--glass-bg)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {phase.id}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                      {phase.name}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] truncate">
                      {isActive
                        ? 'Project structure, TypeScript, Express REST, Prisma ORM, Health checks & Logging'
                        : `Scheduled for development in Phase ${phase.id}`}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {isActive ? (
                    <Badge variant="success" size="sm">
                      <CheckCircle2 className="w-3 h-3" /> Foundation Ready
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      <CircleDashed className="w-3 h-3" /> Planned
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
