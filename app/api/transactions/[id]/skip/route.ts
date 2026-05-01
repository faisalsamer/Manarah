import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/response';
import { skipTransaction } from '@/lib/expenses/mutations';
import { getCurrentUserId } from '@/lib/user';

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await ctx.params;
    const updated = await skipTransaction(userId, id);
    return NextResponse.json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}
