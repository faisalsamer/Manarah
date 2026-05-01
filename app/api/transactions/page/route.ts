import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/response';
import { listTransactionsPage } from '@/lib/expenses/queries';
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

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 10;

export async function GET(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const url = new URL(req.url);

    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
    const pageSize = Math.max(
      1,
      Math.min(
        MAX_PAGE_SIZE,
        parseInt(url.searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10) ||
          DEFAULT_PAGE_SIZE,
      ),
    );

    const statusParam = url.searchParams.get('status');
    const status =
      statusParam && VALID_STATUSES.has(statusParam)
        ? (statusParam as TransactionStatus)
        : undefined;

    const expenseId = url.searchParams.get('expenseId') ?? undefined;

    const result = await listTransactionsPage(userId, {
      page,
      pageSize,
      status,
      expenseId,
    });
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
