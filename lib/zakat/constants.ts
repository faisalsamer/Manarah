// ─────────────────────────────────────────────────────────────
// ZAKAT CONSTANTS
// All values fixed — do not change
// ─────────────────────────────────────────────────────────────

export const NISAB = {
  SILVER_GRAMS: 595,  // 595 grams of silver (21 tolas / 52.5 tolas)
  GOLD_GRAMS: 85,     // 85 grams of gold (7.5 tolas)
} as const

// 2.5% = 1/40 — fixed rate for zakah al-mal
export const ZAKAT_RATE = 0.025

// Hijri lunar year = 354 days, 8 hours, 48 minutes
// We use 354 days as the safe minimum threshold
export const HIJRI_YEAR_DAYS = 354

// Default standard — silver is preferred by majority of scholars
// because it produces a lower nisab value = more people included
// = more benefit to the poor (ra'y al-jumhur)
export const DEFAULT_NISAB_STANDARD = 'SILVER' as const

// Saudi Arabia timezone — all date comparisons use this
export const SAUDI_TIMEZONE = 'Asia/Riyadh'

// Gold karat purity — ratio of pure gold to total weight
export const GOLD_PURITY: Record<number, number> = {
  24: 1.0,     // 999 fine — pure
  22: 0.9167,  // 916 hallmark
  21: 0.875,   // 875 hallmark — most common in Saudi Arabia
  18: 0.75,    // 750 hallmark
  14: 0.5833,
  12: 0.5,
  10: 0.4167,
  9:  0.375,
}

// Asset types the user can select from dropdown
// or type their own (CUSTOM)
export const ASSET_TYPE_LABELS: Record<string, string> = {
  GOLD_SAVINGS:    'ذهب (مدخر)',
  SILVER_SAVINGS:  'فضة (مدخرة)',
  STOCKS:          'أسهم واستثمارات',
  CONFIRMED_DEBTS: 'ديون مضمونة الرجوع',
  TRADE_GOODS:     'بضاعة تجارية',
  CASH:            'نقد خارج البنك',
  CUSTOM:          'أصل مخصص',
}

// GoldAPI metal codes
export const METAL_CODES = {
  GOLD:   'XAU',
  SILVER: 'XAG',
} as const

// How many days before hawl completion to send reminder
export const HAWL_REMINDER_DAYS_BEFORE = 30