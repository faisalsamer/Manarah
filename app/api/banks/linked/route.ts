import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/response';
import { listLinkedBanks } from '@/lib/expenses/queries';
import { getCurrentUserId } from '@/lib/user';

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const banks = await listLinkedBanks(userId);
    return NextResponse.json(banks);
  } catch (err) {
    return errorResponse(err);
  }
}
