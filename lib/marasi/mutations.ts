import 'server-only';

import { Prisma } from '@/app/generated/prisma/client';
import { chargeAccount, creditAccount } from '../bank-api';
import { MutationError } from '../api/errors';
import { prisma } from '../prisma';
import { toMarsaTransactionVM, toMarsaVM } from './mappers';
import { cyclesUntilTarget, planFromTarget } from './scheduling';
import type {
  MarsaDraft,
  MarsaFrequency,
  MarsaTransactionVM,
  MarsaVM,
} from './types';
import type { MarsaNotificationVM } from './notifications/types';
import { toMarsaNotificationVM } from './mappers';

const MAX_RETRIES = 3;

// ─── Helpers ─────────────────────────────────────────────────
async function findUserAccount(userId: string, bankId: string, accountId: string) {
  return prisma.accounts.findFirst({
    where: {
      account_id: accountId,
      banks: { bank_id: bankId, user_id: userId },
    },
    include: { banks: true },
  });
}

const decimal = (s: string | number): Prisma.Decimal => new Prisma.Decimal(s);

const includeMarsaForReturn = {
  accounts: { include: { banks: true } },
  accounts_marasi_release_account_idToaccounts: { include: { banks: true } },
} as const;

const includeTxForReturn = {
  accounts: { include: { banks: true } },
  marasi_attempts: { orderBy: { at: 'asc' as const } },
} as const;

// ─── Goal CRUD ───────────────────────────────────────────────
export async function createMarsa(
  userId: string,
  draft: MarsaDraft,
): Promise<MarsaVM> {
  if (!draft.title.trim()) {
    throw new MutationError('invalid_input', 'title is required');
  }
  if (!draft.frequency) {
    throw new MutationError('invalid_input', 'frequency is required');
  }
  if (!draft.targetDate) {
    throw new MutationError('invalid_input', 'targetDate is required');
  }
  const targetAmountNum = parseFloat(draft.targetAmount);
  if (!Number.isFinite(targetAmountNum) || targetAmountNum <= 0) {
    throw new MutationError('invalid_input', 'targetAmount must be > 0');
  }

  const account = await findUserAccount(userId, draft.bankId, draft.accountId);
  if (!account) throw new MutationError('account_not_found');

  const targetDate = new Date(`${draft.targetDate}T00:00:00`);
  if (Number.isNaN(targetDate.getTime())) {
    throw new MutationError('invalid_input', 'invalid targetDate');
  }

  const plan = planFromTarget(targetAmountNum, draft.frequency, targetDate);
  if (!plan) {
    throw new MutationError(
      'invalid_input',
      'targetDate must be at least one cycle in the future',
    );
  }

  const row = await prisma.marasi.create({
    data: {
      user_id: userId,
      account_id: account.id,
      title: draft.title.trim(),
      target_amount: decimal(draft.targetAmount),
      periodic_amount: decimal(plan.periodicAmount),
      frequency: draft.frequency,
      target_date: targetDate,
      current_balance: decimal('0'),
      status: 'active',
      next_deposit_at: plan.firstDepositAt,
    },
    include: includeMarsaForReturn,
  });
  return toMarsaVM(row);
}

// ─── Change funding source ───────────────────────────────────
/**
 * Move an active goal's auto-debits to a different bank account.
 * Pending `scheduled` / `retrying` / `processing` auto-debit rows for this
 * goal get their `account_id` reassigned in the same transaction, so the
 * next cron tick pulls from the new source — no race window.
 *
 * No bank API call here: we're not moving money, just reassigning where
 * future debits will pull from.
 */
export async function changeMarsaSource(
  userId: string,
  marsaId: string,
  opts: { bankId: string; accountId: string },
): Promise<MarsaVM> {
  const marsa = await prisma.marasi.findFirst({
    where: { id: marsaId, user_id: userId },
  });
  if (!marsa) throw new MutationError('not_found');
  if (marsa.status !== 'active') throw new MutationError('goal_terminated');

  const newAccount = await findUserAccount(userId, opts.bankId, opts.accountId);
  if (!newAccount) throw new MutationError('account_not_found');

  // No-op when the user re-picks the same account they had.
  if (newAccount.id !== marsa.account_id) {
    await prisma.$transaction([
      prisma.marasi.update({
        where: { id: marsa.id },
        data: { account_id: newAccount.id },
      }),
      prisma.marasi_transactions.updateMany({
        where: {
          marsa_id: marsa.id,
          status: { in: ['scheduled', 'retrying', 'processing'] },
          type: 'auto_debit',
        },
        data: { account_id: newAccount.id },
      }),
    ]);
  }

  const fresh = await prisma.marasi.findUniqueOrThrow({
    where: { id: marsa.id },
    include: includeMarsaForReturn,
  });
  return toMarsaVM(fresh);
}

