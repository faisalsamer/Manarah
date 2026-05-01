import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/response';
import { getTransactionsCounts } from '@/lib/expenses/queries';
import { getCurrentUserId } from '@/lib/user';

/**
 * Lightweight counts for tab badges. Two cheap COUNT(*) queries — way smaller
 * than fetching the full transactions list just to count them client-side.
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const counts = await getTransactionsCounts(userId);
    return NextResponse.json(counts);
  } catch (err) {
    return errorResponse(err);
  }
}
