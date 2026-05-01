import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/response';
import { listTransactions } from '@/lib/expenses/queries';
import type { TransactionStatus } from '@/lib/expenses/types';
import { getCurrentUserId } from '@/lib/user';

const VALID_STATUSES: ReadonlySet<string> = new Set([
  'scheduled',
  'awaiting_confirmation',
  'processing',
  'retrying',
  'succeeded',
  'failed',
  'skipped',
]);

export async function GET(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const url = new URL(req.url);
    const expenseId = url.searchParams.get('expenseId') ?? undefined;

    // `statuses` may be repeated (`?statuses=failed&statuses=awaiting_confirmation`)
    // or comma-separated (`?statuses=failed,awaiting_confirmation`). Both work.
    const rawStatuses = url.searchParams.getAll('statuses');
    const statuses = rawStatuses
      .flatMap((s) => s.split(','))
      .map((s) => s.trim())
      .filter((s): s is TransactionStatus => VALID_STATUSES.has(s));

    const transactions = await listTransactions(userId, {
      expenseId,
      statuses: statuses.length > 0 ? statuses : undefined,
    });
    return NextResponse.json(transactions);
  } catch (err) {
    return errorResponse(err);
  }
}
