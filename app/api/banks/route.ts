import { NextResponse } from 'next/server'
import { getAllBanks } from '@/lib/data/banks'

// GET /api/banks - all supported banks, without customer records.
export async function GET() {
  const payload = getAllBanks().map(({ customers, ...bank }) => ({
    ...bank,
    accounts_count: customers.reduce((count, customer) => count + customer.accounts.length, 0),
    total_balance: customers.reduce((sum, customer) => sum + customer.total_balance, 0),
  }))

  return NextResponse.json(payload)
}
