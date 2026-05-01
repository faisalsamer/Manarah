import {
  dayOfWeekLabels,
  scheduleUnitLabels,
} from './labels';
import type {
  AccountVM,
  BankVM,
  ExpenseVM,
  ScheduleUnit,
  TransactionVM,
} from './types';

// Re-export the project-wide formatters so existing imports keep working.
// New code should import directly from `@/lib/format`.
export { formatAmount, formatDate, formatTime, formatDateTime } from '../format';

// ─── Bank / account lookups ──────────────────────────────────
export const findBank = (banks: BankVM[], id: string | undefined): BankVM | undefined =>
  id ? banks.find((b) => b.id === id) : undefined;

export const findAccount = (
  banks: BankVM[],
  bankId: string | undefined,
  accountId: string | undefined,
): AccountVM | undefined => {
  if (!bankId || !accountId) return undefined;
  return findBank(banks, bankId)?.accounts.find((a) => a.id === accountId);
};

// ─── Schedule label ──────────────────────────────────────────
const unitForm = (unit: ScheduleUnit, n: number): string => {
  const forms = scheduleUnitLabels[unit];
  if (n === 1) return forms.one;
  if (n === 2) return forms.two;
  return forms.many;
};

/**
 * Build an Arabic schedule string, e.g.
 *   "كل شهر يوم 5 الساعة 09:00"
 *   "كل أسبوعين يوم الاثنين الساعة 10:30"
 *   "كل 3 أيام الساعة 08:00"
 */
export const formatSchedule = (e: Pick<ExpenseVM, 'unit' | 'interval' | 'dayOfWeek' | 'dayOfMonth' | 'timeOfDay'>): string => {
  if (!e.unit || !e.timeOfDay) return '';
  const n = Math.max(1, e.interval);
  const everyPrefix = n === 1 ? 'كل' : n === 2 ? 'كل' : `كل ${n}`;
  const unitWord = unitForm(e.unit, n);
  const time = `الساعة ${e.timeOfDay}`;

  if (e.unit === 'day') {
    return `${everyPrefix} ${unitWord} ${time}`;
  }
  if (e.unit === 'week') {
    const dayName = e.dayOfWeek ? dayOfWeekLabels[e.dayOfWeek].full : '';
    return `${everyPrefix} ${unitWord} يوم ${dayName} ${time}`;
  }
  // month
  const dom = e.dayOfMonth ?? 1;
  return `${everyPrefix} ${unitWord} يوم ${dom} ${time}`;
};

// ─── Transaction aggregations ────────────────────────────────
export const totalPaid = (txs: TransactionVM[]): number =>
  txs
    .filter((t) => t.status === 'succeeded' && t.amount)
    .reduce((sum, t) => sum + parseFloat(t.amount as string), 0);

export const successRate = (txs: TransactionVM[]): number => {
  const executed = txs.filter((t) => t.executedAt || t.status === 'failed').length;
  if (executed === 0) return 0;
  const succeeded = txs.filter((t) => t.status === 'succeeded').length;
  return Math.round((succeeded / executed) * 100);
};

export const lastSignificantTransaction = (txs: TransactionVM[]): TransactionVM | undefined => {
  const filtered = txs.filter(
    (t) =>
      t.executedAt ||
      t.status === 'failed' ||
      t.status === 'retrying' ||
      t.status === 'awaiting_confirmation',
  );
  if (filtered.length === 0) return undefined;
  return [...filtered].sort(
    (a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime(),
  )[0];
};

// ─── Misc ────────────────────────────────────────────────────
export const compareByScheduledDesc = (a: TransactionVM, b: TransactionVM): number =>
  new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime();
