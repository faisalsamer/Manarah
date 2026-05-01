// ─────────────────────────────────────────────────────────────
// ZAKAT CALCULATOR — Core Engine
// Pure functions — no database calls, no side effects
// All monetary values in SAR
//
// Islamic basis:
// - Zakat al-Mal (زكاة المال) = 2.5% on net zakatable wealth
// - Net worth must exceed nisab AND full hijri year (hawl) must pass
// - Nisab = 85g gold OR 595g silver (silver preferred by majority)
// - Liabilities (debts you owe) are deducted before calculation
// ─────────────────────────────────────────────────────────────

import {
  ZakatCalculationInput,
  ZakatCalculationResult,
  AssetBreakdownItem,
  DailyCheckInput,
  DailyCheckResult,
  NisabStandard,
  NisabPrices,
} from '../../types/zakat'
import {
  ZAKAT_RATE,
  NISAB,
  GOLD_PURITY,
  ASSET_TYPE_LABELS,
} from '../../lib/zakat/constants'

// ─────────────────────────────────────────────────────────────
// NISAB CHECK
// ─────────────────────────────────────────────────────────────

/**
 * Get the nisab threshold value in SAR for a given standard and prices
 */
export function getNisabValueSAR(
  standard: NisabStandard,
  prices: NisabPrices
): number {
  return standard === 'SILVER'
    ? prices.silverNisabValueSAR
    : prices.goldNisabValueSAR
}

/**
 * Check if a net worth amount is above nisab
 */
export function isAboveNisab(
  netWorth: number,
  standard: NisabStandard,
  prices: NisabPrices
): boolean {
  return netWorth >= getNisabValueSAR(standard, prices)
}

// ─────────────────────────────────────────────────────────────
// GOLD VALUE CALCULATION
// Converts grams + karat to SAR value using live gold price
// ─────────────────────────────────────────────────────────────

/**
 * Calculate the SAR value of gold based on weight, karat, and price
 * Only gold held for SAVINGS purposes is zakatable
 * Gold worn daily (jewelry) is excluded per majority of scholars
 */
export function calculateGoldValueSAR(
  grams: number,
  karat: number,
  goldPricePerGram24k: number
): number {
  const purity = GOLD_PURITY[karat] ?? 0
  return parseFloat((grams * purity * goldPricePerGram24k).toFixed(2))
}

/**
 * Calculate SAR value of silver
 */
export function calculateSilverValueSAR(
  grams: number,
  silverPricePerGram: number
): number {
  return parseFloat((grams * silverPricePerGram).toFixed(2))
}

// ─────────────────────────────────────────────────────────────
// ASSET VALUE RESOLVER
// Resolves each manual asset to its current SAR value
// ─────────────────────────────────────────────────────────────

export function resolveAssetValueSAR(
  asset: ZakatCalculationInput['manualAssets'][0],
  prices: NisabPrices
): number {
  switch (asset.assetType) {
    case 'GOLD_SAVINGS':
      if (asset.weightGrams && asset.karat) {
        return calculateGoldValueSAR(
          asset.weightGrams,
          asset.karat,
          prices.gold.pricePerGramSAR
        )
      }
      // User entered SAR value directly
      return asset.amount

    case 'SILVER_SAVINGS':
      if (asset.weightGrams) {
        return calculateSilverValueSAR(
          asset.weightGrams,
          prices.silver.pricePerGramSAR
        )
      }
      return asset.amount

    case 'STOCKS':
    case 'CONFIRMED_DEBTS':
    case 'TRADE_GOODS':
    case 'CASH':
    case 'CUSTOM':
    default:
      // These are entered as SAR amounts directly
      return asset.amount
  }
}

// ─────────────────────────────────────────────────────────────
// MAIN CALCULATION ENGINE
// ─────────────────────────────────────────────────────────────

/**
 * Calculate full zakat amount and breakdown
 *
 * Steps (فقه الزكاة):
 * 1. Sum all bank balances (from linked accounts)
 * 2. Sum all manual assets (gold, silver, stocks, debts, etc.)
 * 3. Subtract liabilities (debts the user OWES)
 * 4. Check if net worth >= nisab
 * 5. If yes AND hawl is complete → zakat = netWorth * 2.5%
 */
