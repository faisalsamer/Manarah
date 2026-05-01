import 'server-only';

import { chargeAccount } from '../bank-api';
import { prisma } from '../prisma';
import { hhmmToDate, toExpenseVM, toTransactionVM } from './mappers';
import type { ExpenseDraft, ExpenseVM, TransactionVM } from './types';
import type { ExpenseNotificationVM } from './notifications/types';
import { toNotificationVM } from './mappers';

// ─── Errors ──────────────────────────────────────────────────
/**
 * Thin error type so route handlers can map known failure modes to
 * 4xx responses without leaking Prisma errors.
 */
export class MutationError extends Error {
  constructor(
    public code:
      | 'not_found'
      | 'invalid_input'
      | 'account_not_found'
      | 'insufficient_funds'
      | 'already_resolved',
    message?: string,
  ) {
    super(message ?? code);
  }
}

// ─── Helpers ─────────────────────────────────────────────────
/** Look up our DB account row from external (bank_id, account_id) for a user. */
async function findUserAccount(userId: string, bankId: string, accountId: string) {
  return prisma.accounts.findFirst({
    where: {
      account_id: accountId,
      banks: { bank_id: bankId, user_id: userId },
    },
    include: { banks: true },
  });
}

// ─── Recurring expense CRUD ──────────────────────────────────
export async function createExpense(
  userId: string,
  draft: ExpenseDraft,
): Promise<ExpenseVM> {
  if (!draft.amountType || !draft.unit) {
    throw new MutationError('invalid_input', 'amountType and unit are required');
  }
  if (!draft.title.trim()) {
    throw new MutationError('invalid_input', 'title is required');
  }

  const account = await findUserAccount(userId, draft.bankId, draft.accountId);
  if (!account) throw new MutationError('account_not_found');

  const row = await prisma.recurring_expenses.create({
    data: {
      user_id: userId,
      account_id: account.id,
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      amount_type: draft.amountType,
      amount: draft.amountType === 'fixed' ? draft.amount : null,
      unit: draft.unit,
      interval: draft.interval,
      day_of_week: draft.unit === 'week' ? draft.dayOfWeek : null,
      day_of_month: draft.unit === 'month' ? draft.dayOfMonth : null,
      time_of_day: hhmmToDate(draft.timeOfDay),
      payment_mode: draft.paymentMode,
      status: 'active',
    },
    include: { accounts: { include: { banks: true } } },
  });
  return toExpenseVM(row);
}

export async function deleteExpense(userId: string, expenseId: string): Promise<void> {
  // Cascade through payment_transactions → payment_attempts + expense_notifications.
  const result = await prisma.recurring_expenses.deleteMany({
    where: { id: expenseId, user_id: userId },
  });
  if (result.count === 0) throw new MutationError('not_found');
}

// ─── Transaction actions ─────────────────────────────────────
export async function skipTransaction(
  userId: string,
  txId: string,
  note = 'تم التخطي يدوياً',
): Promise<TransactionVM> {
  const tx = await prisma.payment_transactions.findFirst({
    where: { id: txId, user_id: userId },
  });
  if (!tx) throw new MutationError('not_found');
  if (tx.status === 'succeeded' || tx.status === 'skipped') {
    throw new MutationError('already_resolved');
  }

  const updated = await prisma.payment_transactions.update({
    where: { id: txId },
    data: { status: 'skipped', note },
    include: { payment_attempts: { orderBy: { at: 'asc' } } },
  });
  return toTransactionVM(updated);
}

/**
 * Approve / debit an awaiting_confirmation transaction.
 * - Variable amount: caller passes the new amount.
 * - Manual mode (fixed amount): caller passes the existing amount.
 */
