'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ActiveView } from '@/components/marasi/ActiveView';
import { CancelledView } from '@/components/marasi/CancelledView';
import { ChangeSourceModal } from '@/components/marasi/ChangeSourceModal';
import { MarasiHeader } from '@/components/marasi/MarasiHeader';
import { MarasiTabs, type MarasiTabValue } from '@/components/marasi/MarasiTabs';
import { MarsaDrillSheet } from '@/components/marasi/MarsaDrillSheet';
import { ReachedView } from '@/components/marasi/ReachedView';
import { ReleaseModal, type ReleaseMode } from '@/components/marasi/ReleaseModal';
import { TopUpModal } from '@/components/marasi/TopUpModal';
import { MarsaWizard } from '@/components/marasi/wizard/MarsaWizard';
import { toast } from '@/components/ui/Toast';
import { useLinkedBanks } from '@/hooks/expenses/useLinkedBanks';
import { useMarasi } from '@/hooks/marasi/useMarasi';
import { useMarasiTransactions } from '@/hooks/marasi/useMarasiTransactions';
import { ApiError } from '@/lib/api/client';
import type { MarsaDraft } from '@/lib/marasi/types';

const isTabValue = (v: string | null): v is MarasiTabValue =>
  v === 'active' || v === 'reached' || v === 'cancelled';

