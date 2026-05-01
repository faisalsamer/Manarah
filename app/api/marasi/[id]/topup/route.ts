import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/response';
import { topUpMarsa } from '@/lib/marasi/mutations';
import { getCurrentUserId } from '@/lib/user';

interface TopUpBody {
  amount: string;
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await ctx.params;
    const body = (await req.json()) as TopUpBody;
    if (typeof body.amount !== 'string') {
      return NextResponse.json(
        { error: 'invalid_input', message: 'amount must be a string' },
        { status: 400 },
      );
    }
    const tx = await topUpMarsa(userId, id, body.amount);
    return NextResponse.json(tx);
  } catch (err) {
    return errorResponse(err);
  }
}
