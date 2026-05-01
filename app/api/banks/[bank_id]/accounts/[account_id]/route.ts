import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/user'
import { checkAccountDependencies } from '@/lib/bank-dependencies'

// PATCH /api/banks/[bank_id]/accounts/[account_id]
// Soft-disconnects a single account under the given bank.
// account_id here is the logical account_id string (e.g. "ACC001"), not the DB uuid.
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ bank_id: string; account_id: string }> },
) {
  try {
    const { bank_id, account_id } = await params
    const userId = await getCurrentUserId()

    // Verify ownership: bank must belong to this user and be connected
    const bankRow = await prisma.banks.findFirst({
      where: { user_id: userId, bank_id, is_connected: true },
    })

    if (!bankRow) {
      return NextResponse.json(
        { success: false, error: 'البنك غير موجود أو غير مربوط' },
        { status: 404 },
      )
    }

    // Verify the account belongs to this bank and is currently active
    const accountRow = await prisma.accounts.findFirst({
      where: { bank_id: bankRow.id, account_id, is_active: true },
    })

    if (!accountRow) {
      return NextResponse.json(
        { success: false, error: 'الحساب غير موجود أو مفصول بالفعل' },
        { status: 404 },
      )
    }

    // Dependency check
    const depCheck = await checkAccountDependencies(accountRow.id)

    if (depCheck.blocked) {
      return NextResponse.json(
        {
          success: false,
          blocked: true,
          blockers: depCheck.blockers,
        },
        { status: 409 },
      )
    }

    // Soft-disconnect the account
    await prisma.accounts.update({
      where: { id: accountRow.id },
      data: { is_active: false },
    })

    // If this was the last active account under the bank, also disconnect the bank
    const remainingActive = await prisma.accounts.count({
      where: { bank_id: bankRow.id, is_active: true },
    })

    let bankAlsoDisconnected = false
    if (remainingActive === 0) {
      await prisma.banks.update({
        where: { id: bankRow.id },
        data: { is_connected: false },
      })
      bankAlsoDisconnected = true
    }

    return NextResponse.json({ success: true, bankAlsoDisconnected })
  } catch (error) {
    console.error('[PATCH /api/banks/[bank_id]/accounts/[account_id]]', error)
    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
  }
}
