// PATCH|DELETE /api/zakat/liabilities/[id]

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/user'

export const dynamic = 'force-dynamic'

const UpdateSchema = z.object({
  label:     z.string().min(2).optional(),
  amount:    z.number().positive().optional(),
  dueDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes:     z.string().optional(),
  isSettled: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    const { id } = await params

    const existing = await prisma.zakat_liabilities.findFirst({
      where: { id, user_id: userId },
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'الدين غير موجود' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.label     !== undefined) updateData.label      = parsed.data.label
    if (parsed.data.amount    !== undefined) updateData.amount     = parsed.data.amount
    if (parsed.data.notes     !== undefined) updateData.notes      = parsed.data.notes
    if (parsed.data.isSettled !== undefined) updateData.is_settled = parsed.data.isSettled
    if (parsed.data.dueDate   !== undefined) {
      updateData.due_date = new Date(parsed.data.dueDate + 'T00:00:00+03:00')
    }

    const updated = await prisma.zakat_liabilities.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('[PATCH /api/zakat/liabilities/[id]]', error)
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

    const existing = await prisma.zakat_liabilities.findFirst({
      where: { id, user_id: userId },
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'الدين غير موجود' }, { status: 404 })
    }

    await prisma.zakat_liabilities.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'تم حذف الدين بنجاح' })
  } catch (error) {
    console.error('[DELETE /api/zakat/liabilities/[id]]', error)
    return NextResponse.json({ success: false, error: 'خطأ في الحذف' }, { status: 500 })
  }
}
