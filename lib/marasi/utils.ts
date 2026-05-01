import type {
  MarsaFrequency,
  MarsaPlan,
  MarsaTransactionVM,
  MarsaVM,
} from './types';

// Re-export the bank/account helpers since marasi reuses the same shape.
export { findBank, findAccount } from '@/lib/expenses/utils';

// Re-export project-wide formatters so callers can keep importing from this
// module if they prefer. Source of truth: `lib/format.ts`.
export { formatAmount, formatDate, formatTime, formatDateTime } from '@/lib/format';

// ─── Plan calculation ────────────────────────────────────────
const DAYS_PER_PERIOD: Record<MarsaFrequency, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const toIsoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Compute the per-cycle deposit needed to reach `target - current` between
 * today and `targetDate`, given the chosen `frequency`.
 *
 * Returns `null` when inputs are insufficient or the date is in the past —
 * the wizard relies on this to disable the "next" button.
 */
export const calcPlan = (
  target: number,
  current: number,
  frequency: MarsaFrequency,
  targetDateIso: string,
): MarsaPlan | null => {
  if (!Number.isFinite(target) || !Number.isFinite(current) || !targetDateIso) {
    return null;
  }
  const remaining = Math.max(0, target - current);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(targetDateIso);
  end.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((end.getTime() - today.getTime()) / MS_PER_DAY);
  if (diffDays < 1) return null;

  const periodDays = DAYS_PER_PERIOD[frequency];
  const cycles = Math.max(1, Math.ceil(diffDays / periodDays));
  const periodicAmount = remaining / cycles;
  const firstDeposit = new Date(today.getTime() + periodDays * MS_PER_DAY);

  return {
    periodicAmount,
    cycles,
    days: diffDays,
    firstDepositDate: toIsoDate(firstDeposit),
  };
};

// ─── Marsa derivations ───────────────────────────────────────
export const marsaProgress = (m: Pick<MarsaVM, 'currentBalance' | 'targetAmount'>): number => {
  const current = parseFloat(m.currentBalance);
  const target = parseFloat(m.targetAmount);
  if (!Number.isFinite(target) || target <= 0) return 0;
  return Math.min(100, Math.max(0, (current / target) * 100));
};

export const marsaRemaining = (m: Pick<MarsaVM, 'currentBalance' | 'targetAmount'>): number => {
  const current = parseFloat(m.currentBalance);
  const target = parseFloat(m.targetAmount);
  if (!Number.isFinite(target) || target <= 0) return 0;
  return Math.max(0, target - current);
};

/**
 * Total inflows (auto_debit + manual_topup) that succeeded — used in the
 * drill sheet's "total deposited" stat.
 */
export const totalInflows = (txs: MarsaTransactionVM[]): number =>
  txs
    .filter((t) => t.status === 'succeeded' && (t.type === 'auto_debit' || t.type === 'manual_topup'))
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

export const successfulInflowCount = (txs: MarsaTransactionVM[]): number =>
  txs.filter(
    (t) => t.status === 'succeeded' && (t.type === 'auto_debit' || t.type === 'manual_topup'),
  ).length;

/**
 * Sum of `periodicAmount` across active marasi, normalized to monthly.
 * Weekly × 4.33, biweekly × 2.17, monthly × 1.
 */
export const monthlyCommitment = (marasi: MarsaVM[]): number => {
  const factor: Record<MarsaFrequency, number> = {
    weekly: 4.33,
    biweekly: 2.17,
    monthly: 1,
  };
  return marasi
    .filter((m) => m.status === 'active')
    .reduce((sum, m) => sum + parseFloat(m.periodicAmount) * factor[m.frequency], 0);
};

// ─── Sorting ─────────────────────────────────────────────────
export const compareTxByDateDesc = (a: MarsaTransactionVM, b: MarsaTransactionVM): number => {
  const at = a.executedAt ?? a.scheduledFor ?? '';
  const bt = b.executedAt ?? b.scheduledFor ?? '';
  return new Date(bt).getTime() - new Date(at).getTime();
};
