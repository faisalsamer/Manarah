// PATCH|DELETE /api/zakat/receivers/[id]

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/user'

export const dynamic = 'force-dynamic'

const SAUDI_IBAN_REGEX = /^SA\d{22}$/

const UpdateSchema = z.object({
  label:       z.string().min(2).optional(),
  iban:        z.string().regex(SAUDI_IBAN_REGEX).optional(),
  accountName: z.string().min(2).optional(),
  bankName:    z.string().optional(),
  isCharity:   z.boolean().optional(),
  isDefault:   z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    const { id } = await params

    const receiver = await prisma.zakat_payment_receivers.findFirst({
      where: { id, user_id: userId },
    })
    if (!receiver) {
      return NextResponse.json(
        { success: false, error: 'جهة الاستلام غير موجودة' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    if (parsed.data.isDefault) {
      await prisma.zakat_payment_receivers.updateMany({
        where: { user_id: userId, is_default: true },
        data: { is_default: false },
      })
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.label       !== undefined) updateData.label        = parsed.data.label
    if (parsed.data.iban        !== undefined) updateData.iban         = parsed.data.iban
    if (parsed.data.accountName !== undefined) updateData.account_name = parsed.data.accountName
    if (parsed.data.bankName    !== undefined) updateData.bank_name    = parsed.data.bankName
    if (parsed.data.isCharity   !== undefined) updateData.is_charity   = parsed.data.isCharity
    if (parsed.data.isDefault   !== undefined) updateData.is_default   = parsed.data.isDefault

    const updated = await prisma.zakat_payment_receivers.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('[PATCH /api/zakat/receivers/[id]]', error)
    return NextResponse.json({ success: false, error: 'خطأ في التعديل' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    const { id } = await params

    const receiver = await prisma.zakat_payment_receivers.findFirst({
      where: { id, user_id: userId },
    })
    if (!receiver) {
      return NextResponse.json(
        { success: false, error: 'جهة الاستلام غير موجودة' },
        { status: 404 }
      )
    }

    const settings = await prisma.user_zakat_settings.findUnique({
      where: { user_id: userId },
      select: { auto_pay_receiver_id: true },
    })

    if (settings?.auto_pay_receiver_id === id) {
      return NextResponse.json(
        {
          success: false,
          error: 'لا يمكن حذف جهة الاستلام الافتراضية للدفع التلقائي. غيّر إعداد الدفع التلقائي أولاً.',
        },
        { status: 403 }
      )
    }

    await prisma.zakat_payment_receivers.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'تم حذف جهة الاستلام بنجاح' })
  } catch (error) {
    console.error('[DELETE /api/zakat/receivers/[id]]', error)
    return NextResponse.json({ success: false, error: 'خطأ في الحذف' }, { status: 500 })
  }
}
