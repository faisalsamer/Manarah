import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/response';
import { listNotifications } from '@/lib/expenses/queries';
import { markAllNotificationsRead } from '@/lib/expenses/mutations';
import { getCurrentUserId } from '@/lib/user';

export async function GET(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const url = new URL(req.url);
    const unreadOnly = url.searchParams.get('unread') === 'true';
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const notifications = await listNotifications(userId, { unreadOnly, limit });
    return NextResponse.json(notifications);
  } catch (err) {
    return errorResponse(err);
  }
}

/** Mark all unread notifications as read. */
export async function PATCH() {
  try {
    const userId = await getCurrentUserId();
    const count = await markAllNotificationsRead(userId);
    return NextResponse.json({ updated: count });
  } catch (err) {
    return errorResponse(err);
  }
}
