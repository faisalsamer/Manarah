'use client';

import { Hand, SkipForward } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, MoneyInput } from '@/components/ui/Form';
import { Money } from '@/components/ui/RiyalSign';
import { actionLabels, commonLabels } from '@/lib/expenses/labels';
import type { BankVM, ExpenseVM, TransactionVM } from '@/lib/expenses/types';
import { findAccount, findBank, formatDate, formatTime } from '@/lib/expenses/utils';
import { ExpenseStatusBadge } from './ExpenseStatusBadge';

export interface ConfirmCardProps {
  tx: TransactionVM;
  expense: ExpenseVM | undefined;
  banks: BankVM[];
  onConfirm: (txId: string, amount: string) => void;
  onSkip: (txId: string) => void;
}

export function ConfirmCard({ tx, expense, banks, onConfirm, onSkip }: ConfirmCardProps) {
  const isVariable = expense?.amountType === 'variable';
  const isManualMode = expense?.paymentMode === 'manual';
  const [amount, setAmount] = useState<string>(isVariable ? '' : tx.amount ?? '');

  const bank = findBank(banks, expense?.bankId);
  const account = findAccount(banks, expense?.bankId, expense?.accountId);

  const reasonLabel = isVariable
    ? actionLabels.variableLabel
    : isManualMode
      ? actionLabels.manualModeLabel
      : actionLabels.awaitingLabel;

  const reasonDetail = isVariable
    ? actionLabels.variableHelper
    : actionLabels.manualHelper;

  return (
    <div className="bg-card-bg border border-border rounded-md overflow-hidden">
      <div className="flex items-stretch">
        <div aria-hidden className="w-1 bg-info" />
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-body-lg font-semibold text-text-primary">
                  {expense?.title}
                </h3>
                <ExpenseStatusBadge status="awaiting_confirmation" />
                {isManualMode && (
                  <Badge size="sm" variant="info" icon={<Hand size={10} strokeWidth={2.5} />}>
                    {actionLabels.manualModeLabel}
                  </Badge>
                )}
              </div>
              <p className="text-body-sm text-text-secondary">
                {`مجدولة للخصم في ${formatDate(tx.scheduledFor)} الساعة ${formatTime(tx.scheduledFor)}`}
              </p>
            </div>
            {!isVariable && tx.amount && (
              <div className="text-left">
                <Money
                  amount={tx.amount}
                  className="text-h2 font-bold text-text-primary"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 py-3 mb-4 border-y border-border text-caption">
            <div>
              <div className="text-text-muted mb-1">{actionLabels.sourceLabel}</div>
              <div className="font-medium text-text-primary">
                {bank?.name} · {account?.label}
              </div>
            </div>
            <div>
              <div className="text-text-muted mb-1">{reasonLabel}</div>
              <div className="font-medium text-text-primary">
                {reasonDetail}
              </div>
            </div>
          </div>

          {isVariable ? (
            <div className="flex items-end gap-3 flex-wrap">
              <Field label={actionLabels.amountToDebit} className="flex-1 min-w-[200px]">
                <MoneyInput
                  inputSize="md"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                />
              </Field>
              <Button
                variant="ghost"
                startIcon={<SkipForward size={14} />}
                onClick={() => onSkip(tx.id)}
              >
                {commonLabels.skip}
              </Button>
              <Button
                variant="primary"
                disabled={!amount || parseFloat(amount) <= 0}
                onClick={() => onConfirm(tx.id, amount)}
              >
                {actionLabels.confirmAndDebit}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-caption italic text-text-muted">
                {tx.amount && actionLabels.approveHint(tx.amount)}
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
                  onClick={() => tx.amount && onConfirm(tx.id, tx.amount)}
                >
                  {actionLabels.approveAndDebit}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
