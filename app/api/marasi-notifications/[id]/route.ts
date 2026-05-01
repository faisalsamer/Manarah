import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/response';
import { markMarsaNotificationRead } from '@/lib/marasi/mutations';
import { getCurrentUserId } from '@/lib/user';

/** Mark a single marasi notification as read (idempotent). */
export async function PATCH(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await ctx.params;
    const updated = await markMarsaNotificationRead(userId, id);
    return NextResponse.json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}