export function calculateZakat(
  input: ZakatCalculationInput
): ZakatCalculationResult {
  const { nisabStandard, bankAccounts, manualAssets, liabilitiesTotal, nisabPrices } = input

  const breakdown: AssetBreakdownItem[] = []

  // ── Step 1: Bank balances ──────────────────────────────────
  const bankBalanceTotal = bankAccounts.reduce((sum, acc) => sum + acc.balance, 0)

  bankAccounts.forEach((acc) => {
    breakdown.push({
      label: `${acc.bankName} — ${acc.accountName}`,
      assetType: 'bank_balance',
      valueSAR: acc.balance,
      isZakatable: true,
    })
  })

  // ── Step 2: Manual assets ──────────────────────────────────
  let manualAssetsTotal = 0

  manualAssets.forEach((asset) => {
    const value = resolveAssetValueSAR(asset, nisabPrices)
    manualAssetsTotal += value

    const label =
      asset.assetType === 'CUSTOM' && asset.customLabel
        ? asset.customLabel
        : ASSET_TYPE_LABELS[asset.assetType] ?? asset.assetType

    breakdown.push({
      label,
      assetType: asset.assetType,
      valueSAR: value,
      isZakatable: true,
      notes:
        asset.assetType === 'GOLD_SAVINGS' && asset.weightGrams
          ? `${asset.weightGrams}g عيار ${asset.karat}`
          : undefined,
    })
  })

  // ── Step 3: Liabilities ────────────────────────────────────
  if (liabilitiesTotal > 0) {
    breakdown.push({
      label: 'ديون واجبة السداد',
      assetType: 'liabilities',
      valueSAR: -liabilitiesTotal,
      isZakatable: false,
    })
  }

  // ── Step 4: Net worth ──────────────────────────────────────
  const netWorth = parseFloat(
    (bankBalanceTotal + manualAssetsTotal - liabilitiesTotal).toFixed(2)
  )

  const nisabValueSAR = getNisabValueSAR(nisabStandard, nisabPrices)
  const aboveNisab = netWorth >= nisabValueSAR

  // ── Step 5: Zakat amount ───────────────────────────────────
  // Note: hawl completeness is checked OUTSIDE this function
  // The API route decides whether to pass hawlComplete=true
  // This function only does the math
  const zakatAmount = aboveNisab
    ? parseFloat((netWorth * ZAKAT_RATE).toFixed(2))
    : null

  return {
    nisabStandard,
    nisabValueSAR,
    goldPricePerGram: nisabPrices.gold.pricePerGramSAR,
    silverPricePerGram: nisabPrices.silver.pricePerGramSAR,
    bankBalanceTotal: parseFloat(bankBalanceTotal.toFixed(2)),
    manualAssetsTotal: parseFloat(manualAssetsTotal.toFixed(2)),
    liabilitiesTotal: parseFloat(liabilitiesTotal.toFixed(2)),
    netWorth,
    isAboveNisab: aboveNisab,
    zakatAmount,
    zakatRate: ZAKAT_RATE,
    breakdown,
    calculatedAt: new Date().toISOString(),
  }
}

// ─────────────────────────────────────────────────────────────
// DAILY NISAB CHECK
// Used for hawl tracking — one call per day
// ─────────────────────────────────────────────────────────────

/**
 * Run a single day's nisab check
 * This is stored in hawl_daily_checks table
 */
export function runDailyNisabCheck(input: DailyCheckInput): DailyCheckResult {
  const {
    date,
    bankBalance,
    manualAssetsTotal,
    nisabPrices,
    nisabStandard,
  } = input

  const totalNetWorth = parseFloat(
    (bankBalance + manualAssetsTotal).toFixed(2)
  )

  const nisabValueSAR = getNisabValueSAR(nisabStandard, nisabPrices)

  return {
    ...input,
    totalNetWorth,
    nisabValueSAR,
    isAboveNisab: totalNetWorth >= nisabValueSAR,
  }
}

