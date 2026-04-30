'use client';

import { useMemo } from 'react';
import { Plus, Repeat, TrendingUp, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { commonLabels, pageLabels, recurringLabels } from '@/lib/expenses/labels';
import type { BankVM, ExpenseVM, TransactionVM } from '@/lib/expenses/types';
import { formatAmount } from '@/lib/expenses/utils';
import { ExpenseCard } from './ExpenseCard';
import { HeroStat } from './HeroStat';

export interface RecurringViewProps {
  expenses: ExpenseVM[];
  transactions: TransactionVM[];
  banks: BankVM[];
  onOpen: (expenseId: string) => void;
  onDelete: (expenseId: string) => void;
  onNewExpense: () => void;
}

export function RecurringView({
  expenses,
  transactions,
  banks,
  onOpen,
  onDelete,
  onNewExpense,
}: RecurringViewProps) {
  const totalFixed = useMemo(
    () =>
      expenses
        .filter((e) => e.amountType === 'fixed' && e.amount)
        .reduce((sum, e) => sum + parseFloat(e.amount as string), 0),
    [expenses],
  );
  const variableCount = useMemo(
    () => expenses.filter((e) => e.amountType === 'variable').length,
    [expenses],
  );

  if (expenses.length === 0) {
    return (
      <EmptyState
        bordered
        size="md"
        title={recurringLabels.emptyTitle}
        description={recurringLabels.emptyDescription}
        action={
          <Button variant="primary" startIcon={<Plus size={16} />} onClick={onNewExpense}>
            {pageLabels.newExpense}
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <HeroStat
          tone="primary"
          icon={<Repeat size={20} strokeWidth={2.25} />}
          label={recurringLabels.statActiveLabel}
          value={expenses.length}
          suffix={recurringLabels.statActiveSuffix}
        />
        <HeroStat
          tone="primary"
          icon={<Wallet size={20} strokeWidth={2.25} />}
          label={recurringLabels.statFixedLabel}
          value={`${formatAmount(totalFixed)} ${commonLabels.currency}`}
          suffix={recurringLabels.statFixedSuffix}
        />
        <HeroStat
          tone="warning"
          icon={<TrendingUp size={20} strokeWidth={2.25} />}
          label={recurringLabels.statVariableLabel}
          value={variableCount}
          suffix={recurringLabels.statVariableSuffix}
        />
      </div>

      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-h2 font-bold text-text-primary">
          {recurringLabels.sectionTitle}
        </h2>
        <span className="text-caption text-text-muted">
          {recurringLabels.sectionHint}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {expenses.map((expense) => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            transactions={transactions.filter((t) => t.expenseId === expense.id)}
            banks={banks}
            onOpen={onOpen}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
