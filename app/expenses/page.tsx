'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { ActionView } from '@/components/expenses/ActionView';
import { DrillSheet } from '@/components/expenses/DrillSheet';
import { ExpensesHeader } from '@/components/expenses/ExpensesHeader';
import { ExpensesTabs, type ExpensesTabValue } from '@/components/expenses/ExpensesTabs';
import { HistoryView } from '@/components/expenses/HistoryView';
import { RecurringView } from '@/components/expenses/RecurringView';
import { ResolveModal } from '@/components/expenses/ResolveModal';
import { ExpenseWizard } from '@/components/expenses/wizard/ExpenseWizard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Spinner } from '@/components/ui/Spinner';
import { Money } from '@/components/ui/RiyalSign';
import { toast } from '@/components/ui/Toast';
import { useExpenses } from '@/hooks/expenses/useExpenses';
import { useLinkedBanks } from '@/hooks/expenses/useLinkedBanks';
import {
  useTransactions,
  useTransactionsCounts,
} from '@/hooks/expenses/useTransactions';
import { ApiError } from '@/lib/api/client';
import type { ExpenseDraft } from '@/lib/expenses/types';
import { useState } from 'react';

const ACTION_REQUIRED_STATUSES = ['failed', 'awaiting_confirmation'] as const;

const isTabValue = (v: string | null): v is ExpensesTabValue =>
  v === 'recurring' || v === 'history' || v === 'action';

