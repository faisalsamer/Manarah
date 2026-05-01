'use client';

import { Bell } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Popover } from '@/components/ui/Popover';
import { useNotifications } from '@/hooks/expenses/useNotifications';
import { useMarasiNotifications } from '@/hooks/marasi/useMarasiNotifications';
import {
  compareFeedItemsDesc,
  type NotificationFeedItem,
} from '@/lib/notifications/types';
import { NotificationPanel } from './NotificationPanel';

/**
 * Global notification bell that lives in the app header. Merges streams from
 * every module (expenses + marasi) into one chronological feed.
 *
 * Both modules' notifications carry a `context` snapshot (joined goal /
 * expense / transaction fields) baked in by the API — so the bell doesn't
 * need to fetch goals/expenses/transactions separately to render. We pass
 * `undefined` for the legacy domain-object fields on the FeedItem; the
 * visuals helpers fall back to `notif.context`.
 */
export function NotificationBell() {
  const expenseNotifs = useNotifications();
  const marsaNotifs = useMarasiNotifications();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // ── Merge into one chronological feed ──────────────────────
  const items: NotificationFeedItem[] = useMemo(() => {
    const fromExpenses: NotificationFeedItem[] = expenseNotifs.data.map((n) => ({
      source: 'expenses',
      notification: n,
      expense: undefined,
      transaction: undefined,
    }));

    const fromMarasi: NotificationFeedItem[] = marsaNotifs.data.map((n) => ({
      source: 'marasi',
      notification: n,
      marsa: undefined,
      transaction: undefined,
    }));

    return [...fromExpenses, ...fromMarasi].sort(compareFeedItemsDesc);
  }, [expenseNotifs.data, marsaNotifs.data]);

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
      void marsaNotifs.markRead(id);
    }
    setOpen(false);
  };

  const handleMarkAllRead = () => {
    void expenseNotifs.markAllRead();
    void marsaNotifs.markAllRead();
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
