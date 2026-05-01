'use client';

import { TrendingUp } from 'lucide-react';
import { Money } from '@/components/ui/RiyalSign';
import { Sheet } from '@/components/ui/Sheet';
import { Spinner } from '@/components/ui/Spinner';
import { Stat, StatGrid } from '@/components/ui/Stat';
import { Timeline } from '@/components/ui/Timeline';
import { useTransactions } from '@/hooks/expenses/useTransactions';
import { drillLabels } from '@/lib/expenses/labels';
import type { BankVM, ExpenseVM } from '@/lib/expenses/types';
import {
  compareByScheduledDesc,
  findAccount,
  findBank,
  formatSchedule,
  successRate,
  totalPaid,
} from '@/lib/expenses/utils';
import { TransactionTimelineItem } from './TransactionTimelineItem';

export interface DrillSheetProps {
  open: boolean;
  onClose: () => void;
  expense: ExpenseVM | undefined;
  banks: BankVM[];
  /** Optional id of the transaction to highlight + scroll to (deep-linked from a notification). */
  highlightTxId?: string;
}

export function DrillSheet({
  open,
  onClose,
  expense,
  banks,
  highlightTxId,
}: DrillSheetProps) {
  // Fetch only this expense's transactions — sized to one expense's history
  // (typically tens of rows), not the full ledger. Hook is a no-op when the
  // sheet is closed because `expenseId` won't change between toggles, and
  // we don't unmount it (the parent does), so refetches happen only on real
  // expense changes.
  const txs = useTransactions(
    expense ? { expenseId: expense.id } : { expenseId: '__none__' },
  );

  if (!expense) {
    return <Sheet open={open} onClose={onClose} />;
  }

  const bank = findBank(banks, expense.bankId);
  const account = findAccount(banks, expense.bankId, expense.accountId);
  const sortedTx = [...txs.data].sort(compareByScheduledDesc);
  const succeeded = txs.data.filter((t) => t.status === 'succeeded').length;
  const totalPaidValue = totalPaid(txs.data);
  const rate = successRate(txs.data);

  const isInitialLoading = txs.loading && txs.data.length === 0;

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
            value={<Money amount={totalPaidValue} />}
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
          {isInitialLoading ? (
            <Spinner fullArea size="lg" label="جارٍ تحميل السجل…" />
          ) : (
            <Timeline>
              {sortedTx.map((tx) => (
                <TransactionTimelineItem
                  key={tx.id}
                  tx={tx}
                  highlight={tx.id === highlightTxId}
                />
              ))}
            </Timeline>
          )}
        </div>
      </div>
    </Sheet>
  );
}