export default function ExpensesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── URL-driven state ─────────────────────────────────────
  const tabParam = searchParams.get('tab');
  const tab: ExpensesTabValue = isTabValue(tabParam) ? tabParam : 'recurring';
  const drillExpenseId = searchParams.get('expense');
  const txParam = searchParams.get('tx');

  const writeParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const setTab = (next: ExpensesTabValue) => {
    // Reset history-view filters when leaving History to keep URLs tidy.
    if (tab === 'history' && next !== 'history') {
      writeParams({
        tab: next === 'recurring' ? null : next,
        status: null,
        page: null,
        pageSize: null,
      });
    } else {
      writeParams({ tab: next === 'recurring' ? null : next });
    }
  };

  const setDrillExpenseId = (id: string | null) => {
    writeParams({ expense: id });
  };

  // ── Data ─────────────────────────────────────────────────
  const expenses = useExpenses();
  const actionTxs = useTransactions({
    statuses: [...ACTION_REQUIRED_STATUSES],
  });
  const counts = useTransactionsCounts();
  const linkedBanks = useLinkedBanks();

  // ── Modal / dialog state (purely local, not URL-driven) ──
  const [wizardOpen, setWizardOpen] = useState(false);
  const [resolveTxId, setResolveTxId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [pendingSkip, setPendingSkip] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    txId: string;
    amount: string;
  } | null>(null);

  // ── Derived ──────────────────────────────────────────────
  // Notification deep-link: when a notification points to a tx but no expense,
  // resolve the tx → expenseId from the action-required list (most likely
  // candidate). If we don't have it cached, falls through to no drill.
  const drillExpenseFromTx = (() => {
    if (!txParam || drillExpenseId) return null;
    const tx = actionTxs.data.find((t) => t.id === txParam);
    return tx ? tx.expenseId : null;
  })();
  const effectiveDrillExpenseId = drillExpenseId ?? drillExpenseFromTx;

  const drillExpense = effectiveDrillExpenseId
    ? expenses.data.find((e) => e.id === effectiveDrillExpenseId)
    : undefined;

  const resolveTx = resolveTxId
    ? actionTxs.data.find((t) => t.id === resolveTxId)
    : undefined;
  const resolveExpense = resolveTx
    ? expenses.data.find((e) => e.id === resolveTx.expenseId)
    : undefined;

  // ── Mutation handlers ────────────────────────────────────
  /** Refetch every cache that may have shifted after a tx mutation. */
  const refreshAfterTxMutation = async () => {
    await Promise.all([counts.refetch(), linkedBanks.refetch()]);
  };

  const handleAdd = async (draft: ExpenseDraft) => {
    try {
      await expenses.create(draft);
      toast.success('تم جدولة المصروف الجديد');
      setWizardOpen(false);
    } catch (err) {
      const message =
        err instanceof ApiError && err.code === 'account_not_found'
          ? 'الحساب غير موجود — اختر حساباً آخر'
          : 'فشل جدولة المصروف';
      toast.error(message);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await expenses.remove(pendingDelete);
      await Promise.all([counts.refetch(), actionTxs.refetch()]);
      toast.success('تم حذف المصروف');
    } catch {
      toast.error('فشل حذف المصروف');
    } finally {
      setPendingDelete(null);
    }
  };

  const confirmSkip = async () => {
    if (!pendingSkip) return;
    try {
      await actionTxs.skip(pendingSkip);
      await refreshAfterTxMutation();
      toast.success('تم تخطي الدورة');
    } catch {
      toast.error('فشل تخطي الدورة');
    } finally {
      setPendingSkip(null);
    }
  };

  const confirmDebit = async () => {
    if (!pendingConfirm) return;
    try {
      await actionTxs.confirm(pendingConfirm.txId, pendingConfirm.amount);
      await refreshAfterTxMutation();
      toast.success('تم الخصم بنجاح');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'insufficient_funds') {
        toast.error('الرصيد غير كافٍ', 'اختر حساباً آخر أو تخطّ الدورة.');
      } else {
        toast.error('فشل الخصم');
      }
    } finally {
      setPendingConfirm(null);
    }
  };

  const handleResolve = async (opts: {
    txId: string;
    bankId: string;
    accountId: string;
    updateLinked: boolean;
  }) => {
    try {
      await actionTxs.resolve(opts.txId, {
        bankId: opts.bankId,
        accountId: opts.accountId,
        updateLinked: opts.updateLinked,
      });
      if (opts.updateLinked) await expenses.refetch();
      await refreshAfterTxMutation();
      toast.success('تم تسوية الدفعة');
    } catch (err) {
      const message =
        err instanceof ApiError && err.code === 'insufficient_funds'
          ? 'الرصيد غير كافٍ — اختر حساباً آخر'
          : 'فشل تسوية الدفعة';
      toast.error(message);
      throw err;
    }
  };

  // ── Render ───────────────────────────────────────────────
  const isInitialLoading =
    expenses.loading && expenses.data.length === 0;

  return (
    <main className="min-h-screen bg-page-bg">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-10 sm:py-14">
        <ExpensesHeader onNewExpense={() => setWizardOpen(true)} />

        <ExpensesTabs
          value={tab}
          onChange={setTab}
          recurringCount={expenses.data.length}
          historyCount={counts.data.executed}
          actionCount={counts.data.actionRequired}
        />

        {isInitialLoading ? (
          <Spinner fullArea size="lg" label="جارٍ التحميل…" />
        ) : (
          <>
            {tab === 'recurring' && (
              <RecurringView
                expenses={expenses.data}
                banks={linkedBanks.data}
                onOpen={setDrillExpenseId}
                onDelete={setPendingDelete}
                onNewExpense={() => setWizardOpen(true)}
              />
            )}
            {tab === 'history' && <HistoryView expenses={expenses.data} />}
            {tab === 'action' && (
              <ActionView
                transactions={actionTxs.data}
                expenses={expenses.data}
                banks={linkedBanks.data}
                onResolveOpen={setResolveTxId}
                onConfirm={(txId, amount) => setPendingConfirm({ txId, amount })}
                onSkip={setPendingSkip}
              />
            )}
          </>
        )}
      </div>

      <ExpenseWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSubmit={handleAdd}
        banks={linkedBanks.data}
      />

      <DrillSheet
        open={effectiveDrillExpenseId !== null}
        onClose={() => setDrillExpenseId(null)}
        expense={drillExpense}
        banks={linkedBanks.data}
        highlightTxId={txParam ?? undefined}
      />

      <ResolveModal
        open={resolveTxId !== null}
        onClose={() => setResolveTxId(null)}
        expense={resolveExpense}
        tx={resolveTx}
        banks={linkedBanks.data}
        onResolve={handleResolve}
      />

      {/* ── Confirmation dialogs ───────────────────────────── */}
      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="حذف المصروف"
        description="سيُحذف المصروف وكل سجلّ دفعاته. لا يمكن التراجع."
        variant="danger"
        confirmLabel="حذف"
        cancelLabel="إلغاء"
      />

      <ConfirmDialog
        open={pendingSkip !== null}
        onClose={() => setPendingSkip(null)}
        onConfirm={confirmSkip}
        title="تخطي هذه الدورة"
        description="ستُتخطى ولن تُخصم. الدورة القادمة ستعمل عادي."
        variant="warning"
        confirmLabel="نعم، تخطي"
        cancelLabel="إلغاء"
      />

      <ConfirmDialog
        open={pendingConfirm !== null}
        onClose={() => setPendingConfirm(null)}
        onConfirm={confirmDebit}
        title="تأكيد الخصم"
        description={
          pendingConfirm ? (
            <>
              سيتم خصم <Money amount={pendingConfirm.amount} />.
            </>
          ) : (
            ''
          )
        }
        variant="question"
        confirmLabel="تأكيد وخصم"
        cancelLabel="إلغاء"
      />
    </main>
  );
}
