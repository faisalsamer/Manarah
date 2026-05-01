import type { TransactionVM } from '../types';
import type { ExpenseNotificationVM } from './types';

/**
 * Map a notification to the URL the user lands on when they click it.
 *
 * Query params used by the expenses page:
 *   tab=recurring|history|action  → which tab to open
 *   tx=<transaction_id>           → highlight this transaction (Action / History)
 *   expense=<expense_id>          → open the drill sheet for this expense
 *
 * `tx` is optional and only used by the cross-module feed bell which resolves
 * the linked transaction client-side. When the API hands us `notif.context`
 * we read the expense id from there for upcoming_payment.
 */
export function notificationLink(
  notif: ExpenseNotificationVM,
  tx?: TransactionVM,
): string {
  const txParam = notif.transactionId ? `&tx=${notif.transactionId}` : '';

  switch (notif.type) {
    case 'payment_failed':
    case 'all_retries_exhausted':
    case 'awaiting_confirmation':
      return `/expenses?tab=action${txParam}`;

    case 'auto_skipped':
    case 'payment_succeeded':
      return `/expenses?tab=history${txParam}`;

    case 'upcoming_payment': {
      const expenseId = notif.context?.expenseId ?? tx?.expenseId;
      return expenseId ? `/expenses?expense=${expenseId}` : '/expenses';
    }
  }
}
