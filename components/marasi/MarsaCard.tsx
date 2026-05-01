'use client';

import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  Repeat,
} from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Money } from '@/components/ui/RiyalSign';
import { cardLabels, frequencyLabels } from '@/lib/marasi/labels';
import type { BankVM, MarsaVM } from '@/lib/marasi/types';
import {
  findAccount,
  findBank,
  formatAmount,
  formatDate,
  marsaProgress,
  marsaRemaining,
} from '@/lib/marasi/utils';
import { MarsaStatusBadge } from './MarsaStatusBadge';

export interface MarsaCardProps {
  marsa: MarsaVM;
  banks: BankVM[];
  onOpen: (marsaId: string) => void;
}

export function MarsaCard({ marsa, banks, onOpen }: MarsaCardProps) {
  const bank = findBank(banks, marsa.bankId);
  const account = findAccount(banks, marsa.bankId, marsa.accountId);
  const releaseBank = findBank(banks, marsa.releaseBankId ?? undefined);
  const releaseAccount = findAccount(
    banks,
    marsa.releaseBankId ?? undefined,
    marsa.releaseAccountId ?? undefined,
  );
  const progress = marsaProgress(marsa);
  const remaining = marsaRemaining(marsa);

  const isActive = marsa.status === 'active';
  const isReached = marsa.status === 'reached';
  const isCancelled = marsa.status === 'cancelled';
  const hasFailures = isActive && marsa.failedAttempts > 0;
  const isReachedOpen = isReached && !marsa.withdrawn;
  const isReachedClosed = isReached && marsa.withdrawn;

  const accentColor = hasFailures
    ? 'var(--color-danger)'
    : isReached
      ? 'var(--color-success)'
      : isCancelled
        ? 'var(--color-text-muted)'
        : 'var(--color-primary-400)';

  const progressTone = hasFailures
    ? 'danger'
    : isReached
      ? 'success'
      : isCancelled
        ? 'neutral'
        : 'primary';

  return (
    <button
      type="button"
      onClick={() => onOpen(marsa.id)}
      className={[
        'group bg-card-bg border border-border hover:border-border-strong',
        'rounded-md transition-colors text-right w-full',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300',
      ].join(' ')}
    >
      <div className="flex items-stretch">
        {/* Accent rail */}
        <div
          aria-hidden
          className="w-1 self-stretch rounded-r-md shrink-0"
          style={{ backgroundColor: accentColor }}
        />

        <div className="flex-1 p-5 flex flex-col gap-4">
          {/* Top row — title + status */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-h3 font-bold text-text-primary leading-tight truncate">
                {marsa.title}
              </h3>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <MarsaStatusBadge
                status={marsa.status}
                failedAttempts={marsa.failedAttempts}
                withdrawn={marsa.withdrawn}
              />
              <ArrowUpRight
                size={16}
                className="text-text-muted group-hover:text-text-primary transition-colors"
              />
            </div>
          </div>

          {/* Amount + progress */}
          <div>
            <div className="flex items-baseline gap-2 flex-wrap mb-2 font-numbers">
              <span
                className="text-h1 font-bold leading-none"
                style={{ color: isReached ? 'var(--color-success)' : 'var(--color-text-primary)' }}
              >
                {formatAmount(marsa.currentBalance)}
              </span>
              <span className="text-body-sm text-text-secondary font-arabic">
                {cardLabels.progressOf}{' '}
                <Money amount={marsa.targetAmount} />
              </span>
            </div>

            <ProgressBar value={progress} tone={progressTone} size="md" />

            <div className="flex items-center justify-between mt-2 text-caption">
              <span className="text-text-muted font-numbers">{progress.toFixed(0)}%</span>
              {!isCancelled && !isReachedClosed && remaining > 0 && (
                <span className="text-text-muted">
                  <Money amount={remaining} /> {cardLabels.remaining}
                </span>
              )}
            </div>
          </div>

          {/* Failure callout (active goals with retries) */}
          {hasFailures && (
            <div className="px-3 py-2 rounded-sm flex items-center gap-2 bg-danger-light border border-danger/20">
              <AlertTriangle size={13} className="text-danger shrink-0" />
              <span className="text-caption text-danger font-medium">
                {marsa.failedAttempts === 1
                  ? cardLabels.failedAttemptsOne
                  : cardLabels.failedAttemptsMany(marsa.failedAttempts)}
              </span>
            </div>
          )}

          {/* Reached & not yet withdrawn callout */}
          {isReachedOpen && (
            <div className="px-3 py-2 rounded-sm flex items-center gap-2 bg-success-light border border-success/20">
              <CheckCircle2 size={13} className="text-success shrink-0" />
              <span className="text-caption text-success font-medium">
                {cardLabels.awaitingWithdrawal}
              </span>
            </div>
          )}

          {/* Footer meta — varies by status */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t border-border text-caption text-text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <Building2 size={12} />
              {bank?.name} · {account?.label} {account?.accountNumber}
            </span>

            {isActive && (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <Repeat size={12} />
                  {frequencyLabels[marsa.frequency]} ·{' '}
                  <span className="font-semibold text-text-primary">
                    <Money amount={marsa.periodicAmount} />
                  </span>{' '}
                  {cardLabels.perCycleLabel}
                </span>
                {marsa.nextDepositAt && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={12} />
                    {cardLabels.nextDepositLabel}: {formatDate(marsa.nextDepositAt)}
                  </span>
                )}
              </>
            )}

            {isReached && marsa.reachedAt && (
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={12} />
                {cardLabels.reachedAtLabel}: {formatDate(marsa.reachedAt)}
              </span>
            )}

            {isCancelled && marsa.cancelledAt && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={12} />
                {cardLabels.cancelledAtLabel}: {formatDate(marsa.cancelledAt)}
              </span>
            )}

            {(isReachedClosed || isCancelled) && releaseBank && releaseAccount && (
              <span className="inline-flex items-center gap-1.5 text-text-muted">
                {cardLabels.withdrawnNote} {releaseBank.name} · {releaseAccount.label}{' '}
                {releaseAccount.accountNumber}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
