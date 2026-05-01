import 'server-only';

import { Prisma } from '@/app/generated/prisma/client';
import { chargeAccount } from '../bank-api';
import { prisma } from '../prisma';
import { computeNextDue } from './scheduling';
import type { MarsaFrequency } from './types';

/**
 * The marasi cron tick. Called from `/api/cron/marasi` every 10 min by pg_cron
 * via pg_net. Returns lightweight stats for telemetry / debugging.
 *
 * Pipeline (simpler than expenses — no awaiting_confirmation / auto-skip):
 *   1. Materialize newly-due cycles for active goals (creates `scheduled` rows
 *      in `marasi_transactions` and updates `next_deposit_at`).
 *   2. Charge `scheduled` rows whose time has passed.
 *   3. Process retries (`retrying` rows whose last attempt was ≥ 3h ago).
 *
 * On every successful charge: bump the goal's `current_balance`. If the new
 * balance ≥ `target_amount`, flip status to `reached` AND cancel any other
 * pending tx rows for this goal in the same `$transaction` (prevents the next
 * cron tick from charging on a reached goal).
 */
export interface MarasiCycleStats {
  materialized: number;
  charged: number;
  retried: number;
}

export async function runMarasiCycle(): Promise<MarasiCycleStats> {
  const materialized = await materializeDueCycles();
  const charged = await chargeDueTransactions();
  const retried = await processRetries();
  return { materialized, charged, retried };
}

const RETRY_INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 hours
const MAX_RETRIES = 3;

const decimal = (s: string | number): Prisma.Decimal => new Prisma.Decimal(s);

// ─── 1. Materialize new cycles ───────────────────────────────
async function materializeDueCycles(): Promise<number> {
  const goals = await prisma.marasi.findMany({
    where: { status: 'active' },
    include: {
      marasi_transactions: {
        where: { type: 'auto_debit' },
        orderBy: { scheduled_for: 'desc' },
        take: 1,
        select: { scheduled_for: true },
      },
    },
  });

  let created = 0;
  const now = new Date();

  for (const goal of goals) {
    let lastScheduled = goal.marasi_transactions[0]?.scheduled_for ?? null;
    let nextDue = computeNextDue(
      goal.created_at,
      goal.frequency as MarsaFrequency,
      lastScheduled,
    );

    while (nextDue <= now) {
      // Don't materialize past target_date — the user gets notified to extend.
      if (nextDue > goal.target_date) break;

      await prisma.marasi_transactions.create({
        data: {
          marsa_id: goal.id,
          user_id: goal.user_id,
          account_id: goal.account_id,
          type: 'auto_debit',
          amount: goal.periodic_amount,
          scheduled_for: nextDue,
          status: 'scheduled',
        },
      });

      created++;
      lastScheduled = nextDue;
      nextDue = computeNextDue(
        goal.created_at,
        goal.frequency as MarsaFrequency,
        lastScheduled,
      );
    }

    // Update next_deposit_at to the next not-yet-materialized cycle (or null
    // if we've passed the target_date).
    const nextOnGoal = nextDue > goal.target_date ? null : nextDue;
    if ((goal.next_deposit_at?.getTime() ?? null) !== (nextOnGoal?.getTime() ?? null)) {
      await prisma.marasi.update({
        where: { id: goal.id },
        data: { next_deposit_at: nextOnGoal },
      });
    }
  }

  return created;
}

// ─── 2. Charge due `scheduled` transactions ──────────────────
async function chargeDueTransactions(): Promise<number> {
  const txs = await prisma.marasi_transactions.findMany({
    where: {
      status: 'scheduled',
      scheduled_for: { lte: new Date() },
      // Only charge for still-active goals — defensive against status-flip
      // races between the mutation layer and this cron tick.
      marasi: { status: 'active' },
    },
    include: {
      marasi: true,
      accounts: { include: { banks: { select: { bank_id: true } } } },
    },
  });

  for (const tx of txs) {
    await attemptCharge({
      txId: tx.id,
      goalId: tx.marasi.id,
      userId: tx.user_id,
      retryCount: tx.retry_count,
      amount: tx.amount.toString(),
      bankExternalId: tx.accounts.banks.bank_id,
      accountExternalId: tx.accounts.account_id,
      goalTitle: tx.marasi.title,
      goalCurrentBalance: tx.marasi.current_balance.toString(),
      goalTargetAmount: tx.marasi.target_amount.toString(),
    });
  }
  return txs.length;
}

