import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/response';
import { listMarasiTransactions } from '@/lib/marasi/queries';
import { getCurrentUserId } from '@/lib/user';

/**
 * Marasi ledger entries.
 * Filterable via `?marsaId=` (used by the drill sheet to scope to one goal).
 */
export async function GET(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const url = new URL(req.url);
    const marsaId = url.searchParams.get('marsaId') ?? undefined;
    const transactions = await listMarasiTransactions(userId, { marsaId });
    return NextResponse.json(transactions);
  } catch (err) {
    return errorResponse(err);
  }
}
