'use client';

import { Bell, CheckCheck } from 'lucide-react';
import type { NotificationFeedItem } from '@/lib/notifications/types';
import { NotificationItem } from './NotificationItem';

const panelLabels = {
  title: 'الإشعارات',
  unreadSuffix: 'غير مقروءة',
  markAllRead: 'تعليم الكل كمقروء',
  emptyTitle: 'لا توجد إشعارات',
  emptyBody: 'الأحداث المهمة ستظهر هنا.',
} as const;

export interface NotificationPanelProps {
  items: NotificationFeedItem[];
  onItemClick: (id: string) => void;
  onMarkAllRead: () => void;
}

export function NotificationPanel({
  items,
  onItemClick,
  onMarkAllRead,
}: NotificationPanelProps) {
  const unreadCount = items.filter((i) => !i.notification.readAt).length;

  return (
    <div className="flex flex-col w-[min(360px,calc(100vw-2rem))] max-h-120">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
        <div className="min-w-0">
          <div className="text-body-sm font-bold text-text-primary leading-tight">
            {panelLabels.title}
          </div>
          {unreadCount > 0 && (
            <div className="mt-0.5 text-micro text-text-muted">
              {unreadCount} {panelLabels.unreadSuffix}
            </div>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xs text-micro font-semibold text-primary-500 hover:bg-primary-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
          >
            <CheckCheck size={12} strokeWidth={2.5} />
            {panelLabels.markAllRead}
          </button>
        )}
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <span className="flex items-center justify-center size-12 rounded-full bg-surface text-text-muted mb-3">
            <Bell size={20} strokeWidth={1.75} />
          </span>
          <div className="text-body-sm font-semibold text-text-primary">
            {panelLabels.emptyTitle}
          </div>
          <div className="mt-1 text-caption text-text-muted">
            {panelLabels.emptyBody}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {items.map((item) => (
            <NotificationItem
              key={`${item.source}-${item.notification.id}`}
              item={item}
              onClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
