'use client';

import { useMemo, useState } from 'react';
import { ActionView } from '@/components/expenses/ActionView';
import { DrillSheet } from '@/components/expenses/DrillSheet';
import { ExpensesHeader } from '@/components/expenses/ExpensesHeader';
import { ExpensesTabs, type ExpensesTabValue } from '@/components/expenses/ExpensesTabs';
import { HistoryView } from '@/components/expenses/HistoryView';
import { RecurringView } from '@/components/expenses/RecurringView';
import { ResolveModal } from '@/components/expenses/ResolveModal';
import { ExpenseWizard } from '@/components/expenses/wizard/ExpenseWizard';
import { nowClientTimestamptz } from '@/lib/datetime';
import {
  MOCK_BANKS,
  MOCK_EXPENSES,
  MOCK_TRANSACTIONS,
} from '@/lib/expenses/mock-data';
import type { ExpenseDraft, ExpenseVM, TransactionVM } from '@/lib/expenses/types';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseVM[]>(MOCK_EXPENSES);
  const [transactions, setTransactions] = useState<TransactionVM[]>(MOCK_TRANSACTIONS);
  const [tab, setTab] = useState<ExpensesTabValue>('recurring');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [drillExpenseId, setDrillExpenseId] = useState<string | null>(null);
  const [resolveTxId, setResolveTxId] = useState<string | null>(null);

  const actionRequired = useMemo(
    () =>
      transactions.filter(
        (t) => t.status === 'failed' || t.status === 'awaiting_confirmation',
      ),
    [transactions],
  );

  const historyExecutedCount = useMemo(
    () => transactions.filter((t) => t.executedAt).length,
    [transactions],
  );

  const drillExpense = drillExpenseId
    ? expenses.find((e) => e.id === drillExpenseId)
    : undefined;
  const drillTransactions = drillExpenseId
    ? transactions.filter((t) => t.expenseId === drillExpenseId)
    : [];

  const resolveTx = resolveTxId ? transactions.find((t) => t.id === resolveTxId) : undefined;
  const resolveExpense = resolveTx
    ? expenses.find((e) => e.id === resolveTx.expenseId)
    : undefined;

  // ── Mutations (mock-only; replace with API calls later) ─────
  const handleAdd = (draft: ExpenseDraft) => {
    const { amountType, unit } = draft;
    if (!amountType || !unit) return;
    const newId = `exp-${Date.now()}`;
    const next: ExpenseVM = {
      id: newId,
      title: draft.title,
      description: draft.description || null,
      bankId: draft.bankId,
      accountId: draft.accountId,
      amountType,
      amount: amountType === 'fixed' ? draft.amount : null,
      unit,
      interval: draft.interval,
      dayOfWeek: unit === 'week' ? draft.dayOfWeek : null,
      dayOfMonth: unit === 'month' ? draft.dayOfMonth : null,
      timeOfDay: draft.timeOfDay,
      paymentMode: draft.paymentMode,
      status: 'active',
      createdAt: nowClientTimestamptz(),
    };
    setExpenses((list) => [...list, next]);
    setWizardOpen(false);
  };

  const handleDelete = (expenseId: string) => {
    setExpenses((list) => list.filter((e) => e.id !== expenseId));
    setTransactions((list) => list.filter((t) => t.expenseId !== expenseId));
  };

  const handleSkip = (txId: string) => {
    setTransactions((list) =>
      list.map((t) =>
        t.id === txId ? { ...t, status: 'skipped', note: 'تم التخطي يدوياً' } : t,
      ),
    );
  };

  const handleConfirm = (txId: string, amount: string) => {
    const now = nowClientTimestamptz();
    setTransactions((list) =>
      list.map((t) =>
        t.id === txId
          ? { ...t, status: 'succeeded', executedAt: now, amount }
          : t,
      ),
    );
  };

  const handleResolve = ({
    txId,
    bankId,
    accountId,
    updateLinked,
  }: {
    txId: string;
    bankId: string;
    accountId: string;
    updateLinked: boolean;
  }) => {
    const now = nowClientTimestamptz();
    setTransactions((list) =>
      list.map((t) =>
        t.id === txId
          ? {
              ...t,
              status: 'succeeded',
              executedAt: now,
              resolvedManually: true,
            }
          : t,
      ),
    );
    if (updateLinked) {
      const tx = transactions.find((t) => t.id === txId);
      if (tx) {
        setExpenses((list) =>
          list.map((e) => (e.id === tx.expenseId ? { ...e, bankId, accountId } : e)),
        );
      }
    }
    setResolveTxId(null);
  };

  return (
    <main className="min-h-screen bg-page-bg">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-10 sm:py-14">
        <ExpensesHeader onNewExpense={() => setWizardOpen(true)} />

        <ExpensesTabs
          value={tab}
          onChange={setTab}
          recurringCount={expenses.length}
          historyCount={historyExecutedCount}
          actionCount={actionRequired.length}
        />

        {tab === 'recurring' && (
          <RecurringView
            expenses={expenses}
            transactions={transactions}
            banks={MOCK_BANKS}
            onOpen={setDrillExpenseId}
            onDelete={handleDelete}
            onNewExpense={() => setWizardOpen(true)}
          />
        )}

        {tab === 'history' && (
          <HistoryView transactions={transactions} expenses={expenses} />
        )}

        {tab === 'action' && (
          <ActionView
            transactions={actionRequired}
            expenses={expenses}
            banks={MOCK_BANKS}
            onResolveOpen={setResolveTxId}
            onConfirm={handleConfirm}
            onSkip={handleSkip}
          />
        )}
      </div>

      <ExpenseWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSubmit={handleAdd}
        banks={MOCK_BANKS}
      />

      <DrillSheet
        open={drillExpenseId !== null}
        onClose={() => setDrillExpenseId(null)}
        expense={drillExpense}
        transactions={drillTransactions}
        banks={MOCK_BANKS}
      />

      <ResolveModal
        open={resolveTxId !== null}
        onClose={() => setResolveTxId(null)}
        expense={resolveExpense}
        tx={resolveTx}
        banks={MOCK_BANKS}
        onResolve={handleResolve}
      />
    </main>
  );
}
