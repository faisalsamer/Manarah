import 'server-only';

import type { DayOfWeekId, ScheduleUnit } from './types';

/**
 * Schedule math for materializing recurring_expense cycles.
 *
 * The orchestrator calls these to compute the next due `scheduled_for` for
 * each active expense. Stored times are TIMESTAMPTZ (absolute moments) and
 * we use server-local time for the wall-clock target — fine as long as the
 * server runs in roughly the same TZ as the user. Tracking per-user TZ is a
 * follow-up if/when we onboard users outside the server's region.
 */

interface ScheduleSpec {
  unit: ScheduleUnit;
  interval: number;
  day_of_week: DayOfWeekId | null;
  day_of_month: number | null;
  /** Prisma `Time(6)` column — 1970-01-01T<HH:mm:ss>Z. */
  time_of_day: Date;
}

const dowToNum: Record<DayOfWeekId, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

function lastDayOfMonth(year: number, month: number): number {
  // month is 0-indexed; day 0 of next month = last day of this month
  return new Date(year, month + 1, 0).getDate();
}

function applyTime(d: Date, time_of_day: Date): void {
  d.setHours(time_of_day.getUTCHours(), time_of_day.getUTCMinutes(), 0, 0);
}

/**
 * Compute the first cycle date on or after `start` for the given schedule.
 * Used when materializing the very first cycle of a brand-new expense.
 */
export function firstCycleAfter(start: Date, spec: ScheduleSpec): Date {
  const c = new Date(start);
  applyTime(c, spec.time_of_day);

  switch (spec.unit) {
    case 'day':
      if (c < start) c.setDate(c.getDate() + 1);
      return c;

    case 'week': {
      const target = spec.day_of_week ? dowToNum[spec.day_of_week] : c.getDay();
      const diff = (target - c.getDay() + 7) % 7;
      c.setDate(c.getDate() + diff);
      if (c < start) c.setDate(c.getDate() + 7);
      return c;
    }

    case 'month': {
      const desiredDay = spec.day_of_month ?? c.getDate();
      const useDay = Math.min(desiredDay, lastDayOfMonth(c.getFullYear(), c.getMonth()));
      c.setDate(useDay);
      if (c < start) {
        // advance one month and re-clamp to last day if needed
        c.setMonth(c.getMonth() + 1, 1);
        const clamped = Math.min(desiredDay, lastDayOfMonth(c.getFullYear(), c.getMonth()));
        c.setDate(clamped);
      }
      return c;
    }
  }
}

/**
 * Given the previous cycle's `scheduled_for`, compute the next cycle.
 * Handles short-month fallback for monthly schedules (e.g. day 31 in February
 * runs on the last available day of February).
 */
export function advanceSchedule(prevScheduled: Date, spec: ScheduleSpec): Date {
  const interval = Math.max(1, spec.interval);
  const c = new Date(prevScheduled);
  applyTime(c, spec.time_of_day);

  switch (spec.unit) {
    case 'day':
      c.setDate(c.getDate() + interval);
      return c;

    case 'week':
      c.setDate(c.getDate() + 7 * interval);
      return c;

    case 'month': {
      const desiredDay = spec.day_of_month ?? prevScheduled.getDate();
      const targetMonth = c.getMonth() + interval;
      // Set day to 1 first to avoid rollover when month changes.
      c.setDate(1);
      c.setMonth(targetMonth);
      const clamped = Math.min(desiredDay, lastDayOfMonth(c.getFullYear(), c.getMonth()));
      c.setDate(clamped);
      return c;
    }
  }
}

/**
 * Compute the next due `scheduled_for`:
 *   - if the expense already has cycles, advance from the latest one
 *   - otherwise, use the first cycle on or after `created_at`
 */
export function computeNextDue(
  spec: ScheduleSpec,
  createdAt: Date,
  lastScheduled: Date | null,
): Date {
  return lastScheduled
    ? advanceSchedule(lastScheduled, spec)
    : firstCycleAfter(createdAt, spec);
}
