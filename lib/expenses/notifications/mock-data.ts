/**
 * Seed in-app notifications, mirroring the `expense_notifications` table.
 * Each row is anchored to a transaction id from `lib/expenses/mock-data.ts`.
 * Delete this file once the API is wired and notifications come from the DB.
 */

import type { ExpenseNotificationVM } from './types';

export const MOCK_NOTIFICATIONS: ExpenseNotificationVM[] = [
  // Most recent first
  {
    id: 'n-1',
    type: 'all_retries_exhausted',
    channel: 'in_app',
    transactionId: 't6', // exp-2 office rent failed
    sentAt: '2026-03-01T17:00:30+03:00',
    readAt: null,
    createdAt: '2026-03-01T17:00:30+03:00',
    context: null,
  },
  {
    id: 'n-2',
    type: 'awaiting_confirmation',
    channel: 'in_app',
    transactionId: 't9', // exp-3 electricity, variable, awaiting amount
    sentAt: '2026-04-28T10:30:00+03:00',
    readAt: null,
    createdAt: '2026-04-28T10:30:00+03:00',
    context: null,
  },
  {
    id: 'n-3',
    type: 'awaiting_confirmation',
    channel: 'in_app',
    transactionId: 't19', // exp-5 freelancer manual mode
    sentAt: '2026-04-15T11:00:00+03:00',
    readAt: null,
    createdAt: '2026-04-15T11:00:00+03:00',
    context: null,
  },
  {
    id: 'n-4',
    type: 'payment_failed',
    channel: 'in_app',
    transactionId: 't13', // exp-4 spotify, retry in progress
    sentAt: '2026-04-12T12:00:18+03:00',
    readAt: '2026-04-12T13:30:00+03:00',
    createdAt: '2026-04-12T12:00:18+03:00',
    context: null,
  },
  {
    id: 'n-5',
    type: 'payment_succeeded',
    channel: 'in_app',
    transactionId: 't1', // exp-1 netflix succeeded
    sentAt: '2026-04-05T09:00:14+03:00',
    readAt: '2026-04-05T20:12:00+03:00',
    createdAt: '2026-04-05T09:00:14+03:00',
    context: null,
  },
  {
    id: 'n-6',
    type: 'auto_skipped',
    channel: 'in_app',
    transactionId: 't11', // exp-3 electricity skipped
    sentAt: '2026-02-28T08:42:11+03:00',
    readAt: '2026-03-01T07:00:00+03:00',
    createdAt: '2026-02-28T08:42:11+03:00',
    context: null,
  },
  {
    id: 'n-7',
    type: 'upcoming_payment',
    channel: 'in_app',
    transactionId: 't19', // exp-5 freelancer upcoming
    sentAt: '2026-04-14T11:00:00+03:00',
    readAt: '2026-04-14T18:00:00+03:00',
    createdAt: '2026-04-14T11:00:00+03:00',
    context: null,
  },
];
