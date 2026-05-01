/**
 * Notification view models for the Marāsi (savings) module.
 * Mirrors the `marasi_notifications` table + `marsa_notification_type` enum.
 */

import type { NotificationChannel } from '@/lib/expenses/notifications/types';

// Re-export so consumers can import everything from one place.
export type { NotificationChannel };

export type MarsaNotificationType =
  | 'deposit_failed'
  | 'all_retries_exhausted'
  | 'goal_reached'
  | 'milestone_reached'
  | 'upcoming_deposit';

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
}
