// ─────────────────────────────────────────────────────────────
// DATE UTILITIES — Saudi Arabia timezone (Asia/Riyadh)
// UTC+3, no DST
// All zakat calculations use Riyadh local date, not UTC
// ─────────────────────────────────────────────────────────────

import { SAUDI_TIMEZONE, HIJRI_YEAR_DAYS } from '../lib/zakat/constants'

/**
 * Get today's date as YYYY-MM-DD string in Riyadh timezone
 */
export function toRiyadhDateString(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: SAUDI_TIMEZONE })
  // en-CA gives YYYY-MM-DD format
}

/**
 * Convert any date to Riyadh local midnight (start of day)
 */
export function toRiyadhMidnight(dateStr: string): Date {
  // Parse YYYY-MM-DD as Riyadh midnight
  const [year, month, day] = dateStr.split('-').map(Number)
  // Create UTC time that corresponds to Riyadh midnight (UTC+3 = minus 3 hours from UTC)
  return new Date(Date.UTC(year, month - 1, day, 21, 0, 0)) // 21:00 UTC = 00:00 Riyadh
}

/**
 * Add N days to a YYYY-MM-DD string, returns YYYY-MM-DD
 */
export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00Z')
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/**
 * Difference in days between two YYYY-MM-DD strings
 */
export function daysBetween(startStr: string, endStr: string): number {
  const start = new Date(startStr + 'T00:00:00Z')
  const end = new Date(endStr + 'T00:00:00Z')
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Get array of all dates between start and end (inclusive)
 * Returns YYYY-MM-DD strings
 */
export function getDateRange(startStr: string, endStr: string): string[] {
  const dates: string[] = []
  let current = startStr

  while (current <= endStr) {
    dates.push(current)
    current = addDays(current, 1)
  }

  return dates
}

/**
 * Calculate expected hawl end date
 * Hijri year = 354 days from start
 */
export function getHawlEndDate(startStr: string): string {
  return addDays(startStr, HIJRI_YEAR_DAYS)
}

/**
 * Get days passed and remaining for a hawl
 */
export function getHawlProgress(startStr: string): {
  daysPassed: number
  daysRemaining: number
  isComplete: boolean
} {
  const today = toRiyadhDateString()
  const daysPassed = daysBetween(startStr, today)
  const daysRemaining = Math.max(0, HIJRI_YEAR_DAYS - daysPassed)
  return {
    daysPassed,
    daysRemaining,
    isComplete: daysPassed >= HIJRI_YEAR_DAYS,
  }
}

/**
 * Format a date string for Arabic display
 */
export function formatArabicDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00Z')
  return date.toLocaleDateString('ar-SA', {
    timeZone: SAUDI_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Check if a date string is in the past (Riyadh timezone)
 */
export function isDateInPast(dateStr: string): boolean {
  const today = toRiyadhDateString()
  return dateStr < today
}

/**
 * Check if a date string is today (Riyadh timezone)
 */
export function isToday(dateStr: string): boolean {
  return dateStr === toRiyadhDateString()
}