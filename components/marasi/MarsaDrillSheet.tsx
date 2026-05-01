'use client';

import {
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  Plus,
  Repeat,
  RotateCw,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Money, RiyalSign } from '@/components/ui/RiyalSign';
import { Sheet } from '@/components/ui/Sheet';
import { Stat, StatGrid } from '@/components/ui/Stat';
import { Timeline } from '@/components/ui/Timeline';
import {
  drillLabels,
  frequencyLabels,
} from '@/lib/marasi/labels';
import type { BankVM, MarsaTransactionVM, MarsaVM } from '@/lib/marasi/types';
import {
  compareTxByDateDesc,
  findAccount,
  findBank,
  formatAmount,
  formatDate,
  marsaProgress,
  marsaRemaining,
  successfulInflowCount,
  totalInflows,
} from '@/lib/marasi/utils';
import { LedgerItem } from './LedgerItem';
import { MarsaStatusBadge } from './MarsaStatusBadge';

export interface MarsaDrillSheetProps {
  open: boolean;
  onClose: () => void;
  marsa: MarsaVM | undefined;
  transactions: MarsaTransactionVM[];
  banks: BankVM[];
  /** When set, the matching ledger row scrolls into view and gets a ring. */
  highlightTxId?: string;
  onTopUp: (marsaId: string) => void;
  onRetry: (marsaId: string) => void;
  onCancel: (marsaId: string) => void;
  onRelease: (marsaId: string) => void;
  onChangeSource: (marsaId: string) => void;
}

