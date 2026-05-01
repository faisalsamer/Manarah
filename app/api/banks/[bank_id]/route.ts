import { NextResponse } from 'next/server'
import { getBankById } from '@/lib/data/banks'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/user'
import { checkBankDependencies } from '@/lib/bank-dependencies'

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

// PATCH /api/banks/[bank_id] - soft-disconnect the bank for the current user.
// Checks all active accounts under the bank for blocking dependencies first.
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ bank_id: string }> },
) {
  try {
    const { bank_id } = await params
    const userId = await getCurrentUserId()

    const bankRow = await prisma.banks.findFirst({
      where: { user_id: userId, bank_id, is_connected: true },
    })

    if (!bankRow) {
      return NextResponse.json(
        { success: false, error: 'البنك غير موجود أو غير مربوط' },
        { status: 404 },
      )
    }

    const depCheck = await checkBankDependencies(bankRow.id)

    if (depCheck.blocked) {
      return NextResponse.json(
        {
          success: false,
          blocked: true,
          blockedAccounts: depCheck.blockedAccounts,
        },
        { status: 409 },
      )
    }

    await prisma.banks.update({
      where: { id: bankRow.id },
      data: { is_connected: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PATCH /api/banks/[bank_id]]', error)
    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
  }
}
