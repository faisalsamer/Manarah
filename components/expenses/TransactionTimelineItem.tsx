'use client';

import {
  CheckCircle2,
  Clock,
  HelpCircle,
  Info,
  Loader2,
  RotateCw,
  SkipForward,
  XCircle,
} from 'lucide-react';
import { useEffect, useRef, type ComponentType } from 'react';
import { Money } from '@/components/ui/RiyalSign';
import { TimelineItem } from '@/components/ui/Timeline';
import { drillLabels } from '@/lib/expenses/labels';
import type { AttemptStatus, TransactionStatus, TransactionVM } from '@/lib/expenses/types';
import { formatDate, formatTime } from '@/lib/expenses/utils';
import { ExpenseStatusBadge } from './ExpenseStatusBadge';

type Icon = ComponentType<{ size?: number | string; className?: string; strokeWidth?: number }>;

interface IconConfig {
  Icon: Icon;
  color: string;
  spin?: boolean;
}

const statusIcon: Record<TransactionStatus, IconConfig> = {
  succeeded: { Icon: CheckCircle2, color: 'var(--color-success)' },
  failed: { Icon: XCircle, color: 'var(--color-danger)' },
  retrying: { Icon: RotateCw, color: 'var(--color-warning)', spin: true },
  awaiting_confirmation: { Icon: HelpCircle, color: 'var(--color-info)' },
  scheduled: { Icon: Clock, color: 'var(--color-text-muted)' },
  skipped: { Icon: SkipForward, color: 'var(--color-text-muted)' },
  processing: { Icon: Loader2, color: 'var(--color-info)', spin: true },
};

const attemptIcon: Record<AttemptStatus, { Icon: Icon; color: string }> = {
  succeeded: { Icon: CheckCircle2, color: 'var(--color-success)' },
  failed: { Icon: XCircle, color: 'var(--color-danger)' },
  info: { Icon: Info, color: 'var(--color-text-secondary)' },
};

export interface TransactionTimelineItemProps {
  tx: TransactionVM;
  /** When true, scroll into view + apply a primary ring so the user sees
   *  which transaction triggered them landing here (deep-linked from a notification). */
  highlight?: boolean;
}

export function TransactionTimelineItem({ tx, highlight = false }: TransactionTimelineItemProps) {
  const statusCfg = statusIcon[tx.status];
  const StatusIcon = statusCfg.Icon;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlight && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlight]);
  const dateToShow = tx.executedAt ?? tx.scheduledFor;
  const hasAttempts = tx.attempts.length > 0;

  return (
    <TimelineItem
      ref={ref}
      panelClassName={highlight ? 'ring-2 ring-primary-400 ring-offset-2 ring-offset-page-bg' : ''}
      iconColor={statusCfg.color}
      icon={
        <StatusIcon
          size={14}
          strokeWidth={2.25}
          className={statusCfg.spin ? 'animate-spin' : ''}
        />
      }
      title={
        <span className="flex flex-col gap-1.5">
          <span className="font-numbers text-body font-semibold">
            {formatDate(dateToShow)} · {formatTime(dateToShow)}
          </span>
          <span>
            <ExpenseStatusBadge status={tx.status} retryCount={tx.retryCount} />
          </span>
        </span>
      }
      meta={
        <span className="flex flex-col gap-1">
          {tx.bankRef && (
            <span className="font-numbers text-micro text-text-muted">
              {drillLabels.refLabel}: {tx.bankRef}
            </span>
          )}
          {tx.failureReason && (
            <span className="text-caption text-danger">
              {tx.failureReason}
            </span>
          )}
          {tx.note && (
            <span className="text-caption italic text-text-muted">
              {tx.note}
            </span>
          )}
        </span>
      }
      rightSlot={
        <div className="text-left">
          {tx.amount ? (
            <Money amount={tx.amount} className="text-h4 font-bold text-text-primary" />
          ) : (
            <span className="text-caption italic text-text-muted font-arabic">
              {drillLabels.pendingAmount}
            </span>
          )}
        </div>
      }
      detailsLabel={{ open: drillLabels.showDetails, close: drillLabels.hideDetails }}
      details={
        hasAttempts ? (
          <div className="relative pr-4">
            <div
              aria-hidden
              className="absolute right-1 top-2 bottom-2 w-px bg-border"
            />
            <div className="flex flex-col gap-3">
              {tx.attempts.map((attempt) => {
                const cfg = attemptIcon[attempt.status];
                const AttemptIcon = cfg.Icon;
                return (
                  <div key={attempt.id} className="relative">
                    <div
                      aria-hidden
                      className="absolute -right-[12px] top-0.5 w-3 h-3 flex items-center justify-center bg-surface rounded-full"
                      style={{ color: cfg.color }}
                    >
                      <AttemptIcon size={12} strokeWidth={2.25} />
                    </div>
                    <div className="text-micro font-numbers text-text-muted mb-0.5">
                      {formatDate(attempt.at)} · {formatTime(attempt.at)}
                    </div>
                    <div
                      className="text-caption leading-snug"
                      style={{
                        color:
                          attempt.status === 'failed'
                            ? 'var(--color-danger)'
                            : 'var(--color-text-primary)',
                      }}
                    >
                      {attempt.message}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null
      }
    />
  );
}
