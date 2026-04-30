/**
 * Centralized timestamp helpers.
 *
 * Convention: when sending a timestamp to the API/DB, we send an ISO string
 * that includes the user's local timezone offset (e.g. `2026-05-15T14:30:00+03:00`).
 * Postgres `timestamptz` then stores the absolute moment correctly while preserving
 * the user's intent. NEVER inline `toISOString()` (which forces UTC) or `toLocaleString`
 * — always go through these helpers.
 */

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

/**
 * Format a Date as an ISO-8601 string carrying the local timezone offset.
 * Example output: `2026-05-15T14:30:00+03:00`.
 */
export function toClientTimestamptz(date: Date): string {
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const absMin = Math.abs(offsetMin);
  const offHours = pad(Math.floor(absMin / 60));
  const offMins = pad(absMin % 60);

  return (
    `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${offHours}:${offMins}`
  );
}

/** Current moment as a client-timezone-anchored timestamptz string. */
export function nowClientTimestamptz(): string {
  return toClientTimestamptz(new Date());
}

/**
 * Build a timestamptz from explicit calendar parts in the user's local timezone.
 * Used by the schedule wizard when the user picks "5th of the month at 09:00".
 */
export function makeClientTimestamptz(parts: {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
}): string {
  const { year, month, day, hour = 0, minute = 0, second = 0 } = parts;
  return toClientTimestamptz(new Date(year, month - 1, day, hour, minute, second));
}

/** The user's local IANA timezone (best-effort), e.g. `Asia/Riyadh`. */
export function clientTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