// ─── Manual top-up ───────────────────────────────────────────
/**
 * User-initiated push from their bank account into the goal's balance.
 * If the new balance crosses the target, the goal flips to `reached` and any
 * pending auto-debits are cancelled in the same transaction.
 */
export async function topUpMarsa(
  userId: string,
  marsaId: string,
  amount: string,
): Promise<MarsaTransactionVM> {
  const numericAmount = parseFloat(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new MutationError('invalid_input', 'amount must be > 0');
  }

  const marsa = await prisma.marasi.findFirst({
    where: { id: marsaId, user_id: userId },
    include: { accounts: { include: { banks: true } } },
  });
  if (!marsa) throw new MutationError('not_found');
  if (marsa.status !== 'active') throw new MutationError('goal_terminated');

  // Charge the user's funding account.
  let bankRef: string;
  try {
    const result = await chargeAccount({
      bankId: marsa.accounts.banks.bank_id,
      accountId: marsa.accounts.account_id,
      amount: numericAmount,
      merchant: marsa.title,
      category: 'savings',
      description: `إيداع يدوي — ${marsa.title}`,
    });
    bankRef = result.bankRef;
  } catch (err) {
    if (err instanceof Error && err.message === 'insufficient_funds') {
      throw new MutationError('insufficient_funds');
    }
    throw err;
  }

  // Update goal + create tx + log attempt + maybe-flip-status — atomic.
  const newBalance = +(parseFloat(marsa.current_balance.toString()) + numericAmount).toFixed(2);
  const targetAmount = parseFloat(marsa.target_amount.toString());
  const reachesGoal = newBalance >= targetAmount;
  const now = new Date();

  // Re-amortize: spread the new remaining balance across the cycles still left
  // before target_date. After a 500 SAR top-up on a goal that needed 1000 over
  // 4 cycles (250 each), the remaining 500 over 4 cycles becomes 125 each.
  // Skipped when the goal just reached its target (no future cycles).
  let nextPeriodic: string | null = null;
  if (!reachesGoal && marsa.next_deposit_at) {
    const remaining = +(targetAmount - newBalance).toFixed(2);
    const cycles = cyclesUntilTarget(
      marsa.next_deposit_at,
      marsa.target_date,
      marsa.frequency as MarsaFrequency,
    );
    nextPeriodic = (remaining / cycles).toFixed(2);
  }

  const [tx] = await prisma.$transaction([
    prisma.marasi_transactions.create({
      data: {
        marsa_id: marsa.id,
        user_id: userId,
        account_id: marsa.account_id,
        type: 'manual_topup',
        amount: decimal(numericAmount.toFixed(2)),
        scheduled_for: now,
        executed_at: now,
        status: 'succeeded',
        bank_ref: bankRef,
      },
      include: includeTxForReturn,
    }),
    prisma.marasi.update({
      where: { id: marsa.id },
      data: {
        current_balance: decimal(newBalance.toFixed(2)),
        failed_attempts: 0,
        ...(nextPeriodic ? { periodic_amount: decimal(nextPeriodic) } : {}),
        ...(reachesGoal
          ? {
              status: 'reached',
              reached_at: now,
              next_deposit_at: null,
            }
          : {}),
      },
    }),
    // If the goal just reached, cancel any pending auto-debits.
    ...(reachesGoal
      ? [
          prisma.marasi_transactions.updateMany({
            where: {
              marsa_id: marsa.id,
              status: { in: ['scheduled', 'retrying', 'processing'] },
            },
            data: { status: 'cancelled' },
          }),
          prisma.marasi_notifications.create({
            data: {
              user_id: userId,
              marsa_id: marsa.id,
              type: 'goal_reached',
              channel: 'in_app',
            },
          }),
        ]
      : []),
  ]);

  // Log the attempt outside the transaction (it references tx.id which only
  // exists after the create commits — but we have it from the transactional
  // result, so we can write the attempt now).
  await prisma.marasi_attempts.create({
    data: {
      transaction_id: tx.id,
      attempt_number: 1,
      status: 'succeeded',
      message: `تم تفويض الإيداع اليدوي · المرجع ${bankRef}`,
    },
  });

  // Re-read with attempts so the returned VM is complete.
  const fresh = await prisma.marasi_transactions.findUniqueOrThrow({
    where: { id: tx.id },
    include: includeTxForReturn,
  });
  return toMarsaTransactionVM(fresh);
}

