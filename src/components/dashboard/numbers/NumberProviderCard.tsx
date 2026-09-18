/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import {
  ProviderSummary,
  CountrySummary,
  OperatorSummary,
  RangeSummary,
} from '../../../types/numbers';
import { formatCurrency } from '../../../utils/formatters';
import { Radio, Globe, Layers, Server, DollarSign, Activity, Cable } from 'lucide-react';

interface NumberProviderCardProps {
  provider: ProviderSummary;
  country: CountrySummary;
  operator: OperatorSummary | null;
  range: RangeSummary | null;
  monthlyCost?: number;
  currency?: string;
}

export const NumberProviderCard: React.FC<NumberProviderCardProps> = ({
  provider,
  country,
  operator,
  range,
  monthlyCost,
  currency = 'USD',
}) => {
  const getHealthBadgeVariant = (health?: string) => {
    switch (health) {
      case 'HEALTHY':
        return 'success';
      case 'DEGRADED':
        return 'warning';
      case 'DOWN':
        return 'error';
      default:
        return 'neutral';
    }
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[var(--accent-blue)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Upstream Carrier & Inventory Allocation
          </h3>
        </div>
        <Badge variant={getHealthBadgeVariant(provider.connectionHealth)}>
          {provider.connectionHealth || 'HEALTHY'} BIND
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Provider Details */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-blue-dim)] border border-[var(--border-subtle)] text-[var(--accent-blue)] flex items-center justify-center font-bold text-xs shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                Carrier Provider
              </span>
              <div className="font-semibold text-sm text-[var(--text-primary)] mt-0.5">
                {provider.name}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)] mt-0.5">
                <span className="font-mono">{provider.type?.replace(/_/g, ' ') || 'TIER 1'}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Cable className="w-3 h-3 text-[var(--accent-emerald)]" />
                  {provider.activeConnectionCount || 2} active sockets
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Wholesale Cost */}
          {monthlyCost !== undefined && (
            <div className="p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[var(--accent-emerald)]" />
                <span className="text-[11px] text-[var(--text-secondary)]">Wholesale Base Cost</span>
              </div>
              <span className="font-mono font-bold text-[var(--accent-emerald)]">
                {formatCurrency(monthlyCost)} / mo
              </span>
            </div>
          )}
        </div>

        {/* Geo / Operator / Range Details */}
        <div className="space-y-2.5 p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-subtle)]">
          <div>
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
              Jurisdiction & Operator
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base">{country.flag || '🌐'}</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {country.name} ({country.dialCode})
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Operator: <strong className="text-[var(--text-primary)]">{operator ? operator.name : 'Direct Telco Ingress'}</strong>
              {operator?.mccMnc && <span className="font-mono text-[10px] text-[var(--text-muted)] ml-1">({operator.mccMnc})</span>}
            </div>
          </div>

          {range && (
            <div className="pt-2 border-t border-[var(--border-subtle)]/60">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold flex items-center gap-1">
                <Layers className="w-3 h-3" /> Allocated E.164 Range Block
              </span>
              <div className="font-mono text-[11px] text-[var(--accent-blue)] mt-0.5">
                {range.startE164} — {range.endE164}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
