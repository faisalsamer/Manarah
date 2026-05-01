'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ActiveView } from '@/components/marasi/ActiveView';
import { CancelledView } from '@/components/marasi/CancelledView';
import { MarasiHeader } from '@/components/marasi/MarasiHeader';
import { MarasiTabs, type MarasiTabValue } from '@/components/marasi/MarasiTabs';
import { MarsaDrillSheet } from '@/components/marasi/MarsaDrillSheet';
import { ReachedView } from '@/components/marasi/ReachedView';
import { ReleaseModal, type ReleaseMode } from '@/components/marasi/ReleaseModal';
import { TopUpModal } from '@/components/marasi/TopUpModal';
import { MarsaWizard } from '@/components/marasi/wizard/MarsaWizard';
import { nowClientTimestamptz } from '@/lib/datetime';
import {
  MOCK_BANKS,
  MOCK_MARASI,
  MOCK_MARASI_TRANSACTIONS,
} from '@/lib/marasi/mock-data';
import type {
  MarsaDraft,
  MarsaTransactionVM,
  MarsaVM,
} from '@/lib/marasi/types';
import { calcPlan } from '@/lib/marasi/utils';

const isTabValue = (v: string | null): v is MarasiTabValue =>
  v === 'active' || v === 'reached' || v === 'cancelled';

