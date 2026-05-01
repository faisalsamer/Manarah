// /api/zakat/setup
//
// POST  — Complete first-time zakat setup
// GET   — Get current setup status and settings
// PATCH — Update settings (only allowed fields, not nisabStandard if locked)

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/user'
import { getTodayNisabPrices } from '@/lib/gold-api'
import { analyzeRetroactivePeriod, startNewHawl } from '@/lib/zakat/hawl'
import { getBalanceOnDate, isAboveNisab } from '@/lib/zakat/calculator'
import { toRiyadhDateString } from '@/lib/date'
import { getAllTransactions } from '@/lib/data/transactions'

const SetupSchema = z.object({
  previousNetBalance: z.number().min(0),
  moneyCollectedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lastZakatPaymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  nisabStandard: z.enum(['SILVER', 'GOLD']),
  nisabStandardConfirmed: z.boolean(),
})

// ── GET /api/zakat/setup ──────────────────────────────────────
export async function GET() {
  try {
    const userId = await getCurrentUserId()

    const settings = await prisma.user_zakat_settings.findUnique({
      where: { user_id: userId },
      include: {
        zakat_hawl: {
          where: { status: { in: ['ACTIVE', 'COMPLETED'] as any[] } },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    })

    if (!settings) {
      return NextResponse.json({
        success: true,
        data: { isSetupComplete: false, settings: null },
      })
    }

    return NextResponse.json({
      success: true,
      data: { isSetupComplete: settings.is_setup_complete, settings },
    })
  } catch (error) {
    console.error('[GET /api/zakat/setup]', error)
    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
  }
}

// ── POST /api/zakat/setup ─────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    const customerId = req.headers.get('x-user-id')?.trim() || 'CUST001'
    const body = await req.json()

    const parsed = SetupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { previousNetBalance, moneyCollectedDate, lastZakatPaymentDate, nisabStandard } =
      parsed.data

    const existing = await prisma.user_zakat_settings.findUnique({ where: { user_id: userId } })
    if (existing?.is_setup_complete) {
      return NextResponse.json(
        { success: false, error: 'تم إعداد الزكاة مسبقاً' },
        { status: 409 }
      )
    }

    // Get connected accounts from DB
    const bankRows = await prisma.banks.findMany({
      where: { user_id: userId, is_connected: true },
      include: { accounts: { select: { account_id: true, balance: true } } },
    })
    const today = toRiyadhDateString(new Date())
    const transactions = getAllTransactions().filter((txn) => txn.customer_id === customerId)
    const dbAccountIds = bankRows.flatMap((b) => b.accounts.map((a) => a.account_id))
    const accountIds = dbAccountIds.length > 0
      ? dbAccountIds
      : Array.from(new Set(transactions.map((txn) => txn.account_id)))
    const dbBalancesByAccountId = new Map(
      bankRows.flatMap((bank) =>
        bank.accounts.map((account) => [account.account_id, Number(account.balance)] as const)
      )
    )
    const currentBankBalance = accountIds.reduce(
      (sum, accountId) =>
        sum + (getBalanceOnDate(transactions, accountId, today) ?? dbBalancesByAccountId.get(accountId) ?? 0),
      0
    )

    // Run retroactive analysis using transaction history JSON
    const retroResult = await analyzeRetroactivePeriod(
      { userId, previousNetBalance, moneyCollectedDate, lastZakatPaymentDate, nisabStandard },
      transactions,
      accountIds
    )

    const todayPrices = await getTodayNisabPrices()
    const currentlyAboveNisab = isAboveNisab(currentBankBalance, nisabStandard, todayPrices)

    const settings = await prisma.user_zakat_settings.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        nisab_standard: nisabStandard,
        nisab_standard_confirmed: true,
        previous_net_balance: previousNetBalance,
        money_collected_date: new Date(moneyCollectedDate + 'T00:00:00+03:00'),
        last_zakat_payment_date: lastZakatPaymentDate
          ? new Date(lastZakatPaymentDate + 'T00:00:00+03:00')
          : null,
        is_setup_complete: true,
        auto_pay_enabled: false,
      },
      update: {
        nisab_standard: nisabStandard,
        nisab_standard_confirmed: true,
        previous_net_balance: previousNetBalance,
        money_collected_date: new Date(moneyCollectedDate + 'T00:00:00+03:00'),
        last_zakat_payment_date: lastZakatPaymentDate
          ? new Date(lastZakatPaymentDate + 'T00:00:00+03:00')
          : null,
        is_setup_complete: true,
      },
    })

    let hawlId: string | null = null
    if (retroResult.suggestedHawlStartDate && currentlyAboveNisab) {
      hawlId = await startNewHawl(
        userId,
        nisabStandard,
        currentBankBalance,
        retroResult.suggestedHawlStartDate
      )

      if (retroResult.dailyChecks.length > 0 && hawlId) {
        const checkData = retroResult.dailyChecks.map((c) => ({
          hawl_id: hawlId!,
          user_id: userId,
          check_date: new Date(c.date),
          bank_balance: c.bankBalance,
          manual_assets_total: c.manualAssetsTotal,
          total_net_worth: c.totalNetWorth,
          nisab_value_sar: c.nisabValueSAR,
          gold_price_per_gram: c.nisabPrices.gold.pricePerGramSAR,
          silver_price_per_gram: c.nisabPrices.silver.pricePerGramSAR,
          is_above_nisab: c.isAboveNisab,
        }))

        for (let i = 0; i < checkData.length; i += 100) {
          await prisma.hawl_daily_checks.createMany({
            data: checkData.slice(i, i + 100),
            skipDuplicates: true,
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        settings,
        hawlId,
        retroAnalysis: {
          startDate: retroResult.startDate,
          endDate: retroResult.endDate,
          totalDays: retroResult.totalDays,
          daysAboveNisab: retroResult.daysAboveNisab,
          hawlBrokenCount: retroResult.hawlBrokenDates.length,
          suggestedHawlStartDate: retroResult.suggestedHawlStartDate,
          shouldStartFreshHawl: retroResult.shouldStartFreshHawl,
        },
        currentlyAboveNisab,
      },
    })
  } catch (error) {
    console.error('[POST /api/zakat/setup]', error)
    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
  }
}

// ── PATCH /api/zakat/setup ────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    const body = await req.json()

    const settings = await prisma.user_zakat_settings.findUnique({ where: { user_id: userId } })
    if (!settings) {
      return NextResponse.json({ success: false, error: 'الإعداد غير موجود' }, { status: 404 })
    }

    if (body.nisabStandard && settings.nisab_standard_confirmed) {
      const today = toRiyadhDateString()
      const lockedUntil = settings.nisab_locked_until
        ? toRiyadhDateString(settings.nisab_locked_until)
        : null

      if (!lockedUntil || today < lockedUntil) {
        return NextResponse.json(
          {
            success: false,
            error: 'لا يمكن تغيير معيار النصاب حتى نهاية الحول الحالي',
            lockedUntil,
          },
          { status: 403 }
        )
      }
    }

    const allowedFields = ['auto_pay_enabled', 'auto_pay_receiver_id']
    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field]
    }

    const updated = await prisma.user_zakat_settings.update({
      where: { user_id: userId },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('[PATCH /api/zakat/setup]', error)
    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
  }
}
