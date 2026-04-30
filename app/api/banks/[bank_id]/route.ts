import { NextResponse } from 'next/server'
import { getBankById } from '@/lib/data/banks'

// GET /api/banks/[bank_id] - one supported bank, without customer records.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bank_id: string }> },
) {
  const { bank_id } = await params
  const bank = getBankById(bank_id)

  if (!bank) {
    return NextResponse.json({ error: 'البنك غير موجود' }, { status: 404 })
  }

  const { customers, ...safeBank } = bank

  return NextResponse.json({
    ...safeBank,
    accounts_count: customers.reduce((count, customer) => count + customer.accounts.length, 0),
    total_balance: customers.reduce((sum, customer) => sum + customer.total_balance, 0),
  })
}
