'use client';

import { Bell } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Popover } from '@/components/ui/Popover';
import { useNotifications } from '@/hooks/expenses/useNotifications';
import { nowClientTimestamptz } from '@/lib/datetime';
import {
  MOCK_MARASI,
  MOCK_MARASI_TRANSACTIONS,
} from '@/lib/marasi/mock-data';
import { MOCK_MARASI_NOTIFICATIONS } from '@/lib/marasi/notifications/mock-data';
import type { MarsaNotificationVM } from '@/lib/marasi/notifications/types';
import {
  compareFeedItemsDesc,
  type NotificationFeedItem,
} from '@/lib/notifications/types';
import { NotificationPanel } from './NotificationPanel';

/**
 * Global notification bell that lives in the app header.
 *
 * - **Expenses** notifications come from `/api/notifications` via the
 *   `useNotifications` hook. The notifications carry a `context` snapshot
 *   (joined expense + transaction fields), so the bell doesn't need to fetch
 *   expenses/transactions separately to render them. We pass `undefined` for
 *   the legacy `expense` / `transaction` fields on the FeedItem — the visuals
 *   helpers fall back to `notif.context`.
 *
 * - **Marasi** notifications are still mocks — same pattern as before. When
 *   the marasi backend lands we'll swap to its hook and drop the mock imports.
 */
export function NotificationBell() {
  const expenseNotifs = useNotifications();
  const [marsaNotifs, setMarsaNotifs] =
    useState<MarsaNotificationVM[]>(MOCK_MARASI_NOTIFICATIONS);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // ── Merge into one chronological feed ──────────────────────
  const items: NotificationFeedItem[] = useMemo(() => {
    const marasiById = new Map(MOCK_MARASI.map((m) => [m.id, m]));
    const marasiTxById = new Map(
      MOCK_MARASI_TRANSACTIONS.map((t) => [t.id, t]),
    );

    const fromExpenses: NotificationFeedItem[] = expenseNotifs.data.map((n) => ({
      source: 'expenses',
      notification: n,
      expense: undefined,
      transaction: undefined,
    }));

    const fromMarasi: NotificationFeedItem[] = marsaNotifs.map((n) => ({
      source: 'marasi',
      notification: n,
      marsa: n.marsaId ? marasiById.get(n.marsaId) : undefined,
      transaction: n.transactionId ? marasiTxById.get(n.transactionId) : undefined,
    }));

    return [...fromExpenses, ...fromMarasi].sort(compareFeedItemsDesc);
  }, [expenseNotifs.data, marsaNotifs]);

  const unreadCount = useMemo(
    () => items.filter((i) => !i.notification.readAt).length,
    [items],
  );

  // ── Mutations ──────────────────────────────────────────────
  const handleItemClick = (id: string) => {
    const item = items.find((i) => i.notification.id === id);
    if (!item) return;
    if (item.source === 'expenses') {
      void expenseNotifs.markRead(id);
    } else {
      const now = nowClientTimestamptz();
      setMarsaNotifs((list) =>
        list.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: now } : n)),
      );
    }
    setOpen(false);
  };

  const handleMarkAllRead = () => {
    void expenseNotifs.markAllRead();
    const now = nowClientTimestamptz();
    setMarsaNotifs((list) =>
      list.map((n) => (n.readAt ? n : { ...n, readAt: now })),
    );
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="الإشعارات"
        aria-expanded={open}
        className={[
          'relative flex items-center justify-center size-9 rounded-sm',
          'bg-surface border border-border text-text-secondary',
          'transition-colors duration-150',
          'hover:bg-card-bg hover:border-border-strong hover:text-text-primary',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2',
        ].join(' ')}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            aria-hidden
            className="absolute top-1 left-1 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-danger text-white text-micro font-bold leading-none border-[1.5px] border-card-bg font-numbers"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <Popover
        open={open}
        onClose={() => setOpen(false)}
        triggerRef={triggerRef}
        side="bottom"
        align="end"
      >
        <NotificationPanel
          items={items}
          onItemClick={handleItemClick}
          onMarkAllRead={handleMarkAllRead}
        />
      </Popover>
    </div>
  );
}
