/**
 * Cross-module notification types.
 *
 * The global notification bell merges streams from multiple modules (expenses,
 * marasi, …). Each item is wrapped in a `FeedItem` that carries a `source`
 * discriminator plus the resolved domain objects, so the renderer can pick
 * the right visuals/link builder without re-querying.
 */

import type { ExpenseVM, TransactionVM } from '@/lib/expenses/types';
import type { ExpenseNotificationVM } from '@/lib/expenses/notifications/types';
import type { MarsaTransactionVM, MarsaVM } from '@/lib/marasi/types';
import type { MarsaNotificationVM } from '@/lib/marasi/notifications/types';

export type NotificationFeedItem =
  | {
      source: 'expenses';
      notification: ExpenseNotificationVM;
      expense: ExpenseVM | undefined;
      transaction: TransactionVM | undefined;
    }
  | {
      source: 'marasi';
      notification: MarsaNotificationVM;
      marsa: MarsaVM | undefined;
      transaction: MarsaTransactionVM | undefined;
    };

/** Unread predicate that works for either source. */
export const isUnread = (item: NotificationFeedItem): boolean =>
  !item.notification.readAt;

/** Sort key — most recent first. */
export const compareFeedItemsDesc = (
  a: NotificationFeedItem,
  b: NotificationFeedItem,
): number =>
  new Date(b.notification.sentAt).getTime() -
  new Date(a.notification.sentAt).getTime();
