import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/response';
import { listMarasi } from '@/lib/marasi/queries';
import { createMarsa } from '@/lib/marasi/mutations';
import { getCurrentUserId } from '@/lib/user';
import type { MarsaDraft } from '@/lib/marasi/types';

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const goals = await listMarasi(userId);
    return NextResponse.json(goals);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const draft = (await req.json()) as MarsaDraft;
    const created = await createMarsa(userId, draft);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
