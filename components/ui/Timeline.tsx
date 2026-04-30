'use client';

import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';

export interface TimelineProps {
  children: ReactNode;
  className?: string;
}

export function Timeline({ children, className = '' }: TimelineProps) {
  return (
    <div
      className={[
        // RTL: rail sits on the right edge.
        'relative pr-6 font-arabic',
        className,
      ].join(' ')}
    >
      <div
        aria-hidden
        className="absolute right-2 top-2 bottom-2 w-px bg-border"
      />
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

export interface TimelineItemProps {
  icon?: ReactNode;
  iconColor?: string;
  title?: ReactNode;
  meta?: ReactNode;
  rightSlot?: ReactNode;
  details?: ReactNode;
  defaultOpen?: boolean;
  detailsLabel?: { open: ReactNode; close: ReactNode };
  className?: string;
  children?: ReactNode;
}

export function TimelineItem({
  icon,
  iconColor,
  title,
  meta,
  rightSlot,
  details,
  defaultOpen = false,
  detailsLabel = { open: 'عرض التفاصيل', close: 'إخفاء التفاصيل' },
  className = '',
  children,
}: TimelineItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const hasDetails = details !== undefined && details !== null;

  return (
    <div className={['relative pb-5 last:pb-0', className].join(' ')}>
      <div
        aria-hidden
        className="absolute -right-[18px] top-2 w-4 h-4 flex items-center justify-center bg-page-bg rounded-full"
        style={iconColor ? { color: iconColor } : undefined}
      >
        {icon}
      </div>
      <div className="bg-card-bg border border-border rounded-md overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 text-right">
              {title && (
                <div className="text-body font-semibold text-text-primary leading-snug">
                  {title}
                </div>
              )}
              {meta && (
                <div className="mt-1 text-caption text-text-secondary">
                  {meta}
                </div>
              )}
            </div>
            {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
          </div>
          {children && (
            <div className="mt-2 text-body-sm text-text-primary">
              {children}
            </div>
          )}
        </div>
        {hasDetails && (
          <>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className={[
                'w-full flex items-center justify-between gap-2 px-4 py-2',
                'text-caption uppercase tracking-[0.1em]',
                'text-text-secondary border-t border-border',
                'hover:bg-surface transition-colors',
                'focus-visible:outline-none focus-visible:bg-surface',
              ].join(' ')}
            >
              <span>{open ? detailsLabel.close : detailsLabel.open}</span>
              <ChevronDown
                size={14}
                className={[
                  'transition-transform duration-[200ms]',
                  open ? 'rotate-180' : '',
                ].join(' ')}
              />
            </button>
            {open && (
              <div className="border-t border-border bg-surface px-4 py-3">
                {details}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