export function MarsaDrillSheet({
  open,
  onClose,
  marsa,
  transactions,
  banks,
  highlightTxId,
  onTopUp,
  onRetry,
  onCancel,
  onRelease,
  onChangeSource,
}: MarsaDrillSheetProps) {
  if (!marsa) {
    return <Sheet open={open} onClose={onClose} />;
  }

  const bank = findBank(banks, marsa.bankId);
  const account = findAccount(banks, marsa.bankId, marsa.accountId);
  const releaseBank = findBank(banks, marsa.releaseBankId ?? undefined);
  const releaseAccount = findAccount(
    banks,
    marsa.releaseBankId ?? undefined,
    marsa.releaseAccountId ?? undefined,
  );

  const sortedTx = [...transactions].sort(compareTxByDateDesc);
  const progress = marsaProgress(marsa);
  const remaining = marsaRemaining(marsa);
  const totalIn = totalInflows(transactions);
  const inflowCount = successfulInflowCount(transactions);

  const isActive = marsa.status === 'active';
  const isReached = marsa.status === 'reached';
  const isCancelled = marsa.status === 'cancelled';
  const hasFailures = isActive && marsa.failedAttempts > 0;
  const isReachedOpen = isReached && !marsa.withdrawn;
  const isReachedClosed = isReached && marsa.withdrawn;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="right"
      size="xl"
      title={
        <div>
          <div className="text-micro uppercase tracking-[0.2em] text-text-muted mb-1">
            {drillLabels.eyebrow}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span>{marsa.title}</span>
            <MarsaStatusBadge
              status={marsa.status}
              failedAttempts={marsa.failedAttempts}
              withdrawn={marsa.withdrawn}
              size="md"
            />
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-8">
        {/* ── Hero: progress + amount ─────────────────────── */}
        <section className="bg-surface border border-border rounded-md p-5">
          <div className="flex items-baseline justify-between gap-3 flex-wrap mb-4">
            <div>
              <div
                className="inline-flex items-baseline gap-2 text-[40px] font-bold leading-none"
                style={{ color: isReached ? 'var(--color-success)' : 'var(--color-text-primary)' }}
              >
                <span className="font-numbers">
                  {formatAmount(marsa.currentBalance)}
                </span>
                <RiyalSign size="0.6em" className="text-text-muted" />
              </div>
              <div className="mt-1 text-body-sm text-text-secondary">
                {drillLabels.statTarget}:{' '}
                <Money amount={marsa.targetAmount} />
              </div>
            </div>
            <div className="text-left">
              <div className="text-h2 font-bold text-text-primary font-numbers">
                {progress.toFixed(0)}%
              </div>
              {!isCancelled && !isReachedClosed && remaining > 0 && (
                <div className="text-caption text-text-muted">
                  <Money amount={remaining} /> {drillLabels.statRemaining}
                </div>
              )}
            </div>
          </div>
          <ProgressBar
            value={progress}
            tone={
              hasFailures
                ? 'danger'
                : isReached
                  ? 'success'
                  : isCancelled
                    ? 'neutral'
                    : 'primary'
            }
            size="lg"
          />
        </section>

        {/* ── Banners (mutually exclusive) ─────────────────── */}
        {hasFailures && (
          <Callout
            variant="error"
            title={drillLabels.failureBannerTitle(marsa.failedAttempts)}
            description={drillLabels.failureBannerBody}
            action={
              <Button
                variant="primary"
                size="sm"
                startIcon={<RotateCw size={14} />}
                onClick={() => onRetry(marsa.id)}
              >
                {drillLabels.actionRetry}
              </Button>
            }
          />
        )}

        {isReachedOpen && (
          <Callout
            variant="success"
            title={drillLabels.readyBannerTitle}
            description={drillLabels.readyBannerBody}
          />
        )}

        {isReachedClosed && releaseBank && releaseAccount && (
          <Callout
            variant="info"
            title={drillLabels.withdrawnBannerTitle}
            description={drillLabels.withdrawnBannerBody(
              marsa.targetAmount,
              releaseBank.name,
              releaseAccount.label,
            )}
          />
        )}

        {/* ── Stats grid ─────────────────────────────────── */}
        <StatGrid columns={2}>
          <Stat
            label={drillLabels.statSource}
            value={bank?.name ?? '—'}
            hint={`${account?.label ?? ''} ${account?.accountNumber ?? ''}`.trim() || undefined}
            icon={<Building2 size={14} />}
          />
          <Stat
            label={drillLabels.statCadence}
            value={frequencyLabels[marsa.frequency]}
            hint={
              <>
                <Money amount={marsa.periodicAmount} /> {drillLabels.statPerCycle}
              </>
            }
            icon={<Repeat size={14} />}
          />
          <Stat
            label={drillLabels.statTotalIn}
            value={<Money amount={totalIn} />}
            hint={drillLabels.statTotalInSuffix(inflowCount)}
            icon={<TrendingUp size={14} />}
          />
          {isActive && marsa.nextDepositAt ? (
            <Stat
              label={drillLabels.statNextDeposit}
              value={formatDate(marsa.nextDepositAt)}
              hint={<Money amount={marsa.periodicAmount} />}
              icon={<Calendar size={14} />}
            />
          ) : isReached && marsa.reachedAt ? (
            <Stat
              label={drillLabels.statReachedOn}
              value={formatDate(marsa.reachedAt)}
              icon={<CheckCircle2 size={14} />}
            />
          ) : isCancelled && marsa.cancelledAt ? (
            <Stat
              label={drillLabels.statCancelledOn}
              value={formatDate(marsa.cancelledAt)}
              icon={<Calendar size={14} />}
            />
          ) : (
            <Stat
              label={drillLabels.statTarget}
              value={formatDate(marsa.targetDate)}
              icon={<Target size={14} />}
            />
          )}
        </StatGrid>

        {/* ── Action buttons ─────────────────────────────── */}
        {(isActive || isReachedOpen) && (
          <div className="flex flex-wrap items-center gap-3">
            {isActive && (
              <Button
                variant="primary"
                startIcon={<Plus size={16} />}
                onClick={() => onTopUp(marsa.id)}
              >
                {drillLabels.actionTopUp}
              </Button>
            )}
            {isReachedOpen && (
              <Button
                variant="primary"
                startIcon={<ArrowUpRight size={16} />}
                onClick={() => onRelease(marsa.id)}
              >
                {drillLabels.actionReleaseReached}
              </Button>
            )}
            {isActive && (
              <Button
                variant="ghost"
                startIcon={<Building2 size={16} />}
                onClick={() => onChangeSource(marsa.id)}
              >
                {drillLabels.actionChangeSource}
              </Button>
            )}
            {isActive && (
              <Button
                variant="ghost"
                onClick={() => onCancel(marsa.id)}
              >
                {drillLabels.actionCancel}
              </Button>
            )}
          </div>
        )}

        {/* ── Ledger ─────────────────────────────────────── */}
        <div>
          <div className="flex items-baseline justify-between gap-3 mb-4">
            <h3 className="text-h3 font-bold text-text-primary inline-flex items-center gap-2">
              <TrendingUp size={18} className="text-primary-500" />
              {drillLabels.ledgerTitle}
            </h3>
            {sortedTx.length > 0 && (
              <span className="text-caption text-text-muted">
                {drillLabels.ledgerEntries(sortedTx.length)}
              </span>
            )}
          </div>

          {sortedTx.length === 0 ? (
            <div className="bg-card-bg border border-border rounded-md py-12 text-center text-body-sm text-text-secondary font-arabic">
              {drillLabels.ledgerEmpty}
            </div>
          ) : (
            <Timeline>
              {sortedTx.map((tx) => (
                <LedgerItem
                  key={tx.id}
                  tx={tx}
                  banks={banks}
                  highlight={tx.id === highlightTxId}
                />
              ))}
            </Timeline>
          )}
        </div>
      </div>
    </Sheet>
  );
}
