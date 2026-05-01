import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/response';
import { retryMarsaAutoDebit } from '@/lib/marasi/mutations';
import { getCurrentUserId } from '@/lib/user';

/**
 * Re-attempt the latest failed/retrying auto-debit on this goal.
 * Used when the user clicks "إعادة المحاولة الآن" in the drill sheet.
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await ctx.params;
    const tx = await retryMarsaAutoDebit(userId, id);
    return NextResponse.json(tx);
  } catch (err) {
    return errorResponse(err);
  }
}
