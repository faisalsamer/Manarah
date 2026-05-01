import { NextResponse } from 'next/server';
import { runExpenseCycle } from '@/lib/expenses/orchestrator';

/**
 * The cron orchestrator entry point.
 *
 * pg_cron fires every 5 minutes → it calls a Postgres function (`run_expense_cycle`)
 * → that function uses `pg_net` to POST here with the `x-cron-secret` header.
 * This route runs the orchestrator (materialize cycles, charge due transactions,
 * retry, auto-skip, notify) — all in TypeScript so it can call the bank API +
 * email providers + anything else our codebase already does.
 *
 * To trigger a tick by hand (useful for dev):
 *   curl -X POST http://localhost:3000/api/cron/expenses \
 *        -H "x-cron-secret: $CRON_SECRET"
 */

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(req: Request) {
  if (!CRON_SECRET) {
    return NextResponse.json(
      { error: 'cron_not_configured', message: 'CRON_SECRET is not set' },
      { status: 500 },
    );
  }
  if (req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'invalid x-cron-secret' },
      { status: 401 },
    );
  }

  try {
    const stats = await runExpenseCycle();
    return NextResponse.json({
      ok: true,
      ranAt: new Date().toISOString(),
      ...stats,
    });
  } catch (err) {
    console.error('[cron]', err);
    return NextResponse.json(
      {
        error: 'cron_failed',
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
