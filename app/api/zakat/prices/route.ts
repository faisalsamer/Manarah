// GET /api/zakat/prices
// Returns today's gold and silver prices in SAR with nisab values
// Cached in DB — safe to call on every page load

import { NextResponse } from 'next/server'
import { getTodayNisabPrices } from '@/lib/gold-api'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const prices = await getTodayNisabPrices()
    const response = NextResponse.json({ success: true, data: prices })
    response.headers.set('Cache-Control', 'no-store, max-age=0')
    return response
  } catch (error) {
    console.error('[GET /api/zakat/prices]', error)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب أسعار الذهب والفضة. حاول مجدداً.' },
      { status: 500 }
    )
  }
}