// ─── Release / Cancel ────────────────────────────────────────
/**
 * Release the goal's balance to a user-chosen bank account.
 *
 *   mode = 'release' → goal is `reached`, just withdraw funds.
 *   mode = 'cancel'  → goal is `active`, terminate AND withdraw funds.
 *
 * Always pays out the full current balance. Pending auto-debits get cancelled
 * in the same transaction so the cron tick can't race past us.
 */
export async function releaseMarsa(
  userId: string,
  marsaId: string,
  opts: {
    mode: 'release' | 'cancel';
    destinationBankId: string;
    destinationAccountId: string;
  },
): Promise<MarsaVM> {
  const marsa = await prisma.marasi.findFirst({
    where: { id: marsaId, user_id: userId },
  });
  if (!marsa) throw new MutationError('not_found');
  if (marsa.withdrawn) throw new MutationError('goal_already_withdrawn');

  if (opts.mode === 'release' && marsa.status !== 'reached') {
    throw new MutationError(
      'goal_terminated',
      'release is only valid for reached goals — use cancel for active ones',
    );
  }
  if (opts.mode === 'cancel' && marsa.status !== 'active') {
    throw new MutationError('goal_terminated', 'only active goals can be cancelled');
  }

  const destAccount = await findUserAccount(
    userId,
    opts.destinationBankId,
    opts.destinationAccountId,
  );
  if (!destAccount) throw new MutationError('account_not_found');

  const balance = parseFloat(marsa.current_balance.toString());
  const now = new Date();
  let bankRef: string | null = null;

  // If there's anything to move, hit the bank API. If not, skip the transfer
  // (cancel a goal that never accumulated anything still terminates it).
  if (balance > 0) {
    const result = await creditAccount({
      bankId: opts.destinationBankId,
      accountId: opts.destinationAccountId,
      amount: balance,
      merchant: marsa.title,
      category: 'savings',
      description:
        opts.mode === 'cancel'
          ? `إنهاء مدخر — ${marsa.title}`
          : `سحب رصيد مدخر — ${marsa.title}`,
    });
    bankRef = result.bankRef;
  }

  await prisma.$transaction([
    // The release ledger row. Even when balance=0 we record it for audit.
    prisma.marasi_transactions.create({
      data: {
        marsa_id: marsa.id,
        user_id: userId,
        account_id: destAccount.id,
        type: 'release',
        amount: decimal(Math.max(balance, 0.01).toFixed(2)),
        // ^ amount has CHECK (amount > 0). For the rare 0-balance cancel we
        //   record 0.01 as a placeholder; a future migration could relax it.
        scheduled_for: now,
        executed_at: now,
        status: 'succeeded',
        bank_ref: bankRef,
        note:
          opts.mode === 'cancel'
            ? 'إنهاء المدخر وتحويل الرصيد المتبقي.'
            : 'سحب الرصيد بعد بلوغ الهدف.',
      },
    }),
    // Flip the goal.
    prisma.marasi.update({
      where: { id: marsa.id },
      data: {
        current_balance: decimal('0'),
        withdrawn: true,
        withdrawn_at: now,
        release_account_id: destAccount.id,
        next_deposit_at: null,
        ...(opts.mode === 'cancel'
          ? { status: 'cancelled', cancelled_at: now }
          : {}),
      },
    }),
    // Cancel any pending auto-debits.
    prisma.marasi_transactions.updateMany({
      where: {
        marsa_id: marsa.id,
        status: { in: ['scheduled', 'retrying', 'processing'] },
      },
      data: { status: 'cancelled' },
    }),
  ]);

  const fresh = await prisma.marasi.findUniqueOrThrow({
    where: { id: marsa.id },
    include: includeMarsaForReturn,
  });
  return toMarsaVM(fresh);
}

// ─── Retry a failed auto-debit ───────────────────────────────
/**
 * Re-attempt the latest failed/retrying auto-debit on a goal. Useful when the
 * user has fixed the underlying issue (added funds to the source account)
 * and doesn't want to wait for the next cron tick.
 */
