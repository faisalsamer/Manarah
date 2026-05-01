import type { MarsaNotificationVM } from './types';

/**
 * Map a marasi notification to the URL the user lands on when they click it.
 *
 * The `/marasi` page reads these query params:
 *   tab=active|reached|cancelled  → which tab to show
 *   marsa=<marsa_id>              → open the drill sheet for this Marsa
 *   tx=<transaction_id>           → highlight a specific ledger entry inside the drill sheet
 */
export function marsaNotificationLink(notif: MarsaNotificationVM): string {
  const marsaParam = notif.marsaId ? `&marsa=${notif.marsaId}` : '';
  const txParam = notif.transactionId ? `&tx=${notif.transactionId}` : '';

  switch (notif.type) {
    case 'deposit_failed':
    case 'all_retries_exhausted':
      // Active goal that needs attention — open the drill sheet.
      return `/marasi?tab=active${marsaParam}${txParam}`;

    case 'goal_reached':
      return `/marasi?tab=reached${marsaParam}${txParam}`;

    case 'milestone_reached':
    case 'upcoming_deposit':
      return `/marasi?tab=active${marsaParam}${txParam}`;
  }
}
