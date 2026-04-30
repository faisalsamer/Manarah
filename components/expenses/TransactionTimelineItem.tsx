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
import type { ComponentType } from 'react';
import { TimelineItem } from '@/components/ui/Timeline';
import { commonLabels, drillLabels } from '@/lib/expenses/labels';
import type { AttemptStatus, TransactionStatus, TransactionVM } from '@/lib/expenses/types';
import { formatAmount, formatDate, formatTime } from '@/lib/expenses/utils';
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
}

export function TransactionTimelineItem({ tx }: TransactionTimelineItemProps) {
  const statusCfg = statusIcon[tx.status];
  const StatusIcon = statusCfg.Icon;
  const dateToShow = tx.executedAt ?? tx.scheduledFor;
  const hasAttempts = tx.attempts.length > 0;

  return (
    <TimelineItem
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
        <div className="text-left font-numbers">
          {tx.amount ? (
            <span className="text-h4 font-bold text-text-primary">
              {formatAmount(tx.amount)}{' '}
              <span className="text-caption text-text-muted font-arabic">
                {commonLabels.currency}
              </span>
            </span>
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