// ─────────────────────────────────────────────────────────────
// BANK BALANCE RECONSTRUCTOR
// Reconstructs balance on a past date from transaction history
// Uses balance_after field — walks backwards from latest tx
// ─────────────────────────────────────────────────────────────

export interface Transaction {
  transaction_id: string
  account_id: string
  date: string           // YYYY-MM-DD
  timestamp: string      // ISO UTC
  type: 'credit' | 'debit'
  amount: number
  balance_after: number
  status: string
}

/**
 * Get the balance of an account on a specific date
 * Logic: find the last transaction on or before that date
 * and use its balance_after field
 *
 * If no transactions exist before that date → return null (unknown)
 */
export function getBalanceOnDate(
  transactions: Transaction[],
  accountId: string,
  targetDate: string  // YYYY-MM-DD Riyadh
): number | null {
  const accountTxns = transactions
    .filter(
      (t) =>
        t.account_id === accountId &&
        t.status === 'completed'
    )
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  if (accountTxns.length === 0) return null

  const firstTxn = accountTxns[0]

  if (targetDate < firstTxn.date) {
    const openingBalance =
      firstTxn.type === 'credit'
        ? firstTxn.balance_after - firstTxn.amount
        : firstTxn.balance_after + firstTxn.amount

    return parseFloat(openingBalance.toFixed(2))
  }

  const latestTxn = accountTxns
    .filter((t) => t.date <= targetDate)
    .at(-1)

  return latestTxn ? latestTxn.balance_after : null
}

/**
 * Get the balance of an account immediately after a specific transaction time.
 * If the account has no transaction yet, infer its opening balance from the
 * first transaction's balance_after.
 */
export function getBalanceAtTimestamp(
  transactions: Transaction[],
  accountId: string,
  timestamp: string
): number | null {
  const accountTxns = transactions
    .filter(
      (t) =>
        t.account_id === accountId &&
        t.status === 'completed'
    )
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  if (accountTxns.length === 0) return null

  const latestTxn = accountTxns
    .filter((t) => t.timestamp <= timestamp)
    .at(-1)

  if (latestTxn) return latestTxn.balance_after

  const firstTxn = accountTxns[0]
  const openingBalance =
    firstTxn.type === 'credit'
      ? firstTxn.balance_after - firstTxn.amount
      : firstTxn.balance_after + firstTxn.amount

  return parseFloat(openingBalance.toFixed(2))
}

/**
 * For each transaction date, calculate the lowest total linked-account balance
 * that appeared immediately after any transaction on that date.
 */
export function getMinimumTransactionBalanceByDate(
  transactions: Transaction[],
  accountIds: string[],
  startDate: string,
  endDate: string
): Map<string, number> {
  const trackedAccountIds =
    accountIds.length > 0
      ? accountIds
      : Array.from(new Set(transactions.map((t) => t.account_id)))

  const balancesByDate = new Map<string, number>()
  const completedTxns = transactions
    .filter(
      (t) =>
        t.status === 'completed' &&
        trackedAccountIds.includes(t.account_id) &&
        t.date >= startDate &&
        t.date <= endDate
    )
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  for (const txn of completedTxns) {
    const total = trackedAccountIds.reduce((sum, accountId) => {
      const balance = getBalanceAtTimestamp(transactions, accountId, txn.timestamp)
      return sum + (balance ?? 0)
    }, 0)
    const roundedTotal = parseFloat(total.toFixed(2))
    const existing = balancesByDate.get(txn.date)

    balancesByDate.set(
      txn.date,
      existing === undefined ? roundedTotal : Math.min(existing, roundedTotal)
    )
  }

  return balancesByDate
}

/**
 * Get total balance across all accounts on a specific date
 */
export function getTotalBankBalanceOnDate(
  transactions: Transaction[],
  accountIds: string[],
  targetDate: string
): number {
  let total = 0

  for (const accountId of accountIds) {
    const balance = getBalanceOnDate(transactions, accountId, targetDate)
    if (balance !== null) {
      total += balance
    }
  }

  return parseFloat(total.toFixed(2))
}
