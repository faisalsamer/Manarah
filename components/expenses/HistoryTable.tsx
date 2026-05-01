'use client';

import { Money } from '@/components/ui/RiyalSign';
import { historyLabels } from '@/lib/expenses/labels';
import type { ExpenseVM, TransactionVM } from '@/lib/expenses/types';
import { formatDate, formatTime } from '@/lib/expenses/utils';
import { ExpenseStatusBadge } from './ExpenseStatusBadge';

export interface HistoryTableProps {
  transactions: TransactionVM[];
  expenses: ExpenseVM[];
}

export function HistoryTable({ transactions, expenses }: HistoryTableProps) {
  const expensesById = new Map(expenses.map((e) => [e.id, e]));

  if (transactions.length === 0) {
    return (
      <div className="bg-card-bg border border-border rounded-md py-12 text-center text-body-sm text-text-secondary">
        {historyLabels.emptyFiltered}
      </div>
    );
  }

  return (
    <div className="bg-card-bg border border-border rounded-md overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-12 gap-4 px-5 py-3 text-micro uppercase tracking-[0.15em] text-text-muted border-b border-border bg-surface font-semibold">
        <div className="col-span-3">{historyLabels.colDate}</div>
        <div className="col-span-3">{historyLabels.colExpense}</div>
        <div className="col-span-2">{historyLabels.colStatus}</div>
        <div className="col-span-2">{historyLabels.colReference}</div>
        <div className="col-span-2 text-left">{historyLabels.colAmount}</div>
      </div>

      {transactions.map((tx) => (
        <HistoryRow key={tx.id} tx={tx} expense={expensesById.get(tx.expenseId)} />
      ))}
    </div>
  );
}

interface HistoryRowProps {
  tx: TransactionVM;
  expense: ExpenseVM | undefined;
}

function HistoryRow({ tx, expense }: HistoryRowProps) {
  const dateToShow = tx.executedAt ?? tx.scheduledFor;
  return (
    <div className="grid grid-cols-12 gap-4 px-5 py-4 text-body-sm border-b border-border last:border-b-0 hover:bg-surface transition-colors">
      <div className="col-span-3">
        <div className="font-medium text-text-primary font-numbers">
          {formatDate(dateToShow)}
        </div>
        <div className="text-caption text-text-muted font-numbers">
          {formatTime(dateToShow)}
        </div>
      </div>
      <div className="col-span-3 min-w-0">
        <div className="font-medium text-text-primary truncate">
          {expense?.title ?? '—'}
        </div>
        {tx.note && (
          <div className="text-caption text-text-muted italic truncate">
            {tx.note}
          </div>
        )}
      </div>
      <div className="col-span-2">
        <ExpenseStatusBadge status={tx.status} retryCount={tx.retryCount} />
      </div>
      <div className="col-span-2 font-numbers text-caption text-text-muted truncate">
        {tx.bankRef ?? (tx.failureReason ? (
          <span className="text-danger font-arabic">
            {tx.failureReason}
          </span>
        ) : '—')}
      </div>
      <div className="col-span-2 text-left">
        {tx.amount ? (
          <Money amount={tx.amount} className="text-body font-semibold" />
        ) : (
          <span className="text-text-muted italic font-arabic">
            {historyLabels.pendingAmount}
          </span>
        )}
      </div>
    </div>
  );
}