export async function confirmTransaction(
  userId: string,
  txId: string,
  amount: string,
): Promise<TransactionVM> {
  const numericAmount = parseFloat(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new MutationError('invalid_input', 'amount must be > 0');
  }

  const tx = await prisma.payment_transactions.findFirst({
    where: { id: txId, user_id: userId },
    include: {
      recurring_expenses: true,
      accounts: { include: { banks: true } },
    },
  });
  if (!tx) throw new MutationError('not_found');
  if (tx.status === 'succeeded' || tx.status === 'skipped') {
    throw new MutationError('already_resolved');
  }

  const nextAttemptNumber = tx.retry_count + 1;

  try {
    const result = await chargeAccount({
      bankId: tx.accounts.banks.bank_id,
      accountId: tx.accounts.account_id,
      amount: numericAmount,
      merchant: tx.recurring_expenses.title,
      category: 'recurring',
      description: tx.recurring_expenses.title,
    });

    const [updated] = await prisma.$transaction([
      prisma.payment_transactions.update({
        where: { id: txId },
        data: {
          status: 'succeeded',
          executed_at: new Date(),
          amount,
          bank_ref: result.bankRef,
        },
        include: { payment_attempts: { orderBy: { at: 'asc' } } },
      }),
      prisma.payment_attempts.create({
        data: {
          transaction_id: txId,
          attempt_number: nextAttemptNumber,
          status: 'succeeded',
          message: `تم تفويض الدفع · المرجع ${result.bankRef}`,
        },
      }),
    ]);
    return toTransactionVM(updated);
  } catch (err) {
    // Log a failed attempt so the retry/audit trail is complete.
    const message =
      err instanceof Error ? err.message : 'فشل غير متوقع أثناء الخصم';
    await prisma.payment_attempts.create({
      data: {
        transaction_id: txId,
        attempt_number: nextAttemptNumber,
        status: 'failed',
        message: `فشل الخصم: ${message}`,
      },
    });
    if (err instanceof Error && err.message === 'insufficient_funds') {
      throw new MutationError('insufficient_funds');
    }
    throw err;
  }
}

/**
 * Resolve a failed transaction by charging via a different bank+account.
 * Optionally re-link the expense to the chosen account so future cycles
 * pull from there.
 */
export async function resolveTransaction(
  userId: string,
  txId: string,
  opts: { bankId: string; accountId: string; updateLinked: boolean },
): Promise<TransactionVM> {
  const tx = await prisma.payment_transactions.findFirst({
    where: { id: txId, user_id: userId },
    include: { recurring_expenses: true },
  });
  if (!tx) throw new MutationError('not_found');
  if (tx.status === 'succeeded' || tx.status === 'skipped') {
    throw new MutationError('already_resolved');
  }
  if (!tx.amount) {
    throw new MutationError('invalid_input', 'transaction has no amount to charge');
  }

  const newAccount = await findUserAccount(userId, opts.bankId, opts.accountId);
  if (!newAccount) throw new MutationError('account_not_found');

  const numericAmount = parseFloat(tx.amount.toString());
  const nextAttemptNumber = tx.retry_count + 1;

  try {
    const result = await chargeAccount({
      bankId: opts.bankId,
      accountId: opts.accountId,
      amount: numericAmount,
      merchant: tx.recurring_expenses.title,
      category: 'recurring',
      description: tx.recurring_expenses.title,
    });

    const updates: Promise<unknown>[] = [
      prisma.payment_transactions.update({
        where: { id: txId },
        data: {
          status: 'succeeded',
          executed_at: new Date(),
          account_id: newAccount.id,
          bank_ref: result.bankRef,
          resolved_manually: true,
        },
      }),
      prisma.payment_attempts.create({
        data: {
          transaction_id: txId,
          attempt_number: nextAttemptNumber,
          status: 'succeeded',
          message: `تم تسوية الدفع يدوياً · المرجع ${result.bankRef}`,
        },
      }),
    ];

    if (opts.updateLinked) {
      updates.push(
        prisma.recurring_expenses.update({
          where: { id: tx.recurring_expense_id },
          data: { account_id: newAccount.id },
        }),
      );
    }

    await Promise.all(updates);

    const fresh = await prisma.payment_transactions.findUniqueOrThrow({
      where: { id: txId },
      include: { payment_attempts: { orderBy: { at: 'asc' } } },
    });
    return toTransactionVM(fresh);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'فشل غير متوقع أثناء الخصم';
    await prisma.payment_attempts.create({
      data: {
        transaction_id: txId,
        attempt_number: nextAttemptNumber,
        status: 'failed',
        message: `فشل الخصم: ${message}`,
      },
    });
    if (err instanceof Error && err.message === 'insufficient_funds') {
      throw new MutationError('insufficient_funds');
    }
    throw err;
  }
}

// ─── Notifications ───────────────────────────────────────────
export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<ExpenseNotificationVM> {
  const existing = await prisma.expense_notifications.findFirst({
    where: { id: notificationId, user_id: userId },
  });
  if (!existing) throw new MutationError('not_found');

  const updated = await prisma.expense_notifications.update({
    where: { id: notificationId },
    data: { read_at: existing.read_at ?? new Date() },
  });
  return toNotificationVM(updated);
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const result = await prisma.expense_notifications.updateMany({
    where: { user_id: userId, read_at: null },
    data: { read_at: new Date() },
  });
  return result.count;
}
