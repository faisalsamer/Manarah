import { NextResponse } from 'next/server'
import { getBankById, getMaskedIban, verifyCredentials } from '@/lib/data/banks'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/user'

// POST /api/banks/[bank_id]/connect
// Body: { username: string, password: string }
// Demo mode: any password is accepted; username must exist for that bank.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ bank_id: string }> },
) {
  const { bank_id } = await params

  let body: { username?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 })
  }

  const { username, password } = body

  if (!username || !password) {
    return NextResponse.json(
      { error: 'يرجى إدخال اسم المستخدم وكلمة المرور' },
      { status: 400 },
    )
  }

  const customer = verifyCredentials(bank_id, username, password)

  if (!customer) {
    return NextResponse.json(
      { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
      { status: 401 },
    )
  }

  const [userId, bankInfo] = await Promise.all([
    getCurrentUserId(),
    Promise.resolve(getBankById(bank_id)),
  ])

  // Upsert the bank row — unique on (user_id, bank_id) so re-linking just refreshes it
  const bankRow = await prisma.banks.upsert({
    where: { user_id_bank_id: { user_id: userId, bank_id } },
    update: {
      is_connected: true,
      connected_at: new Date(),
      bank_name: bankInfo?.bank_name ?? bank_id,
      bank_name_ar: bankInfo?.bank_name_ar ?? null,
      bank_code: bankInfo?.bank_code ?? null,
      logo_url: bankInfo?.logo_url ?? null,
      bank_type: bankInfo?.type ?? null,
    },
    create: {
      user_id: userId,
      bank_id,
      bank_name: bankInfo?.bank_name ?? bank_id,
      bank_name_ar: bankInfo?.bank_name_ar ?? null,
      bank_code: bankInfo?.bank_code ?? null,
      logo_url: bankInfo?.logo_url ?? null,
      bank_type: bankInfo?.type ?? null,
      is_connected: true,
      connected_at: new Date(),
    },
  })

  // Replace accounts with fresh data from the bank
  await prisma.accounts.deleteMany({ where: { bank_id: bankRow.id } })
  await prisma.accounts.createMany({
    data: customer.accounts.map((account) => ({
      bank_id: bankRow.id,
      account_id: account.account_id,
      account_number: account.account_number,
      account_type: account.account_type,
      account_name: account.account_name,
      iban: account.iban,
      is_primary: account.is_primary,
      balance: account.balance,
      currency: account.currency,
    })),
  })

  return NextResponse.json({
    success: true,
    message: 'تم ربط الحساب بنجاح',
    customer: {
      name: customer.full_name,
      email: customer.email,
      phone: customer.phone,
      accounts: customer.accounts.map((account) => ({
        account_id: account.account_id,
        account_type: account.account_type,
        account_name: account.account_name,
        iban: getMaskedIban(account.iban),
        full_iban: account.iban,
        balance: account.balance,
        currency: account.currency,
        is_primary: account.is_primary,
        status: account.status,
      })),
      total_balance: customer.total_balance,
    },
  })
}
