// GET|POST /api/zakat/liabilities
// Liabilities = debts the user OWES, deducted before zakat calculation

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/user'

export const dynamic = 'force-dynamic'

const LiabilitySchema = z.object({
  label:    z.string().min(2, 'وصف الدين مطلوب'),
  amount:   z.number().positive('المبلغ يجب أن يكون أكبر من صفر'),
  currency: z.string().default('SAR'),
  dueDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes:    z.string().optional(),
})

function normalizeLiability(l: any) {
  return {
    id:        l.id,
    label:     l.label,
    amount:    Number(l.amount),
    currency:  l.currency,
    dueDate:   l.due_date?.toISOString() ?? null,
    notes:     l.notes,
    isSettled: l.is_settled,
  }
}

export async function GET() {
  try {
    const userId = await getCurrentUserId()

    const liabilities = await prisma.zakat_liabilities.findMany({
      where: { user_id: userId, is_settled: false },
      orderBy: { created_at: 'desc' },
    })

    const normalized = (liabilities as any[]).map(normalizeLiability)
    const total = normalized.reduce((sum, l) => sum + l.amount, 0)

    return NextResponse.json({
      success: true,
      data: normalized,
      meta: { total: parseFloat(total.toFixed(2)), count: normalized.length },
    })
  } catch (error) {
    console.error('[GET /api/zakat/liabilities]', error)
    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    const body = await req.json()

    const parsed = LiabilitySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const liability = await prisma.zakat_liabilities.create({
      data: {
        user_id:    userId,
        label:      parsed.data.label,
        amount:     parsed.data.amount,
        currency:   parsed.data.currency,
        due_date:   parsed.data.dueDate
          ? new Date(parsed.data.dueDate + 'T00:00:00+03:00')
          : null,
        notes:      parsed.data.notes ?? null,
        is_settled: false,
      },
    })

    return NextResponse.json({ success: true, data: liability }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/zakat/liabilities]', error)
    return NextResponse.json({ success: false, error: 'خطأ في إضافة الدين' }, { status: 500 })
  }
}
