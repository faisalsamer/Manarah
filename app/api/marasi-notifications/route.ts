import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/response';
import { listMarasiNotifications } from '@/lib/marasi/queries';
import { markAllMarsaNotificationsRead } from '@/lib/marasi/mutations';
import { getCurrentUserId } from '@/lib/user';

export async function GET(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const url = new URL(req.url);
    const unreadOnly = url.searchParams.get('unread') === 'true';
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const notifications = await listMarasiNotifications(userId, { unreadOnly, limit });
    return NextResponse.json(notifications);
  } catch (err) {
    return errorResponse(err);
  }
}

/** Mark all unread marasi notifications as read. */
export async function PATCH() {
  try {
    const userId = await getCurrentUserId();
    const count = await markAllMarsaNotificationsRead(userId);
    return NextResponse.json({ updated: count });
  } catch (err) {
    return errorResponse(err);
  }
}
