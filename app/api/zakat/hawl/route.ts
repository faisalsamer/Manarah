// GET /api/zakat/hawl
// Returns current hawl state + transaction-based daily checks for chart

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/user'
import { analyzeRetroactivePeriod, computeHawlStateFromDailyChecks } from '@/lib/zakat/hawl'
import { toRiyadhDateString } from '@/lib/date'
import { getAllTransactions } from '@/lib/data/transactions'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    const customerId = req.headers.get('x-user-id')?.trim() || 'CUST001'

    const settings = await prisma.user_zakat_settings.findUnique({
      where: { user_id: userId },
    })

    const allHawls = await prisma.zakat_hawl.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    })

    if (!settings?.is_setup_complete) {
      return NextResponse.json({
        success: true,
        data: {
          currentHawl: null,
          hawlState: computeHawlStateFromDailyChecks([]),
          chartData: [],
          hawlHistory: [],
        },
      })
    }

    const bankRows = await prisma.banks.findMany({
      where: { user_id: userId, is_connected: true },
      include: { accounts: { select: { account_id: true } } },
    })

    const accountIdsFromDb = bankRows.flatMap((bank) =>
      bank.accounts.map((account) => account.account_id)
    )
    const allTransactions = getAllTransactions().filter((txn) => txn.customer_id === customerId)
    const accountIds = accountIdsFromDb.length > 0
      ? accountIdsFromDb
      : Array.from(new Set(allTransactions.map((txn) => txn.account_id)))
    const transactions = allTransactions.filter((txn) => accountIds.includes(txn.account_id))
    const firstTransactionDate = transactions
      .reduce<string | null>((earliest, txn) => {
        if (!earliest || txn.date < earliest) return txn.date
        return earliest
      }, null)

    const setupMoneyCollectedDate = settings.money_collected_date
      ? toRiyadhDateString(settings.money_collected_date)
      : null
    const moneyCollectedDate =
      firstTransactionDate && (!setupMoneyCollectedDate || firstTransactionDate < setupMoneyCollectedDate)
        ? firstTransactionDate
        : setupMoneyCollectedDate ?? toRiyadhDateString()

    const retroResult = await analyzeRetroactivePeriod(
      {
        userId,
        previousNetBalance: Number(settings.previous_net_balance ?? 0),
        moneyCollectedDate,
        lastZakatPaymentDate: settings.last_zakat_payment_date
          ? toRiyadhDateString(settings.last_zakat_payment_date)
          : undefined,
        nisabStandard: settings.nisab_standard as any,
      },
      transactions,
      accountIds
    )

    const hawlState = computeHawlStateFromDailyChecks(retroResult.dailyChecks)

    const checksForChart = retroResult.dailyChecks.slice(-366)
    const chartData = checksForChart
      .map((check, index) => {
        const previousCheck = index > 0 ? checksForChart[index - 1] : null
        const events = []

        if (check.date === hawlState.startDate) {
          events.push({
            type: 'hawl_start',
            label: 'بداية الحول',
            detail: `بدأ الحول عند صافي ثروة ${check.totalNetWorth.toLocaleString('en-US')} ر.س مقابل نصاب ${check.nisabValueSAR.toLocaleString('en-US')} ر.س.`,
          })
        }

        if (previousCheck?.isAboveNisab && !check.isAboveNisab) {
          events.push({
            type: 'hawl_break',
            label: 'انقطاع الحول',
            detail: `انخفضت الثروة إلى ${check.totalNetWorth.toLocaleString('en-US')} ر.س، أقل من نصاب ذلك اليوم.`,
          })
        }

        if (index === checksForChart.length - 1) {
          events.push({
            type: 'latest_check',
            label: 'آخر مقارنة',
            detail: check.isAboveNisab
              ? 'آخر نقطة مقارنة كانت فوق النصاب.'
              : 'آخر نقطة مقارنة كانت تحت النصاب.',
          })
        }

        return {
        date: check.date,
        balance: check.totalNetWorth,
        nisab: check.nisabValueSAR,
        isAboveNisab: check.isAboveNisab,
          events,
        }
      })
    const lastCheck = retroResult.dailyChecks.at(-1) ?? null
    const daysAboveNisab = retroResult.dailyChecks.filter((check) => check.isAboveNisab).length
    const daysBelowNisab = retroResult.dailyChecks.length - daysAboveNisab

    return NextResponse.json({
      success: true,
      data: {
        currentHawl: hawlState.startDate
          ? {
              id: 'transaction-history',
              status: hawlState.status,
              startDate: hawlState.startDate,
              expectedEndDate: hawlState.expectedEndDate,
              nisabStandard: settings.nisab_standard,
              balanceAtStart: retroResult.dailyChecks.find((check) => check.date === hawlState.startDate)?.totalNetWorth ?? 0,
            }
          : null,
        hawlState,
        chartData,
        comparisonSummary: {
          checkedDays: retroResult.dailyChecks.length,
          daysAboveNisab,
          daysBelowNisab,
          lastCheckedDate: lastCheck?.date ?? null,
          lastNetWorth: lastCheck?.totalNetWorth ?? null,
          lastNisabValueSAR: lastCheck?.nisabValueSAR ?? null,
          currentlyAboveNisab: lastCheck?.isAboveNisab ?? false,
          hawlStartDate: hawlState.startDate,
          expectedEndDate: hawlState.expectedEndDate,
          daysPassed: hawlState.daysPassed,
          daysRemaining: hawlState.status === 'ACTIVE' ? hawlState.daysRemaining : null,
          status: hawlState.status,
        },
        hawlHistory: (allHawls as any[]).map((h) => ({
          id: h.id,
          status: h.status,
          startDate: toRiyadhDateString(h.start_date),
          expectedEndDate: toRiyadhDateString(h.expected_end_date),
          completedAt: h.completed_at ? toRiyadhDateString(h.completed_at) : null,
          brokenAt: h.broken_at ? toRiyadhDateString(h.broken_at) : null,
          breakReason: h.break_reason,
          nisabStandard: h.nisab_standard,
        })),
      },
    })
  } catch (error) {
    console.error('[GET /api/zakat/hawl]', error)
    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
  }
}
