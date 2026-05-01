import 'server-only';

import { chargeAccount } from '../bank-api';
import { prisma } from '../prisma';
import { computeNextDue } from './scheduling';
import type { DayOfWeekId, ScheduleUnit } from './types';

/**
 * The cron tick. Called from `/api/cron/expenses` every 5 min by pg_cron via
 * pg_net. Returns lightweight stats for telemetry / debugging.
 *
 * Order of operations matters:
 *   1. Materialize newly-due cycles (creates rows in `payment_transactions`).
 *   2. Charge `scheduled` rows whose time has passed (and were created in
 *      step 1 OR earlier ticks).
 *   3. Process retries (`retrying` rows whose last attempt was ≥ 3h ago).
 *   4. Auto-skip stale `awaiting_confirmation` rows (>24h old).
 *
 * Notifications are written inline as state changes — no separate notify step.
 */
export interface CycleStats {
  materialized: number;
  charged: number;
  retried: number;
  autoSkipped: number;
}

export async function runExpenseCycle(): Promise<CycleStats> {
  const materialized = await materializeDueCycles();
  const charged = await chargeDueTransactions();
  const retried = await processRetries();
  const autoSkipped = await autoSkipStaleAwaitings();
  return { materialized, charged, retried, autoSkipped };
}

const RETRY_INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 hours
const AUTO_SKIP_AFTER_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_RETRIES = 3;

// ─── 1. Materialize new cycles ───────────────────────────────
async function materializeDueCycles(): Promise<number> {
  const expenses = await prisma.recurring_expenses.findMany({
    where: { status: 'active' },
    include: {
      payment_transactions: {
        orderBy: { scheduled_for: 'desc' },
        take: 1,
        select: { scheduled_for: true },
      },
    },
  });

  let created = 0;
  const now = new Date();

  for (const exp of expenses) {
    const spec = {
      unit: exp.unit as ScheduleUnit,
      interval: exp.interval,
      day_of_week: exp.day_of_week as DayOfWeekId | null,
      day_of_month: exp.day_of_month,
      time_of_day: exp.time_of_day,
    };

    let lastScheduled = exp.payment_transactions[0]?.scheduled_for ?? null;
    let nextDue = computeNextDue(spec, exp.created_at, lastScheduled);

    while (nextDue <= now) {
      const isVariable = exp.amount_type === 'variable';
      const isManual = exp.payment_mode === 'manual';
      const initialStatus = isVariable || isManual ? 'awaiting_confirmation' : 'scheduled';

      const tx = await prisma.payment_transactions.create({
        data: {
          recurring_expense_id: exp.id,
          user_id: exp.user_id,
          account_id: exp.account_id,
          scheduled_for: nextDue,
          amount: isVariable ? null : exp.amount,
          status: initialStatus,
          retry_count: 0,
        },
      });

      if (isVariable || isManual) {
        await prisma.payment_attempts.create({
          data: {
            transaction_id: tx.id,
            attempt_number: 1,
            status: 'info',
            message: isVariable
              ? 'بدأت الدورة — بانتظار إدخال المبلغ من المستخدم'
              : 'بدأت الدورة — بانتظار موافقة المستخدم',
          },
        });
        await prisma.expense_notifications.create({
          data: {
            user_id: exp.user_id,
            transaction_id: tx.id,
            type: 'awaiting_confirmation',
            channel: 'in_app',
          },
        });
      }

      created++;
      lastScheduled = nextDue;
      nextDue = computeNextDue(spec, exp.created_at, lastScheduled);
    }
  }

  return created;
}

// ─── 2. Charge due `scheduled` transactions ──────────────────
async function chargeDueTransactions(): Promise<number> {
  const txs = await prisma.payment_transactions.findMany({
    where: { status: 'scheduled', scheduled_for: { lte: new Date() } },
    include: {
      recurring_expenses: { select: { title: true } },
      accounts: { include: { banks: { select: { bank_id: true } } } },
    },
  });

  for (const tx of txs) {
    await attemptCharge({
      txId: tx.id,
      userId: tx.user_id,
      retryCount: tx.retry_count,
      amount: tx.amount?.toString() ?? null,
      bankExternalId: tx.accounts.banks.bank_id,
      accountExternalId: tx.accounts.account_id,
      expenseTitle: tx.recurring_expenses.title,
    });
  }
  return txs.length;
}

