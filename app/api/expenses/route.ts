import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/response';
import { listExpenses } from '@/lib/expenses/queries';
import { createExpense } from '@/lib/expenses/mutations';
import { getCurrentUserId } from '@/lib/user';
import type { ExpenseDraft } from '@/lib/expenses/types';

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const expenses = await listExpenses(userId);
    return NextResponse.json(expenses);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    const draft = (await req.json()) as ExpenseDraft;
    const created = await createExpense(userId, draft);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
