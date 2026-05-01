import 'server-only';

import type {
  MarsaAttemptStatus,
  MarsaAttemptVM,
  MarsaFrequency,
  MarsaStatus,
  MarsaTransactionVM,
  MarsaTxStatus,
  MarsaTxType,
  MarsaVM,
} from './types';
import type {
  MarsaNotificationContext,
  MarsaNotificationVM,
} from './notifications/types';

// ─── Helpers ─────────────────────────────────────────────────
const decimalToString = (
  d: { toString(): string } | null | undefined,
): string | null => (d == null ? null : d.toString());

const isoDateOnly = (d: Date): string =>
  // YYYY-MM-DD — safe for `target_date` (DATE column, no TZ semantics).
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ─── Row shapes (loose — declare only what we read) ──────────
interface AttemptRow {
  id: string;
  at: Date;
  status: string;
  message: string;
}

interface TransactionRow {
  id: string;
  marsa_id: string;
  type: string;
  amount: { toString(): string };
  scheduled_for: Date | null;
  executed_at: Date | null;
  status: string;
  retry_count: number;
  bank_ref: string | null;
  failure_reason: string | null;
  note: string | null;
  /** The bank account this row touches — source for inflows, destination for releases. */
  accounts: {
    account_id: string;
    banks: { bank_id: string };
  };
  marasi_attempts?: AttemptRow[];
}

interface MarsaRow {
  id: string;
  title: string;
  target_amount: { toString(): string };
  periodic_amount: { toString(): string };
  current_balance: { toString(): string };
  frequency: string;
  target_date: Date;
  status: string;
  failed_attempts: number;
  next_deposit_at: Date | null;
  reached_at: Date | null;
  cancelled_at: Date | null;
  withdrawn: boolean;
  withdrawn_at: Date | null;
  release_account_id: string | null;
  created_at: Date;
  /** The funding-source relation. */
  accounts: {
    account_id: string;
    banks: { bank_id: string };
  };
  /** The release-destination relation (Prisma's auto-generated alias for the
   *  second FK to `accounts`). Null until released. */
  accounts_marasi_release_account_idToaccounts: {
    account_id: string;
    banks: { bank_id: string };
  } | null;
}

interface NotificationRow {
  id: string;
  type: string;
  channel: string;
  marsa_id: string | null;
  transaction_id: string | null;
  sent_at: Date;
  read_at: Date | null;
  created_at: Date;
  marasi: {
    title: string;
    target_amount: { toString(): string };
    current_balance: { toString(): string };
    frequency: string;
    status: string;
  } | null;
  marasi_transactions: {
    amount: { toString(): string };
    failure_reason: string | null;
  } | null;
}

// ─── Mappers ─────────────────────────────────────────────────
export function toMarsaAttemptVM(row: AttemptRow): MarsaAttemptVM {
  return {
    id: row.id,
    at: row.at.toISOString(),
    status: row.status as MarsaAttemptStatus,
    message: row.message,
  };
}

export function toMarsaTransactionVM(row: TransactionRow): MarsaTransactionVM {
  const isRelease = row.type === 'release';
  return {
    id: row.id,
    marsaId: row.marsa_id,
    type: row.type as MarsaTxType,
    amount: decimalToString(row.amount) ?? '0',
    scheduledFor: row.scheduled_for ? row.scheduled_for.toISOString() : null,
    executedAt: row.executed_at ? row.executed_at.toISOString() : null,
    status: row.status as MarsaTxStatus,
    retryCount: row.retry_count,
    bankRef: row.bank_ref,
    failureReason: row.failure_reason,
    note: row.note,
    // For release rows, `account_id` IS the destination. For inflows it's the
    // source — and the front-end VM exposes destination only, so we leave it
    // null for those.
    destinationBankId: isRelease ? row.accounts.banks.bank_id : null,
    destinationAccountId: isRelease ? row.accounts.account_id : null,
    attempts: (row.marasi_attempts ?? []).map(toMarsaAttemptVM),
  };
}

export function toMarsaVM(row: MarsaRow): MarsaVM {
  const releaseRel = row.accounts_marasi_release_account_idToaccounts;
  return {
    id: row.id,
    title: row.title,
    bankId: row.accounts.banks.bank_id,
    accountId: row.accounts.account_id,
    targetAmount: row.target_amount.toString(),
    currentBalance: row.current_balance.toString(),
    periodicAmount: row.periodic_amount.toString(),
    frequency: row.frequency as MarsaFrequency,
    targetDate: isoDateOnly(row.target_date),
    status: row.status as MarsaStatus,
    withdrawn: row.withdrawn,
    failedAttempts: row.failed_attempts,
    nextDepositAt: row.next_deposit_at ? row.next_deposit_at.toISOString() : null,
    reachedAt: row.reached_at ? row.reached_at.toISOString() : null,
    cancelledAt: row.cancelled_at ? row.cancelled_at.toISOString() : null,
    withdrawnAt: row.withdrawn_at ? row.withdrawn_at.toISOString() : null,
    releaseBankId: releaseRel ? releaseRel.banks.bank_id : null,
    releaseAccountId: releaseRel ? releaseRel.account_id : null,
    createdAt: row.created_at.toISOString(),
  };
}

export function toMarsaNotificationVM(row: NotificationRow): MarsaNotificationVM {
  return {
    id: row.id,
    type: row.type as MarsaNotificationVM['type'],
    channel: row.channel as MarsaNotificationVM['channel'],
    marsaId: row.marsa_id,
    transactionId: row.transaction_id,
    sentAt: row.sent_at.toISOString(),
    readAt: row.read_at ? row.read_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    context: row.marasi ? buildContext(row) : null,
  };
}

function buildContext(row: NotificationRow): MarsaNotificationContext {
  // Caller has already verified `row.marasi` exists.
  const m = row.marasi!;
  const tx = row.marasi_transactions;
  return {
    marsaId: row.marsa_id ?? '',
    marsaTitle: m.title,
    marsaTargetAmount: m.target_amount.toString(),
    marsaCurrentBalance: m.current_balance.toString(),
    marsaFrequency: m.frequency as MarsaFrequency,
    marsaStatus: m.status as MarsaStatus,
    txAmount: tx ? decimalToString(tx.amount) : null,
    txFailureReason: tx ? tx.failure_reason : null,
  };
}
