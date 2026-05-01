import { prisma } from '@/lib/prisma'

export interface AccountBlockers {
  marasi: number
  recurring_expenses: number
  pending_payments: number
}

export interface AccountBlockerResult {
  blocked: boolean
  blockers: AccountBlockers
}

export interface BankBlockedAccount {
  account_id: string
  account_name: string
  blockers: AccountBlockers
}

export interface BankBlockerResult {
  blocked: boolean
  blockedAccounts: BankBlockedAccount[]
}

// Check if a single account (by DB uuid) has active dependencies in other modules.
export async function checkAccountDependencies(
  accountDbId: string,
): Promise<AccountBlockerResult> {
  const [marasi, recurringExpenses, pendingPayments] = await Promise.all([
    prisma.marasi.count({
      where: {
        account_id: accountDbId,
        status: { in: ['active', 'paused'] },
      },
    }),
    prisma.recurring_expenses.count({
      where: {
        account_id: accountDbId,
        status: { in: ['active', 'paused'] },
      },
    }),
    prisma.payment_transactions.count({
      where: {
        account_id: accountDbId,
        status: { in: ['scheduled', 'awaiting_confirmation', 'retrying'] },
      },
    }),
  ])

  const blockers: AccountBlockers = {
    marasi,
    recurring_expenses: recurringExpenses,
    pending_payments: pendingPayments,
  }

  return {
    blocked: marasi > 0 || recurringExpenses > 0 || pendingPayments > 0,
    blockers,
  }
}

// Check all active accounts under a bank (by banks.id DB uuid) for dependencies.
export async function checkBankDependencies(
  bankDbId: string,
): Promise<BankBlockerResult> {
  const accounts = await prisma.accounts.findMany({
    where: { bank_id: bankDbId, is_active: true },
    select: { id: true, account_id: true, account_name: true },
  })

  const results = await Promise.all(
    accounts.map(async (acc) => {
      const result = await checkAccountDependencies(acc.id)
      return { acc, result }
    }),
  )

  const blockedAccounts: BankBlockedAccount[] = results
    .filter(({ result }) => result.blocked)
    .map(({ acc, result }) => ({
      account_id: acc.account_id,
      account_name: acc.account_name ?? acc.account_id,
      blockers: result.blockers,
    }))

  return {
    blocked: blockedAccounts.length > 0,
    blockedAccounts,
  }
}
