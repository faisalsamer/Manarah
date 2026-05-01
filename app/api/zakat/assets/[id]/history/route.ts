// GET /api/zakat/assets/[id]/history
// Returns full audit trail for a specific asset

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/user'

export const dynamic = 'force-dynamic'

export async function GET(
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

    const history = await prisma.zakat_asset_history.findMany({
      where:   { asset_id: id },
      orderBy: { action_at: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: {
        asset: {
          id:            asset.id,
          assetType:     asset.asset_type,
          customLabel:   asset.custom_label,
          status:        asset.status,
          currentAmount: Number(asset.amount),
        },
        history: (history as any[]).map((h) => ({
          id:         h.id,
          action:     h.action,
          actionAt:   h.action_at.toISOString(),
          changeNote: h.change_note,
          snapshot:   h.snapshot as Record<string, unknown>,
        })),
        totalChanges: history.length,
      },
    })
  } catch (error) {
    console.error('[GET /api/zakat/assets/[id]/history]', error)
    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
  }
}
