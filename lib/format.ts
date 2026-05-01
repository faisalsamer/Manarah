/**
 * Project-wide display formatters.
 *
 * - Currency / amounts: Latin digits, two decimals.
 * - Dates / times: Arabic locale, Latin digits, **viewer's local timezone**
 *   (no `timeZone` option) — so a user traveling sees their times in their
 *   current location's clock, not their home country's. This is intentional:
 *   display tracks the viewer.
 *
 * Never call `toLocaleString` / `toLocaleDateString` / `toLocaleTimeString`
 * directly in components — go through these helpers.
 */

const dateFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const timeFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const dateTimeFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const amountFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "1234.5" or 1234.5 → "1,234.50". Returns "0.00" for null/undefined/empty. */
export function formatAmount(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '0.00';
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return '0.00';
  return amountFmt.format(n);
}

/** ISO timestamptz → e.g. "15 May 2026" in viewer's local TZ. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return dateFmt.format(d);
}

/** ISO timestamptz → e.g. "09:00" (24h) in viewer's local TZ. */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return timeFmt.format(d);
}

/** ISO timestamptz → e.g. "15 May 2026, 09:00" in viewer's local TZ. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return dateTimeFmt.format(d);
}
