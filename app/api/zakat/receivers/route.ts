// GET|POST /api/zakat/receivers

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/user'

export const dynamic = 'force-dynamic'

const SAUDI_IBAN_REGEX = /^SA\d{22}$/

const ReceiverSchema = z.object({
  label:       z.string().min(2, 'اسم الجهة مطلوب'),
  iban:        z.string().regex(SAUDI_IBAN_REGEX, 'رقم الآيبان غير صحيح. يجب أن يبدأ بـ SA ويتكون من 24 حرفاً'),
  accountName: z.string().min(2, 'اسم صاحب الحساب مطلوب'),
  bankName:    z.string().optional(),
  isCharity:   z.boolean().default(true),
  isDefault:   z.boolean().default(false),
})

function normalizeReceiver(r: any) {
  return {
    id:          r.id,
    label:       r.label,
    iban:        r.iban,
    accountName: r.account_name,
    bankName:    r.bank_name,
    isCharity:   r.is_charity,
    isDefault:   r.is_default,
  }
}

export async function GET() {
  try {
    const userId = await getCurrentUserId()

    const receivers = await prisma.zakat_payment_receivers.findMany({
      where: { user_id: userId },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    })

    return NextResponse.json({ success: true, data: (receivers as any[]).map(normalizeReceiver) })
  } catch (error) {
    console.error('[GET /api/zakat/receivers]', error)
    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    const body = await req.json()

    const parsed = ReceiverSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    const existing = await prisma.zakat_payment_receivers.findFirst({
      where: { user_id: userId, iban: data.iban },
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'هذا الآيبان مضاف مسبقاً' },
        { status: 409 }
      )
    }

    if (data.isDefault) {
      await prisma.zakat_payment_receivers.updateMany({
        where: { user_id: userId, is_default: true },
        data: { is_default: false },
      })
    }

    const receiver = await prisma.zakat_payment_receivers.create({
      data: {
        user_id:      userId,
        label:        data.label,
        iban:         data.iban,
        account_name: data.accountName,
        bank_name:    data.bankName ?? null,
        is_charity:   data.isCharity,
        is_default:   data.isDefault,
      },
    })

    return NextResponse.json({ success: true, data: receiver }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/zakat/receivers]', error)
    return NextResponse.json({ success: false, error: 'خطأ في إضافة جهة الاستلام' }, { status: 500 })
  }
}
