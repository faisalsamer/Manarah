// ─────────────────────────────────────────────────────────────
// HAWL ENGINE
// Manages the hijri year cycle (الحَوْل)
//
// Islamic rules for hawl:
// - Hawl starts when net worth first reaches nisab
// - If net worth drops below nisab at ANY point → hawl breaks
// - Hawl restarts from the date it returns above nisab
// - Zakat only becomes due after FULL hawl (354 days) completes
// - Increases mid-hawl (salary, gifts) join the existing hawl
// - Decreases that drop below nisab break the hawl entirely
// ─────────────────────────────────────────────────────────────

import {
  HawlState,
  RetroactivePeriodInput,
  RetroactivePeriodResult,
  DailyCheckResult,
  NisabStandard,
} from '@/types/zakat'
import {
  HIJRI_YEAR_DAYS,
  HAWL_REMINDER_DAYS_BEFORE,
} from '@/lib/zakat/constants'
import {
  toRiyadhDateString,
  daysBetween,
  getHawlEndDate,
  getHawlProgress,
} from '@/utils/date'
import {
  runDailyNisabCheck,
  getTotalBankBalanceOnDate,
  getMinimumTransactionBalanceByDate,
  Transaction,
} from './calculator'
import { getNisabPriceForDate, getTodayNisabPrices } from '@/lib/gold-api'
import { prisma } from '@/lib/prisma'

// ─────────────────────────────────────────────────────────────
// CURRENT HAWL STATE
// ─────────────────────────────────────────────────────────────

export function computeHawlState(hawl: {
  status: string
  start_date: Date
  expected_end_date: Date
  broken_at?: Date | null
  break_reason?: string | null
} | null): HawlState {
  if (!hawl || hawl.status === 'PENDING') {
    return {
      isActive: false,
      isComplete: false,
      startDate: null,
      expectedEndDate: null,
      daysPassed: 0,
      daysRemaining: HIJRI_YEAR_DAYS,
      status: 'PENDING',
      wasReset: false,
      message: 'لم يبدأ الحول بعد. أضف بياناتك المالية لبدء حساب الزكاة.',
    }
  }

  const startStr = toRiyadhDateString(hawl.start_date)
  const { daysPassed, daysRemaining, isComplete } = getHawlProgress(startStr)
  const expectedEndStr = toRiyadhDateString(hawl.expected_end_date)

  if (hawl.status === 'BROKEN') {
    return {
      isActive: false,
      isComplete: false,
      startDate: startStr,
      expectedEndDate: expectedEndStr,
      daysPassed,
      daysRemaining: HIJRI_YEAR_DAYS,
      status: 'BROKEN',
      wasReset: true,
      resetReason: hawl.break_reason ?? 'انخفض الرصيد عن النصاب',
      message: `انقطع الحول — ${hawl.break_reason ?? 'انخفض الرصيد عن النصاب'}. سيبدأ الحول من جديد عند عودة الرصيد للنصاب.`,
    }
  }

  if (hawl.status === 'COMPLETED' || isComplete) {
    return {
      isActive: true,
      isComplete: true,
      startDate: startStr,
      expectedEndDate: expectedEndStr,
      daysPassed,
      daysRemaining: 0,
      status: 'COMPLETED',
      wasReset: false,
      message: 'اكتمل الحول — الزكاة واجبة الآن.',
    }
  }

  const message =
    daysRemaining <= HAWL_REMINDER_DAYS_BEFORE
      ? `تبقى ${daysRemaining} يوماً على اكتمال الحول. استعد لدفع الزكاة.`
      : `الحول جارٍ — مضى ${daysPassed} يوماً، تبقى ${daysRemaining} يوماً.`

  return {
    isActive: true,
    isComplete: false,
    startDate: startStr,
    expectedEndDate: expectedEndStr,
    daysPassed,
    daysRemaining,
    status: 'ACTIVE',
    wasReset: false,
    message,
  }
}

