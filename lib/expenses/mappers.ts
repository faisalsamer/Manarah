import 'server-only';

import type {
  AccountVM,
  AttemptVM,
  BankVM,
  ExpenseVM,
  TransactionVM,
} from './types';
import type {
  ExpenseNotificationContext,
  ExpenseNotificationVM,
} from './notifications/types';
import type { AmountType, PaymentMode } from './types';

// ─── Time helpers ────────────────────────────────────────────
/**
 * Prisma `Time(6)` columns come back as Date objects encoding the time on
 * 1970-01-01 in UTC. Pull HH:mm out via the UTC accessors.
 */
const dateToHHmm = (d: Date): string => {
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

/** Inverse: build a Date that Prisma will store correctly into a Time(6). */
export const hhmmToDate = (hhmm: string): Date =>
  new Date(`1970-01-01T${hhmm}:00Z`);

// ─── Decimal / nullable helpers ──────────────────────────────
const decimalToString = (
  d: { toString(): string } | null | undefined,
): string | null => (d == null ? null : d.toString());

// ─── Row shapes (loose — we only declare what we read) ───────
interface AttemptRow {
  id: string;
  at: Date;
  status: string;
  message: string;
}

interface TransactionRow {
  id: string;
  recurring_expense_id: string;
  scheduled_for: Date;
  executed_at: Date | null;
  amount: { toString(): string } | null;
  status: string;
  retry_count: number;
  bank_ref: string | null;
  failure_reason: string | null;
  note: string | null;
  resolved_manually: boolean;
  payment_attempts?: AttemptRow[];
}

interface ExpenseRow {
  id: string;
  title: string;
  description: string | null;
  amount_type: string;
  amount: { toString(): string } | null;
  unit: string;
  interval: number;
  day_of_week: string | null;
  day_of_month: number | null;
  time_of_day: Date;
  payment_mode: string;
  status: string;
  created_at: Date;
  accounts: {
    account_id: string;
    banks: { bank_id: string };
  };
  /** Optional include — at most one row, the latest "significant" transaction. */
  payment_transactions?: TransactionRow[];
}

interface AccountRow {
  account_id: string;
  account_number: string;
  account_name: string | null;
  iban: string | null;
  account_type: string;
  is_primary: boolean;
  currency: string;
}

interface BankRow {
  bank_id: string;
  bank_name: string;
  bank_name_ar: string | null;
  accounts: AccountRow[];
}

interface NotificationRow {
  id: string;
  type: string;
  channel: string;
  transaction_id: string | null;
  sent_at: Date;
  read_at: Date | null;
  created_at: Date;
  payment_transactions?: {
    recurring_expense_id: string;
    amount: { toString(): string } | null;
    scheduled_for: Date;
    failure_reason: string | null;
    recurring_expenses: {
      title: string;
      amount_type: string;
      payment_mode: string;
    };
  } | null;
}

// ─── Mappers ─────────────────────────────────────────────────
export function toAttemptVM(row: AttemptRow): AttemptVM {
  return {
    id: row.id,
    at: row.at.toISOString(),
    status: row.status as AttemptVM['status'],
    message: row.message,
  };
}

export function toTransactionVM(row: TransactionRow): TransactionVM {
  return {
    id: row.id,
    expenseId: row.recurring_expense_id,
    scheduledFor: row.scheduled_for.toISOString(),
    executedAt: row.executed_at ? row.executed_at.toISOString() : null,
    amount: decimalToString(row.amount),
    status: row.status as TransactionVM['status'],
    retryCount: row.retry_count,
    bankRef: row.bank_ref,
    failureReason: row.failure_reason,
    note: row.note,
    resolvedManually: row.resolved_manually,
    attempts: (row.payment_attempts ?? []).map(toAttemptVM),
  };
}

export function toExpenseVM(row: ExpenseRow): ExpenseVM {
  const latest = row.payment_transactions?.[0];
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    bankId: row.accounts.banks.bank_id,
    accountId: row.accounts.account_id,
    amountType: row.amount_type as ExpenseVM['amountType'],
    amount: decimalToString(row.amount),
    unit: row.unit as ExpenseVM['unit'],
    interval: row.interval,
    dayOfWeek: row.day_of_week as ExpenseVM['dayOfWeek'],
    dayOfMonth: row.day_of_month,
    timeOfDay: dateToHHmm(row.time_of_day),
    paymentMode: row.payment_mode as ExpenseVM['paymentMode'],
    status: row.status as ExpenseVM['status'],
    createdAt: row.created_at.toISOString(),
    latestTransaction: latest ? toTransactionVM(latest) : null,
  };
}

export function toAccountVM(
  row: AccountRow,
  bankId: string,
  liveBalance: number | null,
): AccountVM {
  return {
    id: row.account_id,
    bankId,
    label: row.account_name ?? row.account_type,
    accountNumber: row.account_number,
    balance: liveBalance != null ? String(liveBalance) : '0',
    currency: row.currency,
  };
}

/**
 * Build a BankVM with live balances.
 * `balanceByAccountId` is a map of external `account_id` → live balance from
 * the bank API. Accounts without a live balance fall back to "0" (and the
 * front end can render a stale state if we ever surface that).
 */
export function toBankVM(
  row: BankRow,
  balanceByAccountId: Map<string, number>,
): BankVM {
  return {
    id: row.bank_id,
    name: row.bank_name_ar ?? row.bank_name,
    accounts: row.accounts.map((a) =>
      toAccountVM(a, row.bank_id, balanceByAccountId.get(a.account_id) ?? null),
    ),
  };
}

export function toNotificationVM(row: NotificationRow): ExpenseNotificationVM {
  const tx = row.payment_transactions ?? null;
  return {
    id: row.id,
    type: row.type as ExpenseNotificationVM['type'],
    channel: row.channel as ExpenseNotificationVM['channel'],
    transactionId: row.transaction_id,
    sentAt: row.sent_at.toISOString(),
    readAt: row.read_at ? row.read_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    context: tx ? buildContext(tx) : null,
  };
}

function buildContext(tx: NonNullable<NotificationRow['payment_transactions']>): ExpenseNotificationContext {
  return {
    expenseId: tx.recurring_expense_id,
    expenseTitle: tx.recurring_expenses.title,
    expenseAmountType: tx.recurring_expenses.amount_type as AmountType,
    expensePaymentMode: tx.recurring_expenses.payment_mode as PaymentMode,
    txAmount: decimalToString(tx.amount),
    txScheduledFor: tx.scheduled_for.toISOString(),
    txFailureReason: tx.failure_reason,
  };
}