// ─── 3. Retry due `retrying` transactions ────────────────────
async function processRetries(): Promise<number> {
  const txs = await prisma.payment_transactions.findMany({
    where: { status: 'retrying', retry_count: { lt: MAX_RETRIES } },
    include: {
      payment_attempts: { orderBy: { at: 'desc' }, take: 1, select: { at: true } },
      recurring_expenses: { select: { title: true } },
      accounts: { include: { banks: { select: { bank_id: true } } } },
    },
  });

  const now = Date.now();
  let processed = 0;

  for (const tx of txs) {
    const lastAt = tx.payment_attempts[0]?.at;
    if (!lastAt) continue;
    if (now - lastAt.getTime() < RETRY_INTERVAL_MS) continue;

    await attemptCharge({
      txId: tx.id,
      userId: tx.user_id,
      retryCount: tx.retry_count,
      amount: tx.amount?.toString() ?? null,
      bankExternalId: tx.accounts.banks.bank_id,
      accountExternalId: tx.accounts.account_id,
      expenseTitle: tx.recurring_expenses.title,
    });
    processed++;
  }
  return processed;
}

// ─── 4. Auto-skip stale awaiting_confirmation ────────────────
async function autoSkipStaleAwaitings(): Promise<number> {
  const cutoff = new Date(Date.now() - AUTO_SKIP_AFTER_MS);
  const stale = await prisma.payment_transactions.findMany({
    where: { status: 'awaiting_confirmation', scheduled_for: { lte: cutoff } },
    select: { id: true, user_id: true },
  });

  for (const tx of stale) {
    await prisma.$transaction([
      prisma.payment_transactions.update({
        where: { id: tx.id },
        data: {
          status: 'skipped',
          note: 'تم التخطي تلقائياً — لم يصل تأكيد خلال 24 ساعة',
        },
      }),
      prisma.expense_notifications.create({
        data: {
          user_id: tx.user_id,
          transaction_id: tx.id,
          type: 'auto_skipped',
          channel: 'in_app',
        },
      }),
    ]);
  }
  return stale.length;
}

// ─── Charge attempt (shared by step 2 and step 3) ────────────
interface AttemptInput {
  txId: string;
  userId: string;
  retryCount: number;
  amount: string | null;
  bankExternalId: string;
  accountExternalId: string;
  expenseTitle: string;
}

async function attemptCharge(input: AttemptInput): Promise<void> {
  if (!input.amount) return; // shouldn't happen for scheduled/retrying; bail
  const numericAmount = parseFloat(input.amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return;

  const nextAttemptNumber = input.retryCount + 1;

  try {
    const result = await chargeAccount({
      bankId: input.bankExternalId,
      accountId: input.accountExternalId,
      amount: numericAmount,
      merchant: input.expenseTitle,
      category: 'recurring',
      description: input.expenseTitle,
    });

    await prisma.$transaction([
      prisma.payment_transactions.update({
        where: { id: input.txId },
        data: {
          status: 'succeeded',
          executed_at: new Date(),
          bank_ref: result.bankRef,
          failure_reason: null,
        },
      }),
      prisma.payment_attempts.create({
        data: {
          transaction_id: input.txId,
          attempt_number: nextAttemptNumber,
          status: 'succeeded',
          message: nextAttemptNumber > 1
            ? `إعادة محاولة ${input.retryCount}/${MAX_RETRIES} — تم تفويض الدفع · المرجع ${result.bankRef}`
            : `تم تفويض الدفع · المرجع ${result.bankRef}`,
        },
      }),
      prisma.expense_notifications.create({
        data: {
          user_id: input.userId,
          transaction_id: input.txId,
          type: 'payment_succeeded',
          channel: 'in_app',
        },
      }),
    ]);
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'فشل غير متوقع';
    const newRetryCount = input.retryCount + 1;
    const exhausted = newRetryCount >= MAX_RETRIES;

    if (exhausted) {
      await prisma.$transaction([
        prisma.payment_transactions.update({
          where: { id: input.txId },
          data: {
            status: 'failed',
            retry_count: newRetryCount,
            failure_reason: reason,
          },
        }),
        prisma.payment_attempts.create({
          data: {
            transaction_id: input.txId,
            attempt_number: nextAttemptNumber,
            status: 'failed',
            message: `إعادة محاولة ${newRetryCount}/${MAX_RETRIES} — رفض: ${reason}. تم إرسال إشعار.`,
          },
        }),
        prisma.expense_notifications.create({
          data: {
            user_id: input.userId,
            transaction_id: input.txId,
            type: 'all_retries_exhausted',
            channel: 'in_app',
          },
        }),
      ]);
    } else {
      await prisma.$transaction([
        prisma.payment_transactions.update({
          where: { id: input.txId },
          data: {
            status: 'retrying',
            retry_count: newRetryCount,
            failure_reason: reason,
          },
        }),
        prisma.payment_attempts.create({
          data: {
            transaction_id: input.txId,
            attempt_number: nextAttemptNumber,
            status: 'failed',
            message:
              input.retryCount === 0
                ? `رفض: ${reason}`
                : `إعادة محاولة ${newRetryCount}/${MAX_RETRIES} — رفض: ${reason}`,
          },
        }),
        prisma.expense_notifications.create({
          data: {
            user_id: input.userId,
            transaction_id: input.txId,
            type: 'payment_failed',
            channel: 'in_app',
          },
        }),
      ]);
    }
  }
}
