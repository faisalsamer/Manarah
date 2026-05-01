import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/response';
import { markNotificationRead } from '@/lib/expenses/mutations';
import { getCurrentUserId } from '@/lib/user';

/** Mark a single notification as read (idempotent — won't change `read_at` if already set). */
export async function PATCH(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await ctx.params;
    const updated = await markNotificationRead(userId, id);
    return NextResponse.json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}
