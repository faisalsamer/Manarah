/**
 * Notification view models for the expenses module.
 * Mirrors the `expense_notifications` table + `expense_notification_type` enum.
 */

import type { AmountType, PaymentMode } from '../types';

export type ExpenseNotificationType =
  | 'payment_failed'
  | 'all_retries_exhausted'
  | 'awaiting_confirmation'
  | 'auto_skipped'
  | 'payment_succeeded'
  | 'upcoming_payment';

export type NotificationChannel = 'push' | 'email' | 'sms' | 'in_app';

/**
 * Denormalized snapshot of the linked transaction + expense at notification time.
 * The API returns this so the bell + panel can render rich messages without
 * fetching expenses/transactions separately. Optional because some notification
 * types (e.g. a future upcoming_payment that fires before a tx row exists)
 * may not have a linked transaction.
 */
export interface ExpenseNotificationContext {
  expenseId: string;
  expenseTitle: string;
  expenseAmountType: AmountType;
  expensePaymentMode: PaymentMode;
  txAmount: string | null;
  txScheduledFor: string;
  txFailureReason: string | null;
}

/** A single row from `expense_notifications`, as the client consumes it. */
export interface ExpenseNotificationVM {
  id: string;
  type: ExpenseNotificationType;
  channel: NotificationChannel;
  /** FK to payment_transactions. Nullable in the schema (e.g. an upcoming_payment may
   *  fire before any transaction row exists for the cycle). */
  transactionId: string | null;
  /** ISO timestamptz with offset (built via lib/datetime). */
  sentAt: string;
  /** Null until the user opens the notification. */
  readAt: string | null;
  createdAt: string;
  /** Joined snapshot — present whenever `transactionId` is set. */
  context: ExpenseNotificationContext | null;
}
