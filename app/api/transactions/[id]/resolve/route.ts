import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/response';
import { resolveTransaction } from '@/lib/expenses/mutations';
import { getCurrentUserId } from '@/lib/user';

interface ResolveBody {
  bankId: string;
  accountId: string;
  updateLinked?: boolean;
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await ctx.params;
    const body = (await req.json()) as ResolveBody;
    if (typeof body.bankId !== 'string' || typeof body.accountId !== 'string') {
      return NextResponse.json(
        { error: 'invalid_input', message: 'bankId and accountId are required' },
        { status: 400 },
      );
    }
    const updated = await resolveTransaction(userId, id, {
      bankId: body.bankId,
      accountId: body.accountId,
      updateLinked: !!body.updateLinked,
    });
    return NextResponse.json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}
