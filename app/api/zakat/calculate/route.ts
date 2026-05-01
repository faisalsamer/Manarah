// POST /api/zakat/calculate
// Runs the full zakat calculation for the current user

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/user'
import { getTodayNisabPrices } from '@/lib/gold-api'
import { calculateZakat } from '@/lib/zakat/calculator'
import { analyzeRetroactivePeriod, computeHawlStateFromDailyChecks } from '@/lib/zakat/hawl'
import { ZakatCalculationInput, BankAccountBalance } from '@/types/zakat'
import { getAllTransactions } from '@/lib/data/transactions'
import { toRiyadhDateString } from '@/utils/date'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    const customerId = req.headers.get('x-user-id')?.trim() || 'CUST001'

    const settings = await prisma.user_zakat_settings.findUnique({ where: { user_id: userId } })
    if (!settings?.is_setup_complete) {
      return NextResponse.json(
        { success: false, error: 'يرجى إكمال إعداد الزكاة أولاً' },
        { status: 400 }
      )
    }

    const activeHawl = await prisma.zakat_hawl.findFirst({
      where: { user_id: userId, status: { in: ['ACTIVE', 'COMPLETED'] as any[] } },
      orderBy: { created_at: 'desc' },
    })

    // Bank balances from linked accounts in DB
    const bankRows = await prisma.banks.findMany({
      where: { user_id: userId, is_connected: true },
      include: { accounts: true },
    })
    const today = toRiyadhDateString(new Date())
    const transactions = getAllTransactions().filter((txn) => txn.customer_id === customerId)
    const dbAccountIds = bankRows.flatMap((bank) => bank.accounts.map((account) => account.account_id))
    const accountIds = dbAccountIds.length > 0
      ? dbAccountIds
      : Array.from(new Set(transactions.map((txn) => txn.account_id)))
    const linkedTransactions = transactions.filter((txn) => accountIds.includes(txn.account_id))
    const firstTransactionDate = linkedTransactions
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
        : setupMoneyCollectedDate ?? today
    const hawlAnalysis = await analyzeRetroactivePeriod(
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
    const hawlState = computeHawlStateFromDailyChecks(hawlAnalysis.dailyChecks)

    const bankAccounts: BankAccountBalance[] = bankRows.flatMap((bank) =>
      bank.accounts.map((acc) => ({
        accountId: acc.account_id,
        accountName: acc.account_name ?? acc.account_type,
        bankName: bank.bank_name,
        balance: Number(acc.balance),
        currency: acc.currency,
      }))
    )

    const manualAssets = await prisma.zakat_assets.findMany({
      where: { user_id: userId, status: 'ACTIVE' },
    })

    const liabilities = await prisma.zakat_liabilities.findMany({
      where: { user_id: userId, is_settled: false },
    })
    const liabilitiesTotal = (liabilities as any[]).reduce(
      (sum, l) => sum + Number(l.amount),
      0
    )

    const nisabPrices = await getTodayNisabPrices()

    const calcInput: ZakatCalculationInput = {
      userId,
      nisabStandard: settings.nisab_standard as any,
      bankAccounts,
      manualAssets: (manualAssets as any[]).map((a) => ({
        id: a.id,
        userId: a.user_id,
        assetType: a.asset_type,
        customLabel: a.custom_label ?? undefined,
        description: a.description ?? undefined,
        amount: Number(a.amount),
        currency: a.currency,
        weightGrams: a.weight_grams ? Number(a.weight_grams) : undefined,
        karat: a.karat ?? undefined,
        ownedSince: a.owned_since.toISOString().slice(0, 10),
        ownedUntil: a.owned_until?.toISOString().slice(0, 10),
        status: a.status,
        createdAt: a.created_at.toISOString(),
        updatedAt: a.updated_at.toISOString(),
      })),
      liabilitiesTotal,
      nisabPrices,
    }

    const result = calculateZakat(calcInput)

    const zakatDue = result.isAboveNisab && hawlState.isComplete
    const finalZakatAmount = zakatDue ? result.zakatAmount : null

    const savedCalc = await prisma.zakat_calculations.create({
      data: {
        user_id: userId,
        hawl_id: activeHawl?.id ?? null,
        nisab_standard: settings.nisab_standard,
        nisab_value_sar: result.nisabValueSAR,
        gold_price_per_gram: result.goldPricePerGram,
        silver_price_per_gram: result.silverPricePerGram,
        bank_balance_total: result.bankBalanceTotal,
        manual_assets_total: result.manualAssetsTotal,
        liabilities_total: result.liabilitiesTotal,
        net_worth: result.netWorth,
        is_above_nisab: result.isAboveNisab,
        zakat_amount: finalZakatAmount,
        zakat_rate: result.zakatRate,
        zakat_calculation_assets: {
          create: result.breakdown.map((item) => ({
            label: item.label,
            asset_type: item.assetType,
            value_at_calc: item.valueSAR,
            is_zakatable: item.isZakatable,
            asset_id: null,
          })),
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        calculationId: savedCalc.id,
        result: { ...result, zakatAmount: finalZakatAmount },
        hawlState,
        zakatDue,
        liabilities: (liabilities as any[]).map((l) => ({
          id: l.id,
          label: l.label,
          amount: Number(l.amount),
        })),
        summary: {
          bankBalanceTotal: result.bankBalanceTotal,
          manualAssetsTotal: result.manualAssetsTotal,
          liabilitiesTotal: result.liabilitiesTotal,
          netWorth: result.netWorth,
          nisabValueSAR: result.nisabValueSAR,
          goldPricePerGram: result.goldPricePerGram,
          silverPricePerGram: result.silverPricePerGram,
          isAboveNisab: result.isAboveNisab,
          hawlDaysPassed: hawlState.daysPassed,
          hawlDaysRemaining: hawlState.daysRemaining,
          zakatDue,
          zakatAmount: finalZakatAmount,
          zakatRate: result.zakatRate,
          nisabStandard: settings.nisab_standard,
        },
      },
    })
  } catch (error) {
    console.error('[POST /api/zakat/calculate]', error)
    return NextResponse.json({ success: false, error: 'خطأ في حساب الزكاة' }, { status: 500 })
  }
}
