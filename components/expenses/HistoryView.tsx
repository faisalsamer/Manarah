'use client';

import { Filter } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Field, Select } from '@/components/ui/Form';
import { Stat, StatGrid } from '@/components/ui/Stat';
import { commonLabels, historyLabels, statusLabels } from '@/lib/expenses/labels';
import type { ExpenseVM, TransactionStatus, TransactionVM } from '@/lib/expenses/types';
import {
  compareByScheduledDesc,
  formatAmount,
  totalPaid,
} from '@/lib/expenses/utils';
import { HistoryTable } from './HistoryTable';

type StatusFilter = TransactionStatus | 'all';

export interface HistoryViewProps {
  transactions: TransactionVM[];
  expenses: ExpenseVM[];
}

export function HistoryView({ transactions, expenses }: HistoryViewProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const succeededCount = useMemo(
    () => transactions.filter((t) => t.status === 'succeeded').length,
    [transactions],
  );
  const failedCount = useMemo(
    () => transactions.filter((t) => t.status === 'failed').length,
    [transactions],
  );
  const totalPaidValue = useMemo(() => totalPaid(transactions), [transactions]);

  const filtered = useMemo(() => {
    const list = [...transactions].sort(compareByScheduledDesc);
    if (statusFilter === 'all') return list;
    return list.filter((t) => t.status === statusFilter);
  }, [transactions, statusFilter]);

  return (
    <div>
      <StatGrid columns={3} className="mb-8">
        <Stat
          label={historyLabels.statPaidLabel}
          value={`${formatAmount(totalPaidValue)} ${commonLabels.currency}`}
          suffix={historyLabels.statPaidSuffix}
        />
        <Stat
          label={historyLabels.statSucceededLabel}
          value={succeededCount}
          suffix={historyLabels.statSucceededSuffix}
        />
        <Stat
          label={historyLabels.statFailedLabel}
          value={failedCount}
          suffix={historyLabels.statFailedSuffix}
        />
      </StatGrid>

      <div className="flex items-center justify-between mb-5 gap-4">
        <h2 className="text-h3 font-bold text-text-primary">
          {historyLabels.sectionTitle}
        </h2>
        <Field label={
          <span className="inline-flex items-center gap-1.5">
            <Filter size={14} />
            {historyLabels.filterLabel}
          </span>
        }>
          <Select
            inputSize="sm"
            fullWidth={false}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="all">{historyLabels.filterAll}</option>
            <option value="succeeded">{statusLabels.succeeded}</option>
            <option value="failed">{statusLabels.failed}</option>
            <option value="retrying">{statusLabels.retrying}</option>
            <option value="awaiting_confirmation">{statusLabels.awaiting_confirmation}</option>
            <option value="scheduled">{statusLabels.scheduled}</option>
            <option value="skipped">{statusLabels.skipped}</option>
          </Select>
        </Field>
      </div>

      <HistoryTable transactions={filtered} expenses={expenses} />
    </div>
  );
}
