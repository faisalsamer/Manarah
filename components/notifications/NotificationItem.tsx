'use client';

import { ChevronLeft, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  buildNotificationDisplay,
  notificationVisuals,
} from '@/lib/expenses/notifications/visuals';
import { notificationLink } from '@/lib/expenses/notifications/link';
import { formatDate, formatTime } from '@/lib/expenses/utils';
import {
  buildMarsaNotificationDisplay,
  marsaNotificationVisuals,
  type NotificationTone,
} from '@/lib/marasi/notifications/visuals';
import { marsaNotificationLink } from '@/lib/marasi/notifications/link';
import type { NotificationFeedItem } from '@/lib/notifications/types';

const toneStyles: Record<NotificationTone, { iconBg: string; iconColor: string }> = {
  danger:  { iconBg: 'bg-danger-light',  iconColor: 'text-danger' },
  warning: { iconBg: 'bg-warning-light', iconColor: 'text-warning' },
  info:    { iconBg: 'bg-info-light',    iconColor: 'text-info' },
  success: { iconBg: 'bg-success-light', iconColor: 'text-success' },
  neutral: { iconBg: 'bg-surface',       iconColor: 'text-text-secondary' },
};

interface ResolvedDisplay {
  Icon: LucideIcon;
  tone: NotificationTone;
  title: string;
  body: ReactNode;
  href: string;
}

const resolve = (item: NotificationFeedItem): ResolvedDisplay => {
  if (item.source === 'expenses') {
    const visual = notificationVisuals[item.notification.type];
    const display = buildNotificationDisplay(
      item.notification,
      item.expense,
      item.transaction,
    );
    return {
      Icon: visual.icon,
      tone: visual.tone,
      title: display.title,
      body: display.body,
      href: notificationLink(item.notification, item.transaction),
    };
  }
  const visual = marsaNotificationVisuals[item.notification.type];
  const display = buildMarsaNotificationDisplay(
    item.notification,
    item.marsa,
    item.transaction,
  );
  return {
    Icon: visual.icon,
    tone: visual.tone,
    title: display.title,
    body: display.body,
    href: marsaNotificationLink(item.notification),
  };
};

export interface NotificationItemProps {
  item: NotificationFeedItem;
  onClick: (id: string) => void;
}

export function NotificationItem({ item, onClick }: NotificationItemProps) {
  const { Icon, tone: toneKey, title, body, href } = resolve(item);
  const tone = toneStyles[toneKey];
  const isUnread = !item.notification.readAt;

  return (
    <Link
      href={href}
      onClick={() => onClick(item.notification.id)}
      className={[
        'group flex items-start gap-3 p-4',
        'transition-colors duration-[150ms]',
        'border-b border-border last:border-b-0',
        'hover:bg-surface',
        'focus-visible:outline-none focus-visible:bg-surface',
        isUnread ? 'bg-primary-50/40' : 'bg-card-bg',
      ].join(' ')}
    >
      {/* Unread dot — sits on the visual start (right in RTL) */}
      <span
        aria-hidden
        className={[
          'mt-2 size-1.5 shrink-0 rounded-full',
          isUnread ? 'bg-primary-400' : 'bg-transparent',
        ].join(' ')}
      />

      {/* Icon chip */}
      <span
        aria-hidden
        className={[
          'shrink-0 flex items-center justify-center size-9 rounded-full',
          tone.iconBg,
          tone.iconColor,
        ].join(' ')}
      >
        <Icon size={16} strokeWidth={2.25} />
      </span>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span
            className={[
              'truncate text-body-sm leading-snug',
              isUnread
                ? 'font-semibold text-text-primary'
                : 'font-medium text-text-primary',
            ].join(' ')}
          >
            {title}
          </span>
        </div>
        <p className="mt-0.5 text-caption text-text-secondary leading-snug line-clamp-2">
          {body}
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-micro text-text-muted font-numbers">
          <span>{formatDate(item.notification.sentAt)}</span>
          <span aria-hidden>·</span>
          <span>{formatTime(item.notification.sentAt)}</span>
        </div>
      </div>

      <ChevronLeft
        size={14}
        aria-hidden
        className="mt-3 shrink-0 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </Link>
  );
}
