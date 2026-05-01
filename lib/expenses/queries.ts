import 'server-only';

import { prisma } from '../prisma';
import { getAccountsLive } from '../bank-api';
import {
  toBankVM,
  toExpenseVM,
  toNotificationVM,
  toTransactionVM,
} from './mappers';
import type { BankVM, ExpenseVM, TransactionVM } from './types';
import type { ExpenseNotificationVM } from './notifications/types';

// ─── Linked banks (with live balances) ───────────────────────
export async function listLinkedBanks(userId: string): Promise<BankVM[]> {
  const bankRows = await prisma.banks.findMany({
    where: { user_id: userId, is_connected: true },
    include: {
      accounts: {
        orderBy: { is_primary: 'desc' },
      },
    },
    orderBy: { connected_at: 'asc' },
  });

  // Look up live balance for every linked (bank, account) pair in one read.
  const pairs = bankRows.flatMap((b) =>
    b.accounts.map((a) => ({ bankId: b.bank_id, accountId: a.account_id })),
  );
  const liveMap = await getAccountsLive(pairs);

  return bankRows.map((b) => {
    const perAccount = new Map<string, number>();
    for (const a of b.accounts) {
      const live = liveMap.get(`${b.bank_id}:${a.account_id}`);
      if (live) perAccount.set(a.account_id, live.available_balance);
    }
    return toBankVM(b, perAccount);
  });
}

// ─── Recurring expenses ──────────────────────────────────────
export async function listExpenses(userId: string): Promise<ExpenseVM[]> {
  const rows = await prisma.recurring_expenses.findMany({
    where: { user_id: userId, status: { not: 'archived' } },
    include: {
      accounts: {
        include: { banks: true },
      },
      // Pull the single most-recent "significant" transaction per expense so
      // the recurring view's cards can show last-run status without loading
      // the full ledger up front.
      payment_transactions: {
        where: {
          OR: [
            { executed_at: { not: null } },
            { status: { in: ['failed', 'retrying', 'awaiting_confirmation'] } },
          ],
        },
        orderBy: { scheduled_for: 'desc' },
        take: 1,
        include: { payment_attempts: { orderBy: { at: 'asc' } } },
      },
    },
    orderBy: { created_at: 'desc' },
  });
  return rows.map(toExpenseVM);
}

// ─── Transactions ────────────────────────────────────────────
export async function listTransactions(
  userId: string,
  opts: {
    expenseId?: string;
    /** Restrict to a fixed set of statuses (e.g. action-required tab). */
    statuses?: TransactionVM['status'][];
  } = {},
): Promise<TransactionVM[]> {
  const rows = await prisma.payment_transactions.findMany({
    where: {
      user_id: userId,
      ...(opts.expenseId ? { recurring_expense_id: opts.expenseId } : {}),
      ...(opts.statuses && opts.statuses.length > 0 ? { status: { in: opts.statuses } } : {}),
    },
    include: {
      payment_attempts: { orderBy: { at: 'asc' } },
    },
    orderBy: { scheduled_for: 'desc' },
  });
  return rows.map(toTransactionVM);
}

/**
 * Server-side paginated list — used by the History view so we don't ship
 * the full ledger to the client. Returns the requested slice plus the
 * total count for the (optionally filtered) set so the UI can render
 * "Showing X–Y of Z" + correct page count.
 */
export interface TransactionsPage {
  items: TransactionVM[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listTransactionsPage(
  userId: string,
  opts: {
    page: number;
    pageSize: number;
    /** Filter by status, or `undefined` for "all". */
    status?: TransactionVM['status'];
    expenseId?: string;
  },
): Promise<TransactionsPage> {
  const where = {
    user_id: userId,
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.expenseId ? { recurring_expense_id: opts.expenseId } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.payment_transactions.findMany({
      where,
      include: { payment_attempts: { orderBy: { at: 'asc' } } },
      orderBy: { scheduled_for: 'desc' },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
    }),
    prisma.payment_transactions.count({ where }),
  ]);
  return {
    items: rows.map(toTransactionVM),
    total,
    page: opts.page,
    pageSize: opts.pageSize,
  };
}

// ─── Counts (cheap aggregates for tab badges) ────────────────
export interface TransactionsCounts {
  /** Rows with `executed_at` not null — anything that physically debited. */
  executed: number;
  /** failed + awaiting_confirmation — drives the "تحتاج إجراء" tab badge. */
  actionRequired: number;
}

export async function getTransactionsCounts(userId: string): Promise<TransactionsCounts> {
  const [executed, actionRequired] = await Promise.all([
    prisma.payment_transactions.count({
      where: { user_id: userId, executed_at: { not: null } },
    }),
    prisma.payment_transactions.count({
      where: {
        user_id: userId,
        status: { in: ['failed', 'awaiting_confirmation'] },
      },
    }),
  ]);
  return { executed, actionRequired };
}

// ─── Stats (history view's three top tiles) ──────────────────
export interface TransactionsStats {
  /** Sum of `amount` over `succeeded` rows, as a string for decimal precision. */
  totalPaid: string;
  succeededCount: number;
  failedCount: number;
}

export async function getTransactionsStats(userId: string): Promise<TransactionsStats> {
  const [agg, succeededCount, failedCount] = await Promise.all([
    prisma.payment_transactions.aggregate({
      where: { user_id: userId, status: 'succeeded', amount: { not: null } },
      _sum: { amount: true },
    }),
    prisma.payment_transactions.count({
      where: { user_id: userId, status: 'succeeded' },
    }),
    prisma.payment_transactions.count({
      where: { user_id: userId, status: 'failed' },
    }),
  ]);
  return {
    totalPaid: agg._sum.amount ? agg._sum.amount.toString() : '0',
    succeededCount,
    failedCount,
  };
}

// ─── Notifications ───────────────────────────────────────────
export async function listNotifications(
  userId: string,
  opts: { unreadOnly?: boolean; limit?: number } = {},
): Promise<ExpenseNotificationVM[]> {
  const rows = await prisma.expense_notifications.findMany({
    where: {
      user_id: userId,
      ...(opts.unreadOnly ? { read_at: null } : {}),
    },
    include: {
      payment_transactions: {
        include: { recurring_expenses: true },
      },
    },
    orderBy: { sent_at: 'desc' },
    ...(opts.limit ? { take: opts.limit } : {}),
  });
  return rows.map(toNotificationVM);
}