export async function retryMarsaAutoDebit(
  userId: string,
  marsaId: string,
): Promise<MarsaTransactionVM> {
  const marsa = await prisma.marasi.findFirst({
    where: { id: marsaId, user_id: userId },
    include: { accounts: { include: { banks: true } } },
  });
  if (!marsa) throw new MutationError('not_found');
  if (marsa.status !== 'active') throw new MutationError('goal_terminated');

  // Find the latest non-terminal auto-debit that has at least one failed attempt.
  const tx = await prisma.marasi_transactions.findFirst({
    where: {
      marsa_id: marsa.id,
      type: 'auto_debit',
      status: { in: ['retrying', 'failed'] },
    },
    orderBy: [{ scheduled_for: 'desc' }, { created_at: 'desc' }],
  });
  if (!tx) throw new MutationError('no_pending_attempt');
  if (!tx.amount) {
    throw new MutationError('invalid_input', 'transaction has no amount to charge');
  }

  const numericAmount = parseFloat(tx.amount.toString());
  const nextAttemptNumber = tx.retry_count + 1;
  const now = new Date();

  try {
    const result = await chargeAccount({
      bankId: marsa.accounts.banks.bank_id,
      accountId: marsa.accounts.account_id,
      amount: numericAmount,
      merchant: marsa.title,
      category: 'savings',
      description: `خصم تلقائي (إعادة محاولة) — ${marsa.title}`,
    });

    const newBalance = +(parseFloat(marsa.current_balance.toString()) + numericAmount).toFixed(2);
    const targetAmount = parseFloat(marsa.target_amount.toString());
    const reachesGoal = newBalance >= targetAmount;

    await prisma.$transaction([
      prisma.marasi_transactions.update({
        where: { id: tx.id },
        data: {
          status: 'succeeded',
          executed_at: now,
          bank_ref: result.bankRef,
          failure_reason: null,
          retry_count: nextAttemptNumber,
        },
      }),
      prisma.marasi_attempts.create({
        data: {
          transaction_id: tx.id,
          attempt_number: nextAttemptNumber,
          status: 'succeeded',
          message: `إعادة محاولة يدوية — تم تفويض الخصم · المرجع ${result.bankRef}`,
        },
      }),
      prisma.marasi.update({
        where: { id: marsa.id },
        data: {
          current_balance: decimal(newBalance.toFixed(2)),
          failed_attempts: 0,
          ...(reachesGoal
            ? { status: 'reached', reached_at: now, next_deposit_at: null }
            : {}),
        },
      }),
      ...(reachesGoal
        ? [
            prisma.marasi_transactions.updateMany({
              where: {
                marsa_id: marsa.id,
                status: { in: ['scheduled', 'retrying', 'processing'] },
                id: { not: tx.id },
              },
              data: { status: 'cancelled' },
            }),
            prisma.marasi_notifications.create({
              data: {
                user_id: userId,
                marsa_id: marsa.id,
                type: 'goal_reached',
                channel: 'in_app',
              },
            }),
          ]
        : []),
    ]);
  } catch (err) {
    // Log the failed attempt; bump retry_count if not yet at the cap.
    const reason = err instanceof Error ? err.message : 'فشل غير متوقع';
    const exhausted = nextAttemptNumber >= MAX_RETRIES;
    await prisma.$transaction([
      prisma.marasi_transactions.update({
        where: { id: tx.id },
        data: {
          status: exhausted ? 'failed' : 'retrying',
          retry_count: nextAttemptNumber,
          failure_reason: reason,
        },
      }),
      prisma.marasi_attempts.create({
        data: {
          transaction_id: tx.id,
          attempt_number: nextAttemptNumber,
          status: 'failed',
          message: `إعادة محاولة يدوية ${nextAttemptNumber}/${MAX_RETRIES} — رفض: ${reason}`,
        },
      }),
      prisma.marasi.update({
        where: { id: marsa.id },
        data: { failed_attempts: nextAttemptNumber },
      }),
      prisma.marasi_notifications.create({
        data: {
          user_id: userId,
          marsa_id: marsa.id,
          transaction_id: tx.id,
          type: exhausted ? 'all_retries_exhausted' : 'deposit_failed',
          channel: 'in_app',
        },
      }),
    ]);
    if (err instanceof Error && err.message === 'insufficient_funds') {
      throw new MutationError('insufficient_funds');
    }
    throw err;
  }

  const fresh = await prisma.marasi_transactions.findUniqueOrThrow({
    where: { id: tx.id },
    include: includeTxForReturn,
  });
  return toMarsaTransactionVM(fresh);
}

// ─── Notifications ───────────────────────────────────────────
export async function markMarsaNotificationRead(
  userId: string,
  notificationId: string,
): Promise<MarsaNotificationVM> {
  const existing = await prisma.marasi_notifications.findFirst({
    where: { id: notificationId, user_id: userId },
  });
  if (!existing) throw new MutationError('not_found');

  await prisma.marasi_notifications.update({
    where: { id: notificationId },
    data: { read_at: existing.read_at ?? new Date() },
  });

  const fresh = await prisma.marasi_notifications.findUniqueOrThrow({
    where: { id: notificationId },
    include: { marasi: true, marasi_transactions: true },
  });
  return toMarsaNotificationVM(fresh);
}

export async function markAllMarsaNotificationsRead(userId: string): Promise<number> {
  const result = await prisma.marasi_notifications.updateMany({
    where: { user_id: userId, read_at: null },
    data: { read_at: new Date() },
  });
  return result.count;
}
