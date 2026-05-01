// GET|POST /api/zakat/assets

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/user'
import { toRiyadhDateString } from '@/lib/date'

export const dynamic = 'force-dynamic'

const AssetSchema = z.object({
  assetType: z.preprocess(
    (value) => (typeof value === 'string' ? value.toUpperCase() : value),
    z.enum([
      'GOLD_SAVINGS', 'SILVER_SAVINGS', 'STOCKS',
      'CONFIRMED_DEBTS', 'TRADE_GOODS', 'CASH', 'CUSTOM',
    ])
  ),
  customLabel: z.string().optional(),
  description: z.string().optional(),
  amount:      z.number().positive('المبلغ يجب أن يكون أكبر من صفر'),
  currency:    z.string().default('SAR'),
  weightGrams: z.number().positive().optional(),
  karat:       z.number().refine((k) => [24, 22, 21, 18, 14, 12, 10, 9].includes(k)).optional(),
  ownedSince:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ غير صحيح'),
  ownedUntil:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).refine(
  (data) => data.assetType !== 'CUSTOM' || !!data.customLabel?.trim(),
  { message: 'يجب إدخال اسم الأصل المخصص', path: ['customLabel'] }
).refine(
  (data) => data.ownedSince <= toRiyadhDateString(),
  { message: 'تاريخ الامتلاك لا يمكن أن يكون في المستقبل', path: ['ownedSince'] }
)

function normalizeStatusFilter(status: string): string {
  return status.toUpperCase()
}

function normalizeAsset(a: any) {
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
  }
}

// ── GET /api/zakat/assets ─────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    const { searchParams } = new URL(req.url)

    const statusFilter = searchParams.get('status')
    const typeFilter   = searchParams.get('type')

    const where: Record<string, unknown> = { user_id: userId }

    if (statusFilter && statusFilter !== 'all') {
      where.status = normalizeStatusFilter(statusFilter)
    } else if (!statusFilter) {
      where.status = { in: ['ACTIVE', 'ZAKAT_PAID'] }
    }

    if (typeFilter) {
      where.asset_type = typeFilter.toUpperCase()
    }

    const assets = await prisma.zakat_assets.findMany({
      where,
      orderBy: [{ status: 'asc' }, { owned_since: 'desc' }],
      include: {
        zakat_asset_history: {
          orderBy: { action_at: 'desc' },
          take: 1,
        },
      },
    })

    const normalized = (assets as any[]).map(normalizeAsset)

    return NextResponse.json({
      success: true,
      data: normalized,
      meta: {
        total:     normalized.length,
        active:    normalized.filter((a) => a.status === 'ACTIVE').length,
        zakatPaid: normalized.filter((a) => a.status === 'ZAKAT_PAID').length,
      },
    })
  } catch (error) {
    console.error('[GET /api/zakat/assets]', error)
    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
  }
}

// ── POST /api/zakat/assets ────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    const body = await req.json()

    const parsed = AssetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    const asset = await prisma.zakat_assets.create({
      data: {
        user_id:      userId,
        asset_type:   data.assetType as any,
        custom_label: data.customLabel ?? null,
        description:  data.description ?? null,
        amount:       data.amount,
        currency:     data.currency,
        weight_grams: data.weightGrams ?? null,
        karat:        data.karat ?? null,
        owned_since:  new Date(data.ownedSince + 'T00:00:00+03:00'),
        owned_until:  data.ownedUntil
          ? new Date(data.ownedUntil + 'T00:00:00+03:00')
          : null,
        status: 'ACTIVE',
      },
    })

    await prisma.zakat_asset_history.create({
      data: {
        asset_id:    asset.id,
        user_id:     userId,
        action:      'CREATED',
        snapshot: {
          id: asset.id,
          user_id: asset.user_id,
          asset_type: asset.asset_type,
          custom_label: asset.custom_label,
          description: asset.description,
          amount: Number(asset.amount),
          currency: asset.currency,
          weight_grams: asset.weight_grams ? Number(asset.weight_grams) : null,
          karat: asset.karat,
          owned_since: asset.owned_since.toISOString(),
          owned_until: asset.owned_until?.toISOString() ?? null,
          status: asset.status,
        },
        change_note: null,
      },
    })

    return NextResponse.json({ success: true, data: normalizeAsset(asset) }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/zakat/assets]', error)
    return NextResponse.json({ success: false, error: 'خطأ في إضافة الأصل' }, { status: 500 })
  }
}
