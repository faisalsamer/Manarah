/**
 * View-model types for the expenses module.
 *
 * These intentionally mirror the Prisma enums and core fields but live separately
 * so the UI can be developed against mock data without depending on the data layer.
 * When the API is wired up, we'll add a thin mapper from the Prisma rows to these types.
 */

// ─── Enums (mirror prisma/schema.prisma) ─────────────────────
export type AmountType = 'fixed' | 'variable';

export type ScheduleUnit = 'day' | 'week' | 'month';

export type DayOfWeekId = 'sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri';

export type PaymentMode = 'auto' | 'manual';

export type ExpenseStatus = 'active' | 'paused' | 'archived';

export type TransactionStatus =
  | 'scheduled'
  | 'awaiting_confirmation'
  | 'processing'
  | 'retrying'
  | 'succeeded'
  | 'failed'
  | 'skipped';

export type AttemptStatus = 'info' | 'succeeded' | 'failed';

// ─── Bank + account view models ──────────────────────────────
export interface AccountVM {
  id: string;
  bankId: string;
  label: string;          // "Savings", "Current", "Business" — replace with Arabic at display time if needed
  accountNumber: string;  // masked, e.g. "•••• 7821"
  balance: string;        // string to preserve decimal precision
  currency: string;       // "SAR"
}

export interface BankVM {
  id: string;
  name: string;
  accounts: AccountVM[];
}

// ─── Recurring expense ───────────────────────────────────────
export interface ExpenseVM {
  id: string;
  title: string;
  description: string | null;
  bankId: string;
  accountId: string;
  amountType: AmountType;
  amount: string | null;       // null for variable
  unit: ScheduleUnit;
  interval: number;
  dayOfWeek: DayOfWeekId | null;
  dayOfMonth: number | null;
  /** "HH:mm" in the user's local timezone — sent through `lib/datetime` when persisted. */
  timeOfDay: string;
  paymentMode: PaymentMode;
  status: ExpenseStatus;
  createdAt: string;
  /**
   * Most recent "significant" transaction for this expense, if any —
   * either executed, or in a failed / retrying / awaiting state. Joined
   * onto the expense by the API so the recurring card can show last-run
   * status without fetching the full transactions list.
   */
  latestTransaction: TransactionVM | null;
}

// ─── Transaction (one cycle) ─────────────────────────────────
export interface TransactionVM {
  id: string;
  expenseId: string;
  /** ISO timestamptz with offset (built via `lib/datetime`). */
  scheduledFor: string;
  /** ISO timestamptz with offset, or null if not yet executed. */
  executedAt: string | null;
  amount: string | null;
  status: TransactionStatus;
  retryCount: number;
  bankRef: string | null;
  failureReason: string | null;
  note: string | null;
  resolvedManually: boolean;
  attempts: AttemptVM[];
}

// ─── Attempt (sub-log of one transaction) ────────────────────
export interface AttemptVM {
  id: string;
  /** ISO timestamptz with offset. */
  at: string;
  status: AttemptStatus;
  message: string;
}

// ─── Wizard form draft ───────────────────────────────────────
/** Mutable form state held by the wizard while the user fills it. */
export interface ExpenseDraft {
  title: string;
  description: string;
  bankId: string;
  accountId: string;
  amountType: AmountType | '';
  amount: string;
  unit: ScheduleUnit | '';
  interval: number;
  dayOfWeek: DayOfWeekId;
  dayOfMonth: number;
  timeOfDay: string;
  paymentMode: PaymentMode;
}
