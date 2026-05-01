'use client';

import { CreditCard, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Money } from '@/components/ui/RiyalSign';
import { actionLabels } from '@/lib/expenses/labels';
import type { BankVM, ExpenseVM, TransactionVM } from '@/lib/expenses/types';
import {
  findAccount,
  findBank,
  formatDate,
  formatTime,
} from '@/lib/expenses/utils';
import { ExpenseStatusBadge } from './ExpenseStatusBadge';

export interface FailedCardProps {
  tx: TransactionVM;
  expense: ExpenseVM | undefined;
  banks: BankVM[];
  onResolveOpen: (txId: string) => void;
  onSkip: (txId: string) => void;
}

export function FailedCard({ tx, expense, banks, onResolveOpen, onSkip }: FailedCardProps) {
  const bank = findBank(banks, expense?.bankId);
  const account = findAccount(banks, expense?.bankId, expense?.accountId);

  return (
    <div className="bg-card-bg border border-border rounded-md overflow-hidden">
      <div className="flex items-stretch">
        <div aria-hidden className="w-1 bg-danger" />
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-body-lg font-semibold text-text-primary">
                  {expense?.title}
                </h3>
                <ExpenseStatusBadge status="failed" />
              </div>
              <p className="text-body-sm text-text-secondary">
                {`جدولت في ${formatDate(tx.scheduledFor)} الساعة ${formatTime(tx.scheduledFor)}`}
              </p>
            </div>
            <div className="text-left">
              <Money
                amount={tx.amount}
                className="text-h2 font-bold text-text-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-3 mb-4 border-y border-border text-caption">
            <div>
              <div className="text-text-muted mb-1">{actionLabels.failedReasonLabel}</div>
              <div className="font-medium text-text-primary">
                {tx.failureReason ?? '—'}
              </div>
            </div>
            <div>
              <div className="text-text-muted mb-1">{actionLabels.retriesLabel}</div>
              <div className="font-medium text-text-primary">
                {actionLabels.retriesValue(tx.retryCount)}
              </div>
            </div>
            <div>
              <div className="text-text-muted mb-1">{actionLabels.sourceLabel}</div>
              <div className="font-medium text-text-primary">
                {bank?.name} · {account?.label}
              </div>
            </div>
            <div>
              <div className="text-text-muted mb-1">{actionLabels.notifiedLabel}</div>
              <div className="font-medium text-text-primary font-numbers">
                {formatDate(tx.scheduledFor)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-caption italic text-text-muted">
              {actionLabels.failedHint}
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                startIcon={<SkipForward size={14} />}
                onClick={() => onSkip(tx.id)}
              >
                {actionLabels.skipCycle}
              </Button>
              <Button
                variant="primary"
                size="sm"
                startIcon={<CreditCard size={14} />}
                onClick={() => onResolveOpen(tx.id)}
              >
                {actionLabels.resolve}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
