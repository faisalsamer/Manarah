import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/response';
import { getTransactionsStats } from '@/lib/expenses/queries';
import { getCurrentUserId } from '@/lib/user';

/**
 * Aggregate stats for the History view's three top tiles.
 * One SUM + two COUNTs server-side — avoids shipping the entire ledger
 * just to compute totals.
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const stats = await getTransactionsStats(userId);
    return NextResponse.json(stats);
  } catch (err) {
    return errorResponse(err);
  }
}
