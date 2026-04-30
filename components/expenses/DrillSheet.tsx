'use client';

import { TrendingUp } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Stat, StatGrid } from '@/components/ui/Stat';
import { Timeline } from '@/components/ui/Timeline';
import { commonLabels, drillLabels } from '@/lib/expenses/labels';
import type { BankVM, ExpenseVM, TransactionVM } from '@/lib/expenses/types';
import {
  compareByScheduledDesc,
  findAccount,
  findBank,
  formatAmount,
  formatSchedule,
  successRate,
  totalPaid,
} from '@/lib/expenses/utils';
import { TransactionTimelineItem } from './TransactionTimelineItem';

export interface DrillSheetProps {
  open: boolean;
  onClose: () => void;
  expense: ExpenseVM | undefined;
  transactions: TransactionVM[];
  banks: BankVM[];
}

export function DrillSheet({ open, onClose, expense, transactions, banks }: DrillSheetProps) {
  if (!expense) {
    return <Sheet open={open} onClose={onClose} />;
  }

  const bank = findBank(banks, expense.bankId);
  const account = findAccount(banks, expense.bankId, expense.accountId);
  const sortedTx = [...transactions].sort(compareByScheduledDesc);
  const succeeded = transactions.filter((t) => t.status === 'succeeded').length;
  const totalPaidValue = totalPaid(transactions);
  const rate = successRate(transactions);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="right"
      size="xl"
      title={
        <div>
          <div className="text-micro uppercase tracking-[0.2em] text-text-muted mb-1">
            {drillLabels.eyebrow}
          </div>
          <div>{expense.title}</div>
        </div>
      }
    >
      <div className="flex flex-col gap-8">
        <StatGrid columns={2}>
          <Stat
            label={drillLabels.statSource}
            value={bank?.name ?? '—'}
            hint={`${account?.label ?? ''} ${account?.accountNumber ?? ''}`.trim() || undefined}
          />
          <Stat
            label={drillLabels.statCadence}
            value={formatSchedule(expense)}
            hint={expense.amountType}
          />
          <Stat
            label={drillLabels.statTotalPaid}
            value={`${formatAmount(totalPaidValue)} ${commonLabels.currency}`}
            hint={drillLabels.statTotalPaidSuffix(succeeded)}
          />
          <Stat
            label={drillLabels.statSuccessRate}
            value={`${rate}%`}
            hint={drillLabels.statSuccessRateSuffix}
          />
        </StatGrid>

        <div>
          <h3 className="flex items-center gap-2 text-h3 font-bold text-text-primary mb-4">
            <TrendingUp size={18} className="text-primary-500" />
            {drillLabels.timelineTitle}
          </h3>
          <Timeline>
            {sortedTx.map((tx) => (
              <TransactionTimelineItem key={tx.id} tx={tx} />
            ))}
          </Timeline>
        </div>
      </div>
    </Sheet>
  );
}
