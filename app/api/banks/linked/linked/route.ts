import { NextResponse } from 'next/server'
import { getMaskedIban } from '@/lib/data/banks'
import { getAccountsLive } from '@/lib/bank-api'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/user'

// GET /api/banks/linked
// Returns all connected banks with their accounts for the current user.
// Balances come from the bank API (JSON for now), not the DB column.
export async function GET() {
  const userId = await getCurrentUserId()

  const rows = await prisma.banks.findMany({
    where: { user_id: userId, is_connected: true },
    include: { accounts: true },
    orderBy: { connected_at: 'asc' },
  })

  const pairs = rows.flatMap((row) =>
    row.accounts
      .filter((acc) => acc.is_active)
      .map((acc) => ({ bankId: row.bank_id, accountId: acc.account_id })),
  )
  const liveMap = await getAccountsLive(pairs)

  const linked = rows.map((row) => {
    const activeAccounts = row.accounts
      .filter((acc) => acc.is_active)
      .map((acc) => {
        const live = liveMap.get(`${row.bank_id}:${acc.account_id}`)
        return {
          account_id: acc.account_id,
          account_type: acc.account_type,
          account_name: acc.account_name ?? '',
          iban: acc.iban ? getMaskedIban(acc.iban) : acc.account_number,
          balance: live?.available_balance ?? Number(acc.balance),
          currency: live?.currency ?? acc.currency,
          is_primary: acc.is_primary,
          status: 'active',
        }
      })

    return {
      bank_id: row.bank_id,
      bank_name: row.bank_name,
      bank_name_ar: row.bank_name_ar ?? row.bank_name,
      bank_code: row.bank_code ?? row.bank_id.toUpperCase(),
      type: row.bank_type ?? 'Commercial',
      logo_url: row.logo_url ?? undefined,
      accounts: activeAccounts,
      total_balance: activeAccounts.reduce((sum, acc) => sum + acc.balance, 0),
      linked_at: row.connected_at?.toISOString() ?? row.created_at.toISOString(),
    }
  })

  return NextResponse.json(linked)
}
