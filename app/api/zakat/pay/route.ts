// GET|POST /api/zakat/pay

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/user'
import { startNewHawl } from '@/lib/zakat/hawl'
import { getTodayNisabPrices } from '@/lib/gold-api'
import { isAboveNisab } from '@/lib/zakat/calculator'
import { toRiyadhDateString, addDays } from '@/lib/date'
import { HIJRI_YEAR_DAYS } from '@/lib/zakat/constants'

export const dynamic = 'force-dynamic'

const PaySchema = z.object({
  calculationId: z.string().uuid(),
  amount:        z.number().positive(),
  fromAccountId: z.string(),
  receiverId:    z.string().uuid(),
  notes:         z.string().optional(),
  isAutomated:   z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    const body = await req.json()

    const parsed = PaySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { calculationId, amount, fromAccountId, receiverId, notes, isAutomated } = parsed.data

    const calculation = await prisma.zakat_calculations.findFirst({
      where: { id: calculationId, user_id: userId },
    })
    if (!calculation) {
      return NextResponse.json({ success: false, error: 'الحساب غير موجود' }, { status: 404 })
    }

    const receiver = await prisma.zakat_payment_receivers.findFirst({
      where: { id: receiverId, user_id: userId },
    })
    if (!receiver) {
      return NextResponse.json({ success: false, error: 'جهة الاستلام غير موجودة' }, { status: 404 })
    }

    // Verify fromAccount exists in user's connected DB accounts
    const fromAccount = await prisma.accounts.findFirst({
      where: {
        account_id: fromAccountId,
        banks: { user_id: userId, is_connected: true },
      },
    })
    if (!fromAccount) {
      return NextResponse.json(
        { success: false, error: 'الحساب المصدر غير موجود أو غير مرتبط' },
        { status: 400 }
      )
    }
    if (Number(fromAccount.balance) < amount) {
      return NextResponse.json(
        {
          success: false,
          error: `رصيد الحساب (${Number(fromAccount.balance).toLocaleString('ar-SA')} ريال) أقل من مبلغ الزكاة (${amount.toLocaleString('ar-SA')} ريال)`,
        },
        { status: 400 }
      )
    }

    const settings = await prisma.user_zakat_settings.findUnique({ where: { user_id: userId } })
    if (!settings) {
      return NextResponse.json({ success: false, error: 'إعدادات الزكاة غير موجودة' }, { status: 400 })
    }

    const bankRef = `ZKT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const today = toRiyadhDateString()

    await prisma.$transaction(async (tx) => {
      await tx.zakat_payments.create({
        data: {
          user_id:         userId,
          calculation_id:  calculationId,
          amount,
          currency:        'SAR',
          status:          'COMPLETED',
          receiver_id:     receiverId,
          account_id:      fromAccount.id,
          to_iban:         (receiver as any).iban,
          bank_reference:  bankRef,
          is_automated:    isAutomated,
          notes:           notes ?? null,
          paid_at:         new Date(),
        },
      })

      await tx.accounts.update({
        where: { id: fromAccount.id },
        data: { balance: { decrement: amount } },
      })

      const activeAssets = await tx.zakat_assets.findMany({
        where: { user_id: userId, status: 'ACTIVE' },
      })

      await tx.zakat_assets.updateMany({
        where: { user_id: userId, status: 'ACTIVE' },
        data:  { status: 'ZAKAT_PAID' },
      })

      await tx.zakat_asset_history.createMany({
        data: (activeAssets as any[]).map((a) => ({
          asset_id:    a.id,
          user_id:     userId,
          action:      'ZAKAT_PAID',
          snapshot: {
            id: a.id,
            user_id: a.user_id,
            asset_type: a.asset_type,
            custom_label: a.custom_label,
            description: a.description,
            amount: Number(a.amount),
            currency: a.currency,
            weight_grams: a.weight_grams ? Number(a.weight_grams) : null,
            karat: a.karat,
            owned_since: a.owned_since.toISOString(),
            owned_until: a.owned_until?.toISOString() ?? null,
            status: a.status,
          },
          change_note: `دُفعت الزكاة — المرجع: ${bankRef}`,
        })),
      })

      await tx.zakat_hawl.updateMany({
        where: { user_id: userId, status: { in: ['ACTIVE', 'COMPLETED'] as any[] } },
        data: {
          status:       'BROKEN' as any,
          broken_at:    new Date(),
          break_reason: 'تم دفع الزكاة — يبدأ الحول من جديد',
        },
      })

      await tx.user_zakat_settings.update({
        where: { user_id: userId },
        data: {
          last_zakat_payment_date: new Date(),
          nisab_locked_until: new Date(addDays(today, HIJRI_YEAR_DAYS) + 'T00:00:00+03:00'),
        },
      })
    })

    // Start new hawl after payment if still above nisab
    const prices = await getTodayNisabPrices()
    const userAccounts = await prisma.accounts.findMany({
      where: { banks: { user_id: userId, is_connected: true } },
      select: { balance: true },
    })
    const currentBankBalance = userAccounts.reduce((sum, a) => sum + Number(a.balance), 0)
    const stillAboveNisab = isAboveNisab(currentBankBalance, settings.nisab_standard as any, prices)

    let newHawlId: string | null = null
    if (stillAboveNisab) {
      newHawlId = await startNewHawl(userId, settings.nisab_standard as any, currentBankBalance, today)
    }

    return NextResponse.json({
      success: true,
      data: {
        bankReference:  bankRef,
        amount,
        paidAt:         new Date().toISOString(),
        receiver:       { label: (receiver as any).label, iban: (receiver as any).iban },
        newHawlStarted: !!newHawlId,
        newHawlId,
        message:        'تم دفع الزكاة بنجاح. جزاك الله خيراً.',
      },
    })
  } catch (error) {
    console.error('[POST /api/zakat/pay]', error)
    return NextResponse.json({ success: false, error: 'خطأ في دفع الزكاة' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const userId = await getCurrentUserId()

    const payments = await prisma.zakat_payments.findMany({
      where:   { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        zakat_payment_receivers: {
          select: { label: true, iban: true, is_charity: true },
        },
        zakat_calculations: {
          select: {
            zakat_amount:   true,
            net_worth:      true,
            nisab_standard: true,
            calculated_at:  true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: (payments as any[]).map((payment) => ({
        id: payment.id,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        paidAt: payment.paid_at?.toISOString() ?? null,
        bankReference: payment.bank_reference,
        isAutomated: payment.is_automated,
        notes: payment.notes,
        receiver: payment.zakat_payment_receivers
          ? {
              label: payment.zakat_payment_receivers.label,
              iban: payment.zakat_payment_receivers.iban,
              isCharity: payment.zakat_payment_receivers.is_charity,
            }
          : null,
        calculation: payment.zakat_calculations
          ? {
              zakatAmount: payment.zakat_calculations.zakat_amount
                ? Number(payment.zakat_calculations.zakat_amount)
                : null,
              netWorth: Number(payment.zakat_calculations.net_worth),
              nisabStandard: payment.zakat_calculations.nisab_standard,
              calculatedAt: payment.zakat_calculations.calculated_at.toISOString(),
            }
          : null,
      })),
    })
  } catch (error) {
    console.error('[GET /api/zakat/pay]', error)
    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
  }
}
