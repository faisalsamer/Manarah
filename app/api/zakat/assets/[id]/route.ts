// GET|PATCH|DELETE /api/zakat/assets/[id]

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/user'

export const dynamic = 'force-dynamic'

const UpdateSchema = z.object({
  customLabel: z.string().optional(),
  description: z.string().optional(),
  amount:      z.number().positive().optional(),
  weightGrams: z.number().positive().optional(),
  karat:       z.number().refine((k) => [24, 22, 21, 18, 14, 12, 10, 9].includes(k)).optional(),
  ownedSince:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ownedUntil:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  changeNote:  z.string().optional(),
})

function normalize(a: any) {
  return {
    id:          a.id,
    userId:      a.user_id,
    assetType:   a.asset_type,
    customLabel: a.custom_label,
    description: a.description,
    amount:      Number(a.amount),
    currency:    a.currency,
    weightGrams: a.weight_grams ? Number(a.weight_grams) : null,
    karat:       a.karat,
    ownedSince:  a.owned_since.toISOString(),
    ownedUntil:  a.owned_until?.toISOString() ?? null,
    status:      a.status,
    createdAt:   a.created_at.toISOString(),
    updatedAt:   a.updated_at.toISOString(),
    history:     a.zakat_asset_history?.map((h: any) => ({
      id:         h.id,
      action:     h.action,
      actionAt:   h.action_at.toISOString(),
      changeNote: h.change_note,
      snapshot:   h.snapshot as Record<string, unknown>,
    })),
  }
}

function assetSnapshot(asset: any, changes?: Record<string, unknown>): any {
  const normalizedChanges = changes
    ? Object.fromEntries(
        Object.entries(changes).map(([key, value]) => [
          key,
          value instanceof Date ? value.toISOString() : value,
        ])
      )
    : undefined

  return {
    id: asset.id,
    user_id: asset.user_id,
    asset_type: asset.asset_type,
    custom_label: asset.custom_label,
    description: asset.description,
    amount: Number(asset.amount),
    currency: asset.currency,
    weight_grams: asset.weight_grams ? Number(asset.weight_grams) : null,
    karat: asset.karat,
    owned_since: asset.owned_since?.toISOString?.() ?? asset.owned_since,
    owned_until: asset.owned_until?.toISOString?.() ?? asset.owned_until ?? null,
    status: asset.status,
    ...(normalizedChanges ? { changes: normalizedChanges } : {}),
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    const { id } = await params

    const asset = await prisma.zakat_assets.findFirst({
      where: { id, user_id: userId },
      include: { zakat_asset_history: { orderBy: { action_at: 'desc' } } },
    })

    if (!asset) {
      return NextResponse.json({ success: false, error: 'الأصل غير موجود' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: normalize(asset) })
  } catch (error) {
    console.error('[GET /api/zakat/assets/[id]]', error)
    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    const { id } = await params

    const asset = await prisma.zakat_assets.findFirst({ where: { id, user_id: userId } })

    if (!asset) {
      return NextResponse.json({ success: false, error: 'الأصل غير موجود' }, { status: 404 })
    }
    if (asset.status === 'ZAKAT_PAID') {
      return NextResponse.json(
        { success: false, error: 'لا يمكن تعديل هذا الأصل لأنه تم دفع الزكاة عليه' },
        { status: 403 }
      )
    }
    if (asset.status === 'DELETED') {
      return NextResponse.json({ success: false, error: 'هذا الأصل محذوف' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { changeNote, ...fields } = parsed.data
    const updateData: Record<string, unknown> = {}
    if (fields.customLabel !== undefined) updateData.custom_label = fields.customLabel
    if (fields.description !== undefined) updateData.description  = fields.description
    if (fields.amount      !== undefined) updateData.amount       = fields.amount
    if (fields.weightGrams !== undefined) updateData.weight_grams = fields.weightGrams
    if (fields.karat       !== undefined) updateData.karat        = fields.karat
    if (fields.ownedSince  !== undefined) updateData.owned_since  = new Date(fields.ownedSince + 'T00:00:00+03:00')
    if (fields.ownedUntil  !== undefined) updateData.owned_until  = new Date(fields.ownedUntil + 'T00:00:00+03:00')

    const [updated] = await prisma.$transaction([
      prisma.zakat_assets.update({ where: { id }, data: updateData }),
      prisma.zakat_asset_history.create({
        data: {
          asset_id:    id,
          user_id:     userId,
          action:      'UPDATED',
          snapshot:    assetSnapshot(asset, updateData),
          change_note: changeNote ?? 'تم التعديل من قبل المستخدم',
        },
      }),
    ])

    return NextResponse.json({ success: true, data: normalize(updated) })
  } catch (error) {
    console.error('[PATCH /api/zakat/assets/[id]]', error)
    return NextResponse.json({ success: false, error: 'خطأ في تعديل الأصل' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    const { id } = await params

    const asset = await prisma.zakat_assets.findFirst({ where: { id, user_id: userId } })

    if (!asset) {
      return NextResponse.json({ success: false, error: 'الأصل غير موجود' }, { status: 404 })
    }
    if (asset.status === 'ZAKAT_PAID') {
      return NextResponse.json(
        {
          success: false,
          error: 'لا يمكن حذف هذا الأصل لأنه تم دفع الزكاة عليه. يمكن الاطلاع عليه في السجل.',
        },
        { status: 403 }
      )
    }

    await prisma.$transaction([
      prisma.zakat_assets.update({
        where: { id },
        data: { status: 'DELETED', owned_until: new Date() },
      }),
      prisma.zakat_asset_history.create({
        data: {
          asset_id:    id,
          user_id:     userId,
          action:      'DELETED',
          snapshot:    assetSnapshot(asset),
          change_note: 'تم الحذف من قبل المستخدم',
        },
      }),
    ])

    return NextResponse.json({ success: true, message: 'تم حذف الأصل بنجاح' })
  } catch (error) {
    console.error('[DELETE /api/zakat/assets/[id]]', error)
    return NextResponse.json({ success: false, error: 'خطأ في حذف الأصل' }, { status: 500 })
  }
}
