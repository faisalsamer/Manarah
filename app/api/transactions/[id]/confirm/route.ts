import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/response';
import { confirmTransaction } from '@/lib/expenses/mutations';
import { getCurrentUserId } from '@/lib/user';

interface ConfirmBody {
  amount: string;
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await ctx.params;
    const body = (await req.json()) as ConfirmBody;
    if (typeof body.amount !== 'string') {
      return NextResponse.json(
        { error: 'invalid_input', message: 'amount must be a string' },
        { status: 400 },
      );
    }
    const updated = await confirmTransaction(userId, id, body.amount);
    return NextResponse.json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}
