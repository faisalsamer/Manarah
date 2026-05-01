import 'server-only';

import type { MarsaFrequency } from './types';

/**
 * Schedule math for materializing marasi auto-debit cycles.
 *
 * Marasi has a much simpler cadence than expenses: just `weekly | biweekly |
 * monthly`. There is no day-of-week / day-of-month / time-of-day customization
 * — every cycle is `period` after the previous one (or `period` after the
 * goal was created, for the first cycle).
 *
 * Stored times are TIMESTAMPTZ. We use server-local time for the wall-clock
 * baseline — same caveat as the expenses scheduler.
 */

const DAYS_PER_PERIOD: Record<MarsaFrequency, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30, // approximate; monthly recurrences anchor to calendar months below
};

/**
 * Add one cycle of the given frequency to a starting date.
 *   weekly   → +7 days
 *   biweekly → +14 days
 *   monthly  → +1 calendar month (handles short-month rollover safely)
 */
export function addPeriod(from: Date, frequency: MarsaFrequency): Date {
  const c = new Date(from);
  if (frequency === 'monthly') {
    // Set day to 1 first to avoid rollover when month has fewer days.
    const desiredDay = c.getDate();
    c.setDate(1);
    c.setMonth(c.getMonth() + 1);
    const last = new Date(c.getFullYear(), c.getMonth() + 1, 0).getDate();
    c.setDate(Math.min(desiredDay, last));
    return c;
  }
  c.setDate(c.getDate() + DAYS_PER_PERIOD[frequency]);
  return c;
}

/**
 * The first auto-debit on or after `createdAt` for this frequency.
 * Convention: first deposit lands one period after the goal was created.
 * (User explicitly opted in by creating the goal — they don't expect a debit
 *  the same day.)
 */
export function firstCycleAfter(createdAt: Date, frequency: MarsaFrequency): Date {
  return addPeriod(createdAt, frequency);
}

/**
 * Compute the next due `scheduled_for`:
 *   - if the goal already has cycles, advance from the latest one
 *   - otherwise, use the first cycle after `createdAt`
 */
export function computeNextDue(
  createdAt: Date,
  frequency: MarsaFrequency,
  lastScheduled: Date | null,
): Date {
  return lastScheduled
    ? addPeriod(lastScheduled, frequency)
    : firstCycleAfter(createdAt, frequency);
}

/**
 * Per-cycle plan from target + date + frequency. The mutation layer uses this
 * when creating a goal so the frontend's `calcPlan` and the server agree.
 *
 * Returns null when inputs are degenerate (target ≤ 0, date in the past, …).
 */
export interface CyclePlan {
  /** Per-cycle deposit, rounded to 2 decimals (string). */
  periodicAmount: string;
  /** Number of cycles between today and target_date (>= 1). */
  cycles: number;
  /** When the first auto-debit should run. */
  firstDepositAt: Date;
}

/**
 * Count how many auto-debit cycles fit between `nextDepositAt` (inclusive)
 * and `targetDate` (inclusive) for the given frequency.
 *
 * Used by `topUpMarsa` to recalculate `periodic_amount` after a manual
 * deposit shrinks the remaining balance — fewer SAR ÷ same cycles ⇒ smaller
 * future debits. Iterative (vs. dividing days by period) so monthly is
 * calendar-correct, not approximated at 30 days per month.
 */
export function cyclesUntilTarget(
  nextDepositAt: Date,
  targetDate: Date,
  frequency: MarsaFrequency,
): number {
  let count = 0;
  let cursor = new Date(nextDepositAt);
  // Compare on date only — a cycle scheduled for the same calendar day as
  // target_date should still count.
  const end = new Date(targetDate);
  end.setHours(23, 59, 59, 999);
  while (cursor <= end) {
    count++;
    cursor = addPeriod(cursor, frequency);
  }
  return Math.max(1, count);
}

export function planFromTarget(
  targetAmount: number,
  frequency: MarsaFrequency,
  targetDate: Date,
  now: Date = new Date(),
): CyclePlan | null {
  if (!Number.isFinite(targetAmount) || targetAmount <= 0) return null;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const end = new Date(targetDate);
  end.setHours(0, 0, 0, 0);
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const diffDays = Math.ceil((end.getTime() - today.getTime()) / MS_PER_DAY);
  if (diffDays < 1) return null;

  const firstDepositAt = firstCycleAfter(today, frequency);
  // The first cycle must fit before target_date — otherwise the orchestrator
  // never materializes anything (it bails when nextDue > target_date).
  if (firstDepositAt > end) return null;

  const cycles = Math.max(1, Math.ceil(diffDays / DAYS_PER_PERIOD[frequency]));
  const periodicAmount = (targetAmount / cycles).toFixed(2);

  return { periodicAmount, cycles, firstDepositAt };
}