export function computeHawlStateFromDailyChecks(
  dailyChecks: DailyCheckResult[]
): HawlState {
  const sortedChecks = [...dailyChecks].sort((a, b) => a.date.localeCompare(b.date))

  if (sortedChecks.length === 0) {
    return {
      isActive: false,
      isComplete: false,
      startDate: null,
      expectedEndDate: null,
      daysPassed: 0,
      daysRemaining: HIJRI_YEAR_DAYS,
      status: 'PENDING',
      wasReset: false,
      message: 'لم يبدأ الحول بعد. لا توجد معاملات كافية لحساب حالة المحفظة.',
    }
  }

  let activeStart: DailyCheckResult | null = null
  let brokenStart: DailyCheckResult | null = null
  let lastBreak: DailyCheckResult | null = null

  for (const check of sortedChecks) {
    if (check.isAboveNisab) {
      if (!activeStart) activeStart = check
    } else {
      if (activeStart) {
        brokenStart = activeStart
        lastBreak = check
      }
      activeStart = null
    }
  }

  if (!activeStart) {
    if (brokenStart && lastBreak) {
      const startDate = brokenStart.date
      return {
        isActive: false,
        isComplete: false,
        startDate,
        expectedEndDate: getHawlEndDate(startDate),
        daysPassed: daysBetween(startDate, lastBreak.date),
        daysRemaining: HIJRI_YEAR_DAYS,
        status: 'BROKEN',
        wasReset: true,
        resetReason: `انخفضت المحفظة إلى ${lastBreak.totalNetWorth.toLocaleString('ar-SA')} ريال عن النصاب البالغ ${lastBreak.nisabValueSAR.toLocaleString('ar-SA')} ريال`,
        message: `انقطع الحول في ${lastBreak.date} لأن رصيد المحفظة انخفض عن نصاب ذلك اليوم.`,
      }
    }

    return {
      isActive: false,
      isComplete: false,
      startDate: null,
      expectedEndDate: null,
      daysPassed: 0,
      daysRemaining: HIJRI_YEAR_DAYS,
      status: 'PENDING',
      wasReset: false,
      message: 'لم يبدأ الحول بعد لأن المحفظة لم تبلغ النصاب في سجل المعاملات.',
    }
  }

  const today = toRiyadhDateString()
  const startDate = activeStart.date
  const expectedEndDate = getHawlEndDate(startDate)
  const daysPassed = Math.max(0, daysBetween(startDate, today))
  const daysRemaining = Math.max(0, HIJRI_YEAR_DAYS - daysPassed)

  if (daysPassed >= HIJRI_YEAR_DAYS) {
    return {
      isActive: true,
      isComplete: true,
      startDate,
      expectedEndDate,
      daysPassed,
      daysRemaining: 0,
      status: 'COMPLETED',
      wasReset: false,
      message: 'اكتمل الحول بناءً على سجل معاملات المحفظة — الزكاة واجبة الآن.',
    }
  }

  const message =
    daysRemaining <= HAWL_REMINDER_DAYS_BEFORE
      ? `تبقى ${daysRemaining} يوماً على اكتمال الحول بناءً على سجل معاملات المحفظة.`
      : `الحول جارٍ بناءً على معاملات المحفظة — مضى ${daysPassed} يوماً، تبقى ${daysRemaining} يوماً.`

  return {
    isActive: true,
    isComplete: false,
    startDate,
    expectedEndDate,
    daysPassed,
    daysRemaining,
    status: 'ACTIVE',
    wasReset: false,
    message,
  }
}

// ─────────────────────────────────────────────────────────────
// RETROACTIVE PERIOD ANALYSIS
// ─────────────────────────────────────────────────────────────

export async function analyzeRetroactivePeriod(
  input: RetroactivePeriodInput,
  transactions: Transaction[],
  accountIds: string[]
): Promise<RetroactivePeriodResult> {
  const { moneyCollectedDate, nisabStandard } = input
  const today = toRiyadhDateString()

  const trackedAccountIds =
    accountIds.length > 0
      ? accountIds
      : Array.from(new Set(transactions.map((t) => t.account_id)))
  const transactionBalancesByDate = getMinimumTransactionBalanceByDate(
    transactions,
    trackedAccountIds,
    moneyCollectedDate,
    today
  )
  const dates = Array.from(
    new Set([
      moneyCollectedDate,
      ...transactionBalancesByDate.keys(),
      today,
    ])
  ).sort()
  const dailyChecks: DailyCheckResult[] = []
  const hawlBrokenDates: string[] = []

  let lastHawlBreakDate: string | null = null

  for (const date of dates) {
    const prices = await getNisabPriceForDate(date)
    if (!prices) continue

    const bankBalance =
      transactionBalancesByDate.get(date) ??
      getTotalBankBalanceOnDate(transactions, trackedAccountIds, date)

    const effectiveBankBalance =
      date === moneyCollectedDate && bankBalance === 0
        ? input.previousNetBalance
        : bankBalance

    const checkResult = runDailyNisabCheck({
      date,
      bankBalance: effectiveBankBalance,
      manualAssetsTotal: 0,
      nisabPrices: prices,
      nisabStandard,
    })

    dailyChecks.push(checkResult)

    if (!checkResult.isAboveNisab) {
      hawlBrokenDates.push(date)
      lastHawlBreakDate = date
    }
  }

  let suggestedHawlStartDate: string | null = null
  let shouldStartFreshHawl = false

  if (lastHawlBreakDate) {
    const postBreakChecks = dailyChecks.filter(
      (c) => c.date > lastHawlBreakDate! && c.isAboveNisab
    )
    suggestedHawlStartDate = postBreakChecks.length > 0 ? postBreakChecks[0].date : null
    shouldStartFreshHawl = true
  } else {
    suggestedHawlStartDate = moneyCollectedDate
    shouldStartFreshHawl = false
  }

  const daysAboveNisab = dailyChecks.filter((c) => c.isAboveNisab).length

  return {
    startDate: moneyCollectedDate,
    endDate: today,
    totalDays: dates.length,
    daysAboveNisab,
    hawlBrokenDates,
    shouldStartFreshHawl,
    suggestedHawlStartDate,
    dailyChecks,
  }
}

