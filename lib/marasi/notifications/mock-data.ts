/**
 * Seed in-app notifications for the Marāsi module, mirroring `marasi_notifications`.
 * Each row anchors to a marsa and (optionally) a transaction from `lib/marasi/mock-data.ts`.
 * Delete this file once the API is wired and notifications come from the DB.
 */

import type { MarsaNotificationVM } from './types';

export const MOCK_MARASI_NOTIFICATIONS: MarsaNotificationVM[] = [
  // Most recent first.
  // ── Tokyo trip — auto-debit failed twice in a row, retries exhausted
  {
    id: 'mn-1',
    type: 'all_retries_exhausted',
    channel: 'in_app',
    marsaId: 'mr-2',
    transactionId: 'mt-10',
    sentAt: '2026-04-29T14:00:25+03:00',
    readAt: null,
    createdAt: '2026-04-29T14:00:25+03:00',
  },
  {
    id: 'mn-2',
    type: 'deposit_failed',
    channel: 'in_app',
    marsaId: 'mr-2',
    transactionId: 'mt-10',
    sentAt: '2026-04-29T09:00:18+03:00',
    readAt: '2026-04-29T19:42:00+03:00',
    createdAt: '2026-04-29T09:00:18+03:00',
  },
  // ── Emergency reserve — goal reached
  {
    id: 'mn-3',
    type: 'goal_reached',
    channel: 'in_app',
    marsaId: 'mr-3',
    transactionId: 'mt-20',
    sentAt: '2026-04-15T09:00:14+03:00',
    readAt: null,
    createdAt: '2026-04-15T09:00:14+03:00',
  },
  // ── Hajj — milestone (e.g. crossed 30%)
  {
    id: 'mn-4',
    type: 'milestone_reached',
    channel: 'in_app',
    marsaId: 'mr-1',
    transactionId: 'mt-1',
    sentAt: '2026-04-01T09:01:00+03:00',
    readAt: '2026-04-01T20:18:00+03:00',
    createdAt: '2026-04-01T09:01:00+03:00',
  },
  // ── Hajj — upcoming deposit reminder
  {
    id: 'mn-5',
    type: 'upcoming_deposit',
    channel: 'in_app',
    marsaId: 'mr-1',
    transactionId: 'mt-6',
    sentAt: '2026-04-30T09:00:00+03:00',
    readAt: null,
    createdAt: '2026-04-30T09:00:00+03:00',
  },
  // ── Camera — goal reached, then released (older)
  {
    id: 'mn-6',
    type: 'goal_reached',
    channel: 'in_app',
    marsaId: 'mr-4',
    transactionId: 'mt-31',
    sentAt: '2026-03-12T09:00:09+03:00',
    readAt: '2026-03-12T20:00:00+03:00',
    createdAt: '2026-03-12T09:00:09+03:00',
  },
];
