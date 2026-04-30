import { NextResponse } from 'next/server'
import { getAllTransactions } from '@/lib/data/transactions'

// GET /api/transactions?limit=N
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limitParam = searchParams.get('limit')

  const txns = getAllTransactions()
  const result = limitParam ? txns.slice(0, parseInt(limitParam, 10)) : txns

  return NextResponse.json(result)
}
