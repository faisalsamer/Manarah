/**
 * View-model types for the Marāsi (savings) module.
 *
 * Mirror the Prisma enums and core fields but live separately so the UI can be
 * developed against mock data without depending on the data layer. When the API
 * is wired up, we'll add a thin mapper from the Prisma rows to these types.
 *
 * NOTE: pause/resume is intentionally NOT modeled here — terminating a goal is
 * done via cancel + release, which always returns the funds to a chosen account.
 */

import type { AccountVM, BankVM } from '@/lib/expenses/types';

// Re-export so marasi consumers can import everything from one place.
export type { AccountVM, BankVM };

// ─── Enums (mirror prisma/schema.prisma) ─────────────────────
export type MarsaFrequency = 'weekly' | 'biweekly' | 'monthly';

/**
 * UI-level status for a Marsa.
 *
 * - `active`    — saving in progress, auto-debits running
 * - `reached`   — current balance hit the target
 * - `cancelled` — terminated by user before reaching the target
 *
 * `withdrawn` is tracked as a separate flag on the Marsa, not a status.
 * `paused` and `archived` exist in the DB enum but are unused for now.
 */
export type MarsaStatus = 'active' | 'reached' | 'cancelled';

export type MarsaTxType = 'auto_debit' | 'manual_topup' | 'release';

export type MarsaTxStatus =
  | 'scheduled'
  | 'processing'
  | 'retrying'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type MarsaAttemptStatus = 'info' | 'succeeded' | 'failed';

// ─── Marsa (the goal itself) ─────────────────────────────────
export interface MarsaVM {
  id: string;
  title: string;
  /** Source bank+account for auto-debits. */
  bankId: string;
  accountId: string;
  /** Target the user is saving toward. */
  targetAmount: string;
  /** Current jar balance — sum of successful inflows minus releases. */
  currentBalance: string;
  /** Per-cycle deposit amount calculated when the goal was created. */
  periodicAmount: string;
  frequency: MarsaFrequency;
  /** YYYY-MM-DD — pure date, no time. */
  targetDate: string;
  status: MarsaStatus;
  /** Whether the jar's funds have been released back to a bank account. */
  withdrawn: boolean;
  /** Count of consecutive failed auto-debits (resets on success or retry). */
  failedAttempts: number;
  /** ISO timestamptz — when the next auto-debit is scheduled. Null when not active. */
  nextDepositAt: string | null;
  /** ISO timestamptz — when the goal was reached. Null until then. */
  reachedAt: string | null;
  /** ISO timestamptz — when the goal was cancelled. Null otherwise. */
  cancelledAt: string | null;
  /** ISO timestamptz — when funds were released back to the user. Null unless `withdrawn`. */
  withdrawnAt: string | null;
  /**
   * Destination bank+account chosen at release time. Null until released.
   * May differ from the source `bankId`/`accountId`.
   */
  releaseBankId: string | null;
  releaseAccountId: string | null;
  createdAt: string;
}

// ─── Marsa transaction (one ledger entry) ────────────────────
export interface MarsaTransactionVM {
  id: string;
  marsaId: string;
  type: MarsaTxType;
  /**
   * Direction relative to the jar:
   * - `auto_debit` and `manual_topup` are inflows (bank → jar).
   * - `release` is an outflow (jar → bank).
   */
  amount: string;
  /** ISO timestamptz with offset, or null if not yet scheduled (unusual). */
  scheduledFor: string | null;
  /** ISO timestamptz with offset, or null if not yet executed. */
  executedAt: string | null;
  status: MarsaTxStatus;
  retryCount: number;
  bankRef: string | null;
  failureReason: string | null;
  note: string | null;
  /**
   * For `release` rows: the destination account chosen by the user (may differ
   * from the goal's source). Null for inflows.
   */
  destinationBankId: string | null;
  destinationAccountId: string | null;
  attempts: MarsaAttemptVM[];
}

// ─── Attempt (sub-log under a transaction) ───────────────────
export interface MarsaAttemptVM {
  id: string;
  /** ISO timestamptz with offset. */
  at: string;
  status: MarsaAttemptStatus;
  message: string;
}

// ─── Wizard form draft ───────────────────────────────────────
/** Mutable form state held by the create-Marsa wizard while the user fills it. */
export interface MarsaDraft {
  title: string;
  bankId: string;
  accountId: string;
  targetAmount: string;
  /** YYYY-MM-DD */
  targetDate: string;
  frequency: MarsaFrequency | '';
}

// ─── Plan computed from the draft ────────────────────────────
/** What "we'll move X every Y for Z cycles" boils down to. */
export interface MarsaPlan {
  /** Per-cycle deposit amount, as a number for display rounding. */
  periodicAmount: number;
  /** Total cycles between today and the target date. */
  cycles: number;
  /** Days between today and target date (>= 1). */
  days: number;
  /** ISO date (YYYY-MM-DD) of the first auto-debit. */
  firstDepositDate: string;
}
