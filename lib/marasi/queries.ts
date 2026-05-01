import 'server-only';

import { prisma } from '../prisma';
import {
  toMarsaNotificationVM,
  toMarsaTransactionVM,
  toMarsaVM,
} from './mappers';
import type { MarsaTransactionVM, MarsaVM } from './types';
import type { MarsaNotificationVM } from './notifications/types';

// ─── Marsa goals ─────────────────────────────────────────────
export async function listMarasi(userId: string): Promise<MarsaVM[]> {
  const rows = await prisma.marasi.findMany({
    where: { user_id: userId },
    include: {
      accounts: { include: { banks: true } },
      accounts_marasi_release_account_idToaccounts: {
        include: { banks: true },
      },
    },
    orderBy: { created_at: 'desc' },
  });
  return rows.map(toMarsaVM);
}

export async function getMarsa(
  userId: string,
  marsaId: string,
): Promise<MarsaVM | null> {
  const row = await prisma.marasi.findFirst({
    where: { id: marsaId, user_id: userId },
    include: {
      accounts: { include: { banks: true } },
      accounts_marasi_release_account_idToaccounts: {
        include: { banks: true },
      },
    },
  });
  return row ? toMarsaVM(row) : null;
}

// ─── Marsa transactions ──────────────────────────────────────
export async function listMarasiTransactions(
  userId: string,
  opts: { marsaId?: string } = {},
): Promise<MarsaTransactionVM[]> {
  const rows = await prisma.marasi_transactions.findMany({
    where: {
      user_id: userId,
      ...(opts.marsaId ? { marsa_id: opts.marsaId } : {}),
    },
    include: {
      accounts: { include: { banks: true } },
      marasi_attempts: { orderBy: { at: 'asc' } },
    },
    orderBy: [
      // Most recent first — match the ledger's display order.
      { executed_at: { sort: 'desc', nulls: 'last' } },
      { scheduled_for: { sort: 'desc', nulls: 'last' } },
      { created_at: 'desc' },
    ],
  });
  return rows.map(toMarsaTransactionVM);
}

// ─── Marsa notifications ─────────────────────────────────────
export async function listMarasiNotifications(
  userId: string,
  opts: { unreadOnly?: boolean; limit?: number } = {},
): Promise<MarsaNotificationVM[]> {
  const rows = await prisma.marasi_notifications.findMany({
    where: {
      user_id: userId,
      ...(opts.unreadOnly ? { read_at: null } : {}),
    },
    include: {
      marasi: true,
      marasi_transactions: true,
    },
    orderBy: { sent_at: 'desc' },
    ...(opts.limit ? { take: opts.limit } : {}),
  });
  return rows.map(toMarsaNotificationVM);
}
