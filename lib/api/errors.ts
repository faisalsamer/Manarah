import 'server-only';

/**
 * Error codes thrown by mutation functions across modules.
 * Add new codes here when a new module needs them — `lib/api/response.ts`
 * maps them to HTTP status, and `lib/api/client.ts` surfaces them as
 * `ApiError.code` so the UI can switch on them for tailored toasts.
 */
export type ErrorCode =
  // Generic
  | 'not_found'
  | 'invalid_input'
  | 'account_not_found'
  | 'insufficient_funds'
  // Expenses
  | 'already_resolved'
  // Marasi
  | 'goal_terminated'
  | 'goal_already_withdrawn'
  | 'no_pending_attempt';

/**
 * Thin error type so route handlers can map known failure modes to
 * 4xx responses without leaking Prisma errors.
 */
export class MutationError extends Error {
  constructor(
    public code: ErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'MutationError';
  }
}
