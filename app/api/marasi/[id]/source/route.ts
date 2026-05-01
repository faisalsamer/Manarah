import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/response';
import { changeMarsaSource } from '@/lib/marasi/mutations';
import { getCurrentUserId } from '@/lib/user';

interface ChangeSourceBody {
  bankId: string;
  accountId: string;
}

/**
 * Change the bank account a goal's auto-debits pull from. Only valid for
 * active goals; pending auto-debit rows get reassigned in the same DB
 * transaction (see `changeMarsaSource`).
 */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await ctx.params;
    const body = (await req.json()) as ChangeSourceBody;
    if (typeof body.bankId !== 'string' || typeof body.accountId !== 'string') {
      return NextResponse.json(
        { error: 'invalid_input', message: 'bankId and accountId required' },
        { status: 400 },
      );
    }
    const goal = await changeMarsaSource(userId, id, body);
    return NextResponse.json(goal);
  } catch (err) {
    return errorResponse(err);
  }
}