export default function MarasiPage() {
  const [marasi, setMarasi] = useState<MarsaVM[]>(MOCK_MARASI);
  const [transactions, setTransactions] = useState<MarsaTransactionVM[]>(
    MOCK_MARASI_TRANSACTIONS,
  );
  const [tab, setTab] = useState<MarasiTabValue>('active');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [drillId, setDrillId] = useState<string | null>(null);
  const [topUpId, setTopUpId] = useState<string | null>(null);
  const [releaseState, setReleaseState] = useState<{
    id: string;
    mode: ReleaseMode;
  } | null>(null);

  // ── Notification deep-links ────────────────────────────────
  // The bell builds URLs like /marasi?tab=active&marsa=<id>&tx=<id>.
  // Reflect those into local UI state. setState-in-effect is the legitimate
  // "URL → local state" sync; switching to fully URL-driven state is a larger
  // refactor not worth doing before the API layer lands.
  const searchParams = useSearchParams();
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const nextTab = searchParams.get('tab');
    if (isTabValue(nextTab)) setTab(nextTab);

    const marsaParam = searchParams.get('marsa');
    if (marsaParam) {
      setDrillId(marsaParam);
      return;
    }
    // If the URL only has ?tx=<id>, look up its parent marsa and open that.
    const txParam = searchParams.get('tx');
    if (txParam) {
      const tx = MOCK_MARASI_TRANSACTIONS.find((t) => t.id === txParam);
      if (tx) setDrillId(tx.marsaId);
    }
  }, [searchParams]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ── Derived collections ────────────────────────────────────
  const activeMarasi = useMemo(
    () => marasi.filter((m) => m.status === 'active'),
    [marasi],
  );
  const reachedMarasi = useMemo(
    () => marasi.filter((m) => m.status === 'reached'),
    [marasi],
  );
  const cancelledMarasi = useMemo(
    () => marasi.filter((m) => m.status === 'cancelled'),
    [marasi],
  );
  const activeUrgent = useMemo(
    () => activeMarasi.some((m) => m.failedAttempts > 0),
    [activeMarasi],
  );

  const drillMarsa = drillId ? marasi.find((m) => m.id === drillId) : undefined;
  const drillTransactions = drillId
    ? transactions.filter((t) => t.marsaId === drillId)
    : [];

  const topUpMarsa = topUpId ? marasi.find((m) => m.id === topUpId) : undefined;
  const releaseMarsa = releaseState
    ? marasi.find((m) => m.id === releaseState.id)
    : undefined;

  // ── Mutations (mock-only; replace with API calls later) ────
  const handleCreate = (draft: MarsaDraft) => {
    if (!draft.frequency) return;
    const plan = calcPlan(
      parseFloat(draft.targetAmount),
      0,
      draft.frequency,
      draft.targetDate,
    );
    if (!plan) return;

    const next: MarsaVM = {
      id: `mr-${Date.now()}`,
      title: draft.title,
      bankId: draft.bankId,
      accountId: draft.accountId,
      targetAmount: parseFloat(draft.targetAmount).toFixed(2),
      currentBalance: '0.00',
      periodicAmount: plan.periodicAmount.toFixed(2),
      frequency: draft.frequency,
      targetDate: draft.targetDate,
      status: 'active',
      withdrawn: false,
      failedAttempts: 0,
      nextDepositAt: `${plan.firstDepositDate}T09:00:00+03:00`,
      reachedAt: null,
      cancelledAt: null,
      withdrawnAt: null,
      releaseBankId: null,
      releaseAccountId: null,
      createdAt: nowClientTimestamptz(),
    };
    setMarasi((list) => [next, ...list]);
    setWizardOpen(false);
  };

  const handleTopUp = ({ marsaId, amount }: { marsaId: string; amount: string }) => {
    const now = nowClientTimestamptz();
    const target = marasi.find((m) => m.id === marsaId);
    if (!target) return;
    const newBalance = parseFloat(target.currentBalance) + parseFloat(amount);
    const targetAmount = parseFloat(target.targetAmount);
    const reaches = newBalance >= targetAmount;

    const newTx: MarsaTransactionVM = {
      id: `mt-${Date.now()}`,
      marsaId,
      type: 'manual_topup',
      amount: parseFloat(amount).toFixed(2),
      scheduledFor: now,
      executedAt: now,
      status: 'succeeded',
      retryCount: 0,
      bankRef: `MOCK-${Date.now()}`,
      failureReason: null,
      note: null,
      destinationBankId: null,
      destinationAccountId: null,
      attempts: [
        { id: `mt-${Date.now()}-a1`, at: now, status: 'succeeded', message: 'تم تفويض الإيداع اليدوي.' },
      ],
    };
    setTransactions((list) => [newTx, ...list]);
    setMarasi((list) =>
      list.map((m) =>
        m.id === marsaId
          ? {
              ...m,
              currentBalance: newBalance.toFixed(2),
              status: reaches ? 'reached' : m.status,
              reachedAt: reaches ? now : m.reachedAt,
              nextDepositAt: reaches ? null : m.nextDepositAt,
            }
          : m,
      ),
    );
    setTopUpId(null);
  };

  const handleRetry = (marsaId: string) => {
    const now = nowClientTimestamptz();
    const target = marasi.find((m) => m.id === marsaId);
    if (!target) return;
    const amt = parseFloat(target.periodicAmount);
    const newBalance = parseFloat(target.currentBalance) + amt;
    const targetAmount = parseFloat(target.targetAmount);
    const reaches = newBalance >= targetAmount;

    const newTx: MarsaTransactionVM = {
      id: `mt-${Date.now()}`,
      marsaId,
      type: 'auto_debit',
      amount: amt.toFixed(2),
      scheduledFor: now,
      executedAt: now,
      status: 'succeeded',
      retryCount: target.failedAttempts,
      bankRef: `MOCK-${Date.now()}`,
      failureReason: null,
      note: 'إعادة محاولة يدوية ناجحة.',
      destinationBankId: null,
      destinationAccountId: null,
      attempts: [
        { id: `mt-${Date.now()}-a1`, at: now, status: 'succeeded', message: 'إعادة المحاولة نجحت.' },
      ],
    };
    setTransactions((list) => [newTx, ...list]);
    setMarasi((list) =>
      list.map((m) =>
        m.id === marsaId
          ? {
              ...m,
              currentBalance: newBalance.toFixed(2),
              failedAttempts: 0,
              status: reaches ? 'reached' : m.status,
              reachedAt: reaches ? now : m.reachedAt,
              nextDepositAt: reaches ? null : m.nextDepositAt,
            }
          : m,
      ),
    );
  };

  const handleReleaseConfirm = ({
    marsaId,
    mode,
    destinationBankId,
    destinationAccountId,
  }: {
    marsaId: string;
    mode: ReleaseMode;
    destinationBankId: string;
    destinationAccountId: string;
  }) => {
    const now = nowClientTimestamptz();
    const target = marasi.find((m) => m.id === marsaId);
    if (!target) return;
    const released = parseFloat(target.currentBalance);

    const newTx: MarsaTransactionVM = {
      id: `mt-${Date.now()}`,
      marsaId,
      type: 'release',
      amount: released.toFixed(2),
      scheduledFor: now,
      executedAt: now,
      status: 'succeeded',
      retryCount: 0,
      bankRef: `MOCK-${Date.now()}`,
      failureReason: null,
      note: mode === 'cancel'
        ? 'إنهاء المرسى وتحويل الرصيد المتبقي.'
        : 'تم سحب الرصيد بعد بلوغ الهدف.',
      destinationBankId,
      destinationAccountId,
      attempts: [
        { id: `mt-${Date.now()}-a1`, at: now, status: 'succeeded', message: 'تم تحويل المبلغ.' },
      ],
    };
    setTransactions((list) => [newTx, ...list]);
    setMarasi((list) =>
      list.map((m) =>
        m.id === marsaId
          ? {
              ...m,
              currentBalance: '0.00',
              withdrawn: true,
              withdrawnAt: now,
              releaseBankId: destinationBankId,
              releaseAccountId: destinationAccountId,
              status: mode === 'cancel' ? 'cancelled' : 'reached',
              cancelledAt: mode === 'cancel' ? now : m.cancelledAt,
              nextDepositAt: null,
            }
          : m,
      ),
    );
    setReleaseState(null);
    // Close drill sheet too — the goal moved to a different tab.
    setDrillId(null);
  };

  return (
    <main className="min-h-screen bg-page-bg">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-10 sm:py-14">
        <MarasiHeader onNewMarsa={() => setWizardOpen(true)} />

        <MarasiTabs
          value={tab}
          onChange={setTab}
          activeCount={activeMarasi.length}
          reachedCount={reachedMarasi.length}
          cancelledCount={cancelledMarasi.length}
          activeUrgent={activeUrgent}
        />

        {tab === 'active' && (
          <ActiveView
            marasi={activeMarasi}
            banks={MOCK_BANKS}
            onOpen={setDrillId}
            onNewMarsa={() => setWizardOpen(true)}
          />
        )}

        {tab === 'reached' && (
          <ReachedView marasi={reachedMarasi} banks={MOCK_BANKS} onOpen={setDrillId} />
        )}

        {tab === 'cancelled' && (
          <CancelledView
            marasi={cancelledMarasi}
            banks={MOCK_BANKS}
            onOpen={setDrillId}
          />
        )}
      </div>

      <MarsaWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSubmit={handleCreate}
        banks={MOCK_BANKS}
      />

      <MarsaDrillSheet
        open={drillId !== null}
        onClose={() => setDrillId(null)}
        marsa={drillMarsa}
        transactions={drillTransactions}
        banks={MOCK_BANKS}
        highlightTxId={searchParams.get('tx') ?? undefined}
        onTopUp={(id) => setTopUpId(id)}
        onRetry={handleRetry}
        onCancel={(id) => setReleaseState({ id, mode: 'cancel' })}
        onRelease={(id) => setReleaseState({ id, mode: 'release' })}
      />

      <TopUpModal
        open={topUpId !== null}
        onClose={() => setTopUpId(null)}
        marsa={topUpMarsa}
        banks={MOCK_BANKS}
        onConfirm={handleTopUp}
      />

      <ReleaseModal
        open={releaseState !== null}
        onClose={() => setReleaseState(null)}
        marsa={releaseMarsa}
        banks={MOCK_BANKS}
        mode={releaseState?.mode ?? 'release'}
        onConfirm={handleReleaseConfirm}
      />
    </main>
  );
}
