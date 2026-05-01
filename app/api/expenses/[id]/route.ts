import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/response';
import { deleteExpense } from '@/lib/expenses/mutations';
import { getCurrentUserId } from '@/lib/user';

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await ctx.params;
    await deleteExpense(userId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
