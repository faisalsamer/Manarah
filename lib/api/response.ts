import 'server-only';

import { NextResponse } from 'next/server';
import { MutationError } from '@/lib/expenses/mutations';

const errorStatus: Record<MutationError['code'], number> = {
  not_found: 404,
  invalid_input: 400,
  account_not_found: 404,
  insufficient_funds: 400,
  already_resolved: 409,
};

/**
 * Map a thrown error to a JSON response. Use in route handlers as:
 *   try { ... } catch (err) { return errorResponse(err); }
 *
 * Known `MutationError`s map to their 4xx status with a stable `code` field
 * the client can switch on. Anything else becomes a 500 with no leak.
 */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof MutationError) {
    return NextResponse.json(
      { error: err.code, message: err.message },
      { status: errorStatus[err.code] },
    );
  }
  console.error('[api]', err);
  return NextResponse.json(
    { error: 'internal_error', message: 'حدث خطأ غير متوقع' },
    { status: 500 },
  );
}
