import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/response';
import { releaseMarsa } from '@/lib/marasi/mutations';
import { getCurrentUserId } from '@/lib/user';

interface ReleaseBody {
  /** "release" — goal is `reached`, just withdraw funds.
   *  "cancel"  — goal is `active`, terminate AND withdraw funds. */
  mode: 'release' | 'cancel';
  destinationBankId: string;
  destinationAccountId: string;
}

/**
 * Single endpoint for both flows because they're the same write — only the
 * pre-condition check differs (status='reached' vs 'active'). The mode is
 * carried in the body so the route signature stays uniform.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await ctx.params;
    const body = (await req.json()) as ReleaseBody;

    if (body.mode !== 'release' && body.mode !== 'cancel') {
      return NextResponse.json(
        { error: 'invalid_input', message: 'mode must be "release" or "cancel"' },
        { status: 400 },
      );
    }
    if (
      typeof body.destinationBankId !== 'string' ||
      typeof body.destinationAccountId !== 'string'
    ) {
      return NextResponse.json(
        { error: 'invalid_input', message: 'destinationBankId and destinationAccountId required' },
        { status: 400 },
      );
    }

    const goal = await releaseMarsa(userId, id, {
      mode: body.mode,
      destinationBankId: body.destinationBankId,
      destinationAccountId: body.destinationAccountId,
    });
    return NextResponse.json(goal);
  } catch (err) {
    return errorResponse(err);
  }
}
