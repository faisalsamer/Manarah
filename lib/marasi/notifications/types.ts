/**
 * Notification view models for the Marāsi (savings) module.
 * Mirrors the `marasi_notifications` table + `marsa_notification_type` enum.
 */

import type { NotificationChannel } from '@/lib/expenses/notifications/types';
import type { MarsaFrequency, MarsaStatus } from '../types';

// Re-export so consumers can import everything from one place.
export type { NotificationChannel };

export type MarsaNotificationType =
  | 'deposit_failed'
  | 'all_retries_exhausted'
  | 'goal_reached'
  | 'milestone_reached'
  | 'upcoming_deposit';

/**
 * Denormalized snapshot of the linked Marsa + transaction at notification time.
 * The API returns this so the bell + panel can render rich messages without
 * fetching marasi/transactions separately. Optional because some notification
 * types (e.g. an `upcoming_deposit` queued before any tx row exists) may not
 * have a linked transaction.
 *
 * Mirrors `ExpenseNotificationContext` exactly in spirit.
 */
export interface MarsaNotificationContext {
  marsaId: string;
  marsaTitle: string;
  marsaTargetAmount: string;
  marsaCurrentBalance: string;
  marsaFrequency: MarsaFrequency;
  marsaStatus: MarsaStatus;
  /** Tx fields, when notification is anchored to a transaction. */
  txAmount: string | null;
  txFailureReason: string | null;
}

/** A single row from `marasi_notifications`, as the client consumes it. */
export interface MarsaNotificationVM {
  id: string;
  type: MarsaNotificationType;
  channel: NotificationChannel;
  /** FK to `marasi`. Always present for the types we generate today, but the
   *  schema allows null (e.g. an upcoming_deposit before any tx exists). */
  marsaId: string | null;
  /** FK to `marasi_transactions`. Nullable. */
  transactionId: string | null;
  /** ISO timestamptz with offset. */
  sentAt: string;
  /** Null until the user opens the notification. */
  readAt: string | null;
  createdAt: string;
  /** Joined snapshot — present whenever `marsaId` is set. */
  context: MarsaNotificationContext | null;
}