export default function MarasiPage() {
  const goalsHook = useMarasi();
  const txsHook = useMarasiTransactions();
  const banksHook = useLinkedBanks();

  const [tab, setTab] = useState<MarasiTabValue>('active');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [drillId, setDrillId] = useState<string | null>(null);
  const [topUpId, setTopUpId] = useState<string | null>(null);
  const [changeSourceId, setChangeSourceId] = useState<string | null>(null);
  const [releaseState, setReleaseState] = useState<{
    id: string;
    mode: ReleaseMode;
  } | null>(null);

  // ── Notification deep-links ────────────────────────────────
  // The bell builds URLs like /marasi?tab=active&marsa=<id>&tx=<id>.
  // Reflect those into local UI state.
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
      const tx = txsHook.data.find((t) => t.id === txParam);
      if (tx) setDrillId(tx.marsaId);
    }
  }, [searchParams, txsHook.data]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ── Derived collections ────────────────────────────────────
  const marasi = goalsHook.data;
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
    ? txsHook.data.filter((t) => t.marsaId === drillId)
    : [];

  const topUpMarsa = topUpId ? marasi.find((m) => m.id === topUpId) : undefined;
  const changeSourceMarsa = changeSourceId
    ? marasi.find((m) => m.id === changeSourceId)
    : undefined;
  const releaseMarsa = releaseState
    ? marasi.find((m) => m.id === releaseState.id)
    : undefined;

  // ── Mutation handlers ──────────────────────────────────────
  // After every write we refetch siblings whose data the write touched:
  //   - createMarsa            → no tx changes, banks unchanged
  //   - topUp / retry          → new tx + balance ⇒ refetch txs + banks
  //   - release (release|cancel) → new release tx + balance reset ⇒ refetch txs + banks
  // The bell handles its own refetch via `useMarasiNotifications`.

  const handleCreate = async (draft: MarsaDraft) => {
    try {
      await goalsHook.create(draft);
      toast.success('تم إنشاء المدخر');
      setWizardOpen(false);
    } catch (err) {
      const message =
        err instanceof ApiError && err.code === 'account_not_found'
          ? 'الحساب غير موجود — اختر حساباً آخر'
          : err instanceof ApiError && err.code === 'invalid_input'
            ? 'البيانات غير مكتملة أو الموعد قريب جداً للتكرار المختار'
            : 'فشل إنشاء المدخر';
      toast.error(message);
      throw err;
    }
  };

  const handleTopUp = async ({
    marsaId,
    amount,
  }: {
    marsaId: string;
    amount: string;
  }) => {
    try {
      await goalsHook.topUp(marsaId, amount);
      await Promise.all([txsHook.refetch(), banksHook.refetch()]);
      toast.success('تم الإيداع بنجاح');
      setTopUpId(null);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'insufficient_funds') {
        toast.error('الرصيد غير كافٍ', 'اختر مبلغاً أصغر أو زوّد حسابك أولاً.');
      } else if (err instanceof ApiError && err.code === 'goal_terminated') {
        toast.error('المدخر مُنهى', 'لا يمكن الإيداع في مدخر متوقف.');
      } else {
        toast.error('فشل الإيداع');
      }
      throw err;
    }
  };

  const handleRetry = async (marsaId: string) => {
    try {
      await goalsHook.retry(marsaId);
      await Promise.all([txsHook.refetch(), banksHook.refetch()]);
      toast.success('نجحت إعادة المحاولة');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'insufficient_funds') {
        toast.error('الرصيد غير كافٍ', 'زوّد الحساب المرتبط ثم أعد المحاولة.');
      } else if (err instanceof ApiError && err.code === 'no_pending_attempt') {
        toast.error('لا توجد محاولة معلّقة');
      } else {
        toast.error('فشلت إعادة المحاولة');
      }
    }
  };

  const handleChangeSource = async ({
    marsaId,
    bankId,
    accountId,
  }: {
    marsaId: string;
    bankId: string;
    accountId: string;
  }) => {
    try {
      await goalsHook.changeSource(marsaId, { bankId, accountId });
      // Pending auto-debit rows have new account_id — refetch txs.
      await txsHook.refetch();
      toast.success('تم تحديث حساب التمويل');
      setChangeSourceId(null);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'account_not_found') {
        toast.error('الحساب الجديد غير موجود');
      } else if (err instanceof ApiError && err.code === 'goal_terminated') {
        toast.error('لا يمكن تغيير الحساب لمدخر مُنهى');
      } else {
        toast.error('فشل تحديث الحساب');
      }
      throw err;
    }
  };

  const handleReleaseConfirm = async ({
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
    try {
      await goalsHook.release(marsaId, {
        mode,
        destinationBankId,
        destinationAccountId,
      });
      await Promise.all([txsHook.refetch(), banksHook.refetch()]);
      toast.success(mode === 'cancel' ? 'تم إنهاء المدخر' : 'تم تحويل الرصيد');
      setReleaseState(null);
      // Close drill sheet too — the goal moved to a different tab.
      setDrillId(null);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'goal_already_withdrawn') {
        toast.error('تم تحويل الرصيد سابقاً');
      } else if (err instanceof ApiError && err.code === 'goal_terminated') {
        toast.error('حالة المدخر لا تسمح بهذا الإجراء');
      } else if (err instanceof ApiError && err.code === 'account_not_found') {
        toast.error('الحساب الوجهة غير موجود');
      } else {
        toast.error(mode === 'cancel' ? 'فشل إنهاء المدخر' : 'فشل تحويل الرصيد');
      }
      throw err;
    }
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
            banks={banksHook.data}
            onOpen={setDrillId}
            onNewMarsa={() => setWizardOpen(true)}
          />
        )}

        {tab === 'reached' && (
          <ReachedView
            marasi={reachedMarasi}
            banks={banksHook.data}
            onOpen={setDrillId}
          />
        )}

        {tab === 'cancelled' && (
          <CancelledView
            marasi={cancelledMarasi}
            banks={banksHook.data}
            onOpen={setDrillId}
          />
        )}
      </div>

      <MarsaWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSubmit={handleCreate}
        banks={banksHook.data}
      />

      <MarsaDrillSheet
        open={drillId !== null}
        onClose={() => setDrillId(null)}
        marsa={drillMarsa}
        transactions={drillTransactions}
        banks={banksHook.data}
        highlightTxId={searchParams.get('tx') ?? undefined}
        onTopUp={(id) => setTopUpId(id)}
        onRetry={handleRetry}
        onCancel={(id) => setReleaseState({ id, mode: 'cancel' })}
        onRelease={(id) => setReleaseState({ id, mode: 'release' })}
        onChangeSource={(id) => setChangeSourceId(id)}
      />

      <TopUpModal
        open={topUpId !== null}
        onClose={() => setTopUpId(null)}
        marsa={topUpMarsa}
        banks={banksHook.data}
        onConfirm={handleTopUp}
      />

      <ChangeSourceModal
        open={changeSourceId !== null}
        onClose={() => setChangeSourceId(null)}
        marsa={changeSourceMarsa}
        banks={banksHook.data}
        onConfirm={handleChangeSource}
      />

      <ReleaseModal
        open={releaseState !== null}
        onClose={() => setReleaseState(null)}
        marsa={releaseMarsa}
        banks={banksHook.data}
        mode={releaseState?.mode ?? 'release'}
        onConfirm={handleReleaseConfirm}
      />
    </main>
  );
}
