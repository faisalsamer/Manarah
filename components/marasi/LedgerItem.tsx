'use client';

import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  RotateCw,
  XCircle,
} from 'lucide-react';
import { useEffect, useRef, type ComponentType } from 'react';
import { TimelineItem } from '@/components/ui/Timeline';
import { Money } from '@/components/ui/RiyalSign';
import { drillLabels } from '@/lib/marasi/labels';
import type {
  BankVM,
  MarsaAttemptStatus,
  MarsaTransactionVM,
  MarsaTxStatus,
  MarsaTxType,
} from '@/lib/marasi/types';
import {
  findAccount,
  findBank,
  formatDate,
  formatTime,
} from '@/lib/marasi/utils';
import { MarsaTxTypeBadge } from './MarsaTxTypeBadge';

type Icon = ComponentType<{ size?: number | string; className?: string; strokeWidth?: number }>;

interface IconConfig {
  Icon: Icon;
  color: string;
  spin?: boolean;
}

const statusIcon: Record<MarsaTxStatus, IconConfig> = {
  scheduled:  { Icon: Clock, color: 'var(--color-text-muted)' },
  processing: { Icon: Loader2, color: 'var(--color-info)', spin: true },
  retrying:   { Icon: RotateCw, color: 'var(--color-warning)', spin: true },
  succeeded:  { Icon: CheckCircle2, color: 'var(--color-success)' },
  failed:     { Icon: XCircle, color: 'var(--color-danger)' },
  cancelled:  { Icon: XCircle, color: 'var(--color-text-muted)' },
};

const attemptIcon: Record<MarsaAttemptStatus, { Icon: Icon; color: string }> = {
  succeeded: { Icon: CheckCircle2, color: 'var(--color-success)' },
  failed:    { Icon: XCircle, color: 'var(--color-danger)' },
  info:      { Icon: Info, color: 'var(--color-text-secondary)' },
};

/**
 * Sign of the amount relative to the jar.
 *   - Inflows (auto_debit, manual_topup) show as +
 *   - Outflows (release) show as −
 */
const isOutflow = (type: MarsaTxType): boolean => type === 'release';

export interface LedgerItemProps {
  tx: MarsaTransactionVM;
  banks: BankVM[];
  /** When true, scroll into view + apply a primary ring so the user sees
   *  which entry triggered them landing here (deep-linked from a notification). */
  highlight?: boolean;
}

export function LedgerItem({ tx, banks, highlight = false }: LedgerItemProps) {
  const statusCfg = statusIcon[tx.status];
  const StatusIcon = statusCfg.Icon;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlight && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlight]);

  const dateToShow = tx.executedAt ?? tx.scheduledFor ?? '';
  const hasAttempts = tx.attempts.length > 0;
  const isFailed = tx.status === 'failed';
  const outflow = isOutflow(tx.type);
  const InflowOutflow = outflow ? ArrowUpRight : ArrowDownLeft;

  const destBank = findBank(banks, tx.destinationBankId ?? undefined);
  const destAccount = findAccount(
    banks,
    tx.destinationBankId ?? undefined,
    tx.destinationAccountId ?? undefined,
  );

  return (
    <TimelineItem
      ref={ref}
      panelClassName={
        highlight ? 'ring-2 ring-primary-400 ring-offset-2 ring-offset-page-bg' : ''
      }
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
            {dateToShow ? `${formatDate(dateToShow)} · ${formatTime(dateToShow)}` : '—'}
          </span>
          <span className="inline-flex items-center gap-2 flex-wrap">
            <MarsaTxTypeBadge type={tx.type} />
            {tx.retryCount > 0 && tx.status !== 'succeeded' && (
              <span className="text-caption text-text-muted">
                · {drillLabels.retryLabel(tx.retryCount)}
              </span>
            )}
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
          {tx.type === 'release' && destBank && destAccount && (
            <span className="text-caption text-text-secondary">
              {drillLabels.releaseDestination}: {destBank.name} · {destAccount.label}{' '}
              {destAccount.accountNumber}
            </span>
          )}
          {tx.failureReason && (
            <span className="text-caption text-danger">{tx.failureReason}</span>
          )}
          {tx.note && (
            <span className="text-caption italic text-text-muted">{tx.note}</span>
          )}
        </span>
      }
      rightSlot={
        <div className="flex items-center gap-2 font-numbers">
          <InflowOutflow
            size={16}
            strokeWidth={2.25}
            style={{
              color: outflow
                ? 'var(--color-warning)'
                : isFailed
                  ? 'var(--color-text-muted)'
                  : 'var(--color-success)',
            }}
          />
          <span
            className="inline-flex items-baseline gap-0.5 text-h4 font-bold"
            style={{
              color: isFailed
                ? 'var(--color-text-muted)'
                : outflow
                  ? 'var(--color-warning)'
                  : 'var(--color-success)',
            }}
          >
            <span aria-hidden>{outflow ? '−' : '+'}</span>
            <Money amount={tx.amount} />
          </span>
        </div>
      }
      detailsLabel={{ open: drillLabels.showAttempts, close: drillLabels.hideAttempts }}
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
