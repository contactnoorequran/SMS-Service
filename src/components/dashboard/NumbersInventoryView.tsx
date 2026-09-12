import React, { useState, useEffect } from 'react';
import { Table, ColumnDef } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { FilterBar } from '../ui/FilterBar';
import { Hash, Globe, CheckCircle2, Clock, RefreshCw, Plus, Radio } from 'lucide-react';
import { apiClient } from '../../services/api';

interface PhoneNumberItem {
  id: string;
  e164Number: string;
  country: string;
  countryIso: string;
  status: 'ASSIGNED' | 'AVAILABLE' | 'RESERVED' | 'QUARANTINED';
  rangePrefix: string;
  assignedClient?: string;
  provider: string;
  monthlyCost: number;
}

export const NumbersInventoryView: React.FC = () => {
  const [numbers, setNumbers] = useState<PhoneNumberItem[]>([
    {
      id: 'num-1',
      e164Number: '+12025550110',
      country: 'United States',
      countryIso: 'US',
      status: 'ASSIGNED',
      rangePrefix: '+1202555',
      assignedClient: 'client.enterprise@sms-platform.internal',
      provider: 'TelcoDirect Global',
      monthlyCost: 1.50,
    },
    {
      id: 'num-2',
      e164Number: '+12025550111',
      country: 'United States',
      countryIso: 'US',
      status: 'AVAILABLE',
      rangePrefix: '+1202555',
      provider: 'TelcoDirect Global',
      monthlyCost: 1.50,
    },
    {
      id: 'num-3',
      e164Number: '+447911123456',
      country: 'United Kingdom',
      countryIso: 'GB',
      status: 'AVAILABLE',
      rangePrefix: '+447911',
      provider: 'Nexus SMPP Hub',
      monthlyCost: 2.00,
    },
  ]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredNumbers = numbers.filter((n) => {
    const matchesSearch =
      n.e164Number.includes(search) ||
      n.country.toLowerCase().includes(search.toLowerCase()) ||
      (n.assignedClient && n.assignedClient.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || n.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: PhoneNumberItem['status']) => {
    switch (status) {
      case 'ASSIGNED':
        return <Badge variant="info" size="sm">Assigned</Badge>;
      case 'AVAILABLE':
        return <Badge variant="success" size="sm">Available</Badge>;
      case 'RESERVED':
        return <Badge variant="warning" size="sm">Reserved</Badge>;
      case 'QUARANTINED':
        return <Badge variant="error" size="sm">Quarantined</Badge>;
    }
  };

  const columns: ColumnDef<PhoneNumberItem>[] = [
    {
      key: 'e164Number',
      header: 'E.164 Phone Number',
      sortable: true,
      render: (n) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <Hash className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-mono font-bold text-slate-900 dark:text-slate-100">{n.e164Number}</div>
            <div className="text-[11px] text-slate-400 font-mono">Range: {n.rangePrefix}*</div>
          </div>
        </div>
      ),
    },
    {
      key: 'country',
      header: 'Country / Jurisdiction',
      sortable: true,
      render: (n) => (
        <div className="flex items-center gap-1.5 text-xs">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {n.country} ({n.countryIso})
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Allocation Status',
      sortable: true,
      render: (n) => getStatusBadge(n.status),
    },
    {
      key: 'assignedClient',
      header: 'Assigned Enterprise Client',
      render: (n) => (
        <div className="text-xs">
          {n.assignedClient ? (
            <span className="font-mono text-blue-600 dark:text-blue-400 font-medium truncate block max-w-xs">
              {n.assignedClient}
            </span>
          ) : (
            <span className="text-slate-400 italic">Unassigned (Pool)</span>
          )}
        </div>
      ),
    },
    {
      key: 'provider',
      header: 'Upstream Carrier',
      render: (n) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
          {n.provider}
        </span>
      ),
    },
    {
      key: 'monthlyCost',
      header: 'Wholesale / Mo',
      sortable: true,
      className: 'text-right',
      render: (n) => (
        <div className="text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
          ${n.monthlyCost.toFixed(2)}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Hash className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                DID & Phone Number Inventory
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Pool allocations, carrier bindings, E.164 formatted numbers, and dedicated client leases
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search phone numbers or clients..."
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Assigned', value: 'ASSIGNED' },
              { label: 'Available', value: 'AVAILABLE' },
            ],
          },
        ]}
        totalCount={numbers.length}
        totalFiltered={filteredNumbers.length}
      />

      {/* Table */}
      <Table<PhoneNumberItem>
        columns={columns}
        data={filteredNumbers}
        keyExtractor={(n) => n.id}
        isLoading={isLoading}
      />
    </div>
  );
};
