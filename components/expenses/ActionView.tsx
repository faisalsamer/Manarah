'use client';

import { CheckCircle2 } from 'lucide-react';
import { Callout } from '@/components/ui/Callout';
import { EmptyState } from '@/components/ui/EmptyState';
import { actionLabels } from '@/lib/expenses/labels';
import type { BankVM, ExpenseVM, TransactionVM } from '@/lib/expenses/types';
import { ConfirmCard } from './ConfirmCard';
import { FailedCard } from './FailedCard';

export interface ActionViewProps {
  transactions: TransactionVM[];
  expenses: ExpenseVM[];
  banks: BankVM[];
  onResolveOpen: (txId: string) => void;
  onConfirm: (txId: string, amount: string) => void;
  onSkip: (txId: string) => void;
}

export function ActionView({
  transactions,
  expenses,
  banks,
  onResolveOpen,
  onConfirm,
  onSkip,
}: ActionViewProps) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        size="lg"
        icon={<CheckCircle2 size={36} className="text-success" />}
        title={actionLabels.emptyTitle}
        description={actionLabels.emptyDescription}
      />
    );
  }

  const expensesById = new Map(expenses.map((e) => [e.id, e]));
  const bannerTitle =
    transactions.length === 1
      ? actionLabels.bannerTitleOne
      : actionLabels.bannerTitleMany(transactions.length);

  return (
    <div>
      <Callout
        variant="error"
        title={bannerTitle}
        description={actionLabels.bannerBody}
        className="mb-6"
      />

      <div className="flex flex-col gap-3">
        {transactions.map((tx) => {
          const expense = expensesById.get(tx.expenseId);
          if (tx.status === 'awaiting_confirmation') {
            return (
              <ConfirmCard
                key={tx.id}
                tx={tx}
                expense={expense}
                banks={banks}
                onConfirm={onConfirm}
                onSkip={onSkip}
              />
            );
          }
          return (
            <FailedCard
              key={tx.id}
              tx={tx}
              expense={expense}
              banks={banks}
              onResolveOpen={onResolveOpen}
              onSkip={onSkip}
            />
          );
        })}
      </div>
    </div>
  );
}