// ─────────────────────────────────────────────────────────────
// DAILY HAWL CHECK (runs via cron job daily)
// ─────────────────────────────────────────────────────────────

export async function runTodayHawlCheck(
  hawlId: string,
  userId: string,
  nisabStandard: NisabStandard,
  bankBalance: number,
  manualAssetsTotal: number
): Promise<{
  wasAboveNisab: boolean
  hawlBroke: boolean
  hawlCompleted: boolean
  checkResult: DailyCheckResult
}> {
  const today = toRiyadhDateString()
  const prices = await getTodayNisabPrices()

  const checkResult = runDailyNisabCheck({
    date: today,
    bankBalance,
    manualAssetsTotal,
    nisabPrices: prices,
    nisabStandard,
  })

  await prisma.hawl_daily_checks.upsert({
    where: {
      hawl_id_check_date: {
        hawl_id: hawlId,
        check_date: new Date(today),
      },
    },
    create: {
      hawl_id: hawlId,
      user_id: userId,
      check_date: new Date(today),
      bank_balance: bankBalance,
      manual_assets_total: manualAssetsTotal,
      total_net_worth: checkResult.totalNetWorth,
      nisab_value_sar: checkResult.nisabValueSAR,
      gold_price_per_gram: prices.gold.pricePerGramSAR,
      silver_price_per_gram: prices.silver.pricePerGramSAR,
      is_above_nisab: checkResult.isAboveNisab,
    },
    update: {
      bank_balance: bankBalance,
      manual_assets_total: manualAssetsTotal,
      total_net_worth: checkResult.totalNetWorth,
      nisab_value_sar: checkResult.nisabValueSAR,
      is_above_nisab: checkResult.isAboveNisab,
    },
  })

  const hawl = await prisma.zakat_hawl.findUnique({ where: { id: hawlId } })
  if (!hawl) throw new Error(`Hawl not found: ${hawlId}`)

  const startStr = toRiyadhDateString(hawl.start_date)
  const { daysPassed, isComplete } = getHawlProgress(startStr)

  let hawlBroke = false
  let hawlCompleted = false

  if (!checkResult.isAboveNisab) {
    hawlBroke = true
    await prisma.zakat_hawl.update({
      where: { id: hawlId },
      data: {
        status: 'BROKEN' as any,
        broken_at: new Date(),
        break_reason: `انخفض الرصيد إلى ${checkResult.totalNetWorth.toLocaleString('ar-SA')} ريال عن النصاب البالغ ${checkResult.nisabValueSAR.toLocaleString('ar-SA')} ريال`,
      },
    })
  } else if (isComplete && hawl.status === 'ACTIVE') {
    hawlCompleted = true
    await prisma.zakat_hawl.update({
      where: { id: hawlId },
      data: {
        status: 'COMPLETED' as any,
        completed_at: new Date(),
      },
    })
  }

  return { wasAboveNisab: checkResult.isAboveNisab, hawlBroke, hawlCompleted, checkResult }
}

export async function startNewHawl(
  userId: string,
  nisabStandard: NisabStandard,
  balanceAtStart: number,
  startDate?: string
): Promise<string> {
  const hawlStartDate = startDate ?? toRiyadhDateString()
  const expectedEnd = getHawlEndDate(hawlStartDate)

  const hawl = await prisma.zakat_hawl.create({
    data: {
      user_id: userId,
      status: 'ACTIVE' as any,
      start_date: new Date(hawlStartDate + 'T00:00:00+03:00'),
      expected_end_date: new Date(expectedEnd + 'T00:00:00+03:00'),
      nisab_standard: nisabStandard as any,
      balance_at_start: balanceAtStart,
    },
  })

  return hawl.id
}