// ─── 3. Retry due `retrying` transactions ────────────────────
async function processRetries(): Promise<number> {
  const txs = await prisma.marasi_transactions.findMany({
    where: {
      status: 'retrying',
      retry_count: { lt: MAX_RETRIES },
      marasi: { status: 'active' },
    },
    include: {
      marasi: true,
      accounts: { include: { banks: { select: { bank_id: true } } } },
      marasi_attempts: { orderBy: { at: 'desc' }, take: 1, select: { at: true } },
    },
  });

  const now = Date.now();
  let processed = 0;

  for (const tx of txs) {
    const lastAt = tx.marasi_attempts[0]?.at;
    if (!lastAt) continue;
    if (now - lastAt.getTime() < RETRY_INTERVAL_MS) continue;

    await attemptCharge({
      txId: tx.id,
      goalId: tx.marasi.id,
      userId: tx.user_id,
      retryCount: tx.retry_count,
      amount: tx.amount.toString(),
      bankExternalId: tx.accounts.banks.bank_id,
      accountExternalId: tx.accounts.account_id,
      goalTitle: tx.marasi.title,
      goalCurrentBalance: tx.marasi.current_balance.toString(),
      goalTargetAmount: tx.marasi.target_amount.toString(),
    });
    processed++;
  }
  return processed;
}

// ─── Charge attempt (shared by step 2 and step 3) ────────────
interface AttemptInput {
  txId: string;
  goalId: string;
  userId: string;
  retryCount: number;
  amount: string;
  bankExternalId: string;
  accountExternalId: string;
  goalTitle: string;
  goalCurrentBalance: string;
  goalTargetAmount: string;
}

async function attemptCharge(input: AttemptInput): Promise<void> {
  const numericAmount = parseFloat(input.amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return;

  const nextAttemptNumber = input.retryCount + 1;
  const now = new Date();

  try {
    const result = await chargeAccount({
      bankId: input.bankExternalId,
      accountId: input.accountExternalId,
      amount: numericAmount,
      merchant: input.goalTitle,
      category: 'savings',
      description: `خصم تلقائي — ${input.goalTitle}`,
    });

    const newBalance = +(parseFloat(input.goalCurrentBalance) + numericAmount).toFixed(2);
    const targetAmount = parseFloat(input.goalTargetAmount);
    const reachesGoal = newBalance >= targetAmount;

    await prisma.$transaction([
      prisma.marasi_transactions.update({
        where: { id: input.txId },
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
          transaction_id: input.txId,
          attempt_number: nextAttemptNumber,
          status: 'succeeded',
          message:
            nextAttemptNumber > 1
              ? `إعادة محاولة ${input.retryCount}/${MAX_RETRIES} — تم تفويض الخصم · المرجع ${result.bankRef}`
              : `تم تفويض الخصم · المرجع ${result.bankRef}`,
        },
      }),
      prisma.marasi.update({
        where: { id: input.goalId },
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
            // Defensive: cancel any other pending rows for this goal so
            // the next cron tick can't double-charge a reached goal.
            prisma.marasi_transactions.updateMany({
              where: {
                marsa_id: input.goalId,
                id: { not: input.txId },
                status: { in: ['scheduled', 'retrying', 'processing'] },
              },
              data: { status: 'cancelled' },
            }),
            prisma.marasi_notifications.create({
              data: {
                user_id: input.userId,
                marsa_id: input.goalId,
                transaction_id: input.txId,
                type: 'goal_reached',
                channel: 'in_app',
              },
            }),
          ]
        : []),
    ]);
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'فشل غير متوقع';
    const newRetryCount = nextAttemptNumber;
    const exhausted = newRetryCount >= MAX_RETRIES;

    await prisma.$transaction([
      prisma.marasi_transactions.update({
        where: { id: input.txId },
        data: {
          status: exhausted ? 'failed' : 'retrying',
          retry_count: newRetryCount,
          failure_reason: reason,
        },
      }),
      prisma.marasi_attempts.create({
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
      prisma.marasi.update({
        where: { id: input.goalId },
        data: { failed_attempts: newRetryCount },
      }),
      prisma.marasi_notifications.create({
        data: {
          user_id: input.userId,
          marsa_id: input.goalId,
          transaction_id: input.txId,
          type: exhausted ? 'all_retries_exhausted' : 'deposit_failed',
          channel: 'in_app',
        },
      }),
    ]);
  }
}
