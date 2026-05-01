'use client';

import { Check, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Checkbox } from '@/components/ui/Form';
import { Dialog, DialogActions } from '@/components/ui/Dialog';
import { Money } from '@/components/ui/RiyalSign';
import { Spinner } from '@/components/ui/Spinner';
import { resolveLabels } from '@/lib/expenses/labels';
import type { BankVM, ExpenseVM, TransactionVM } from '@/lib/expenses/types';
import { findAccount, findBank, formatDate } from '@/lib/expenses/utils';
import { BankAccountPicker } from './BankAccountPicker';

type Phase = 'selecting' | 'loading' | 'success';

export interface ResolveModalProps {
  open: boolean;
  onClose: () => void;
  expense: ExpenseVM | undefined;
  tx: TransactionVM | undefined;
  banks: BankVM[];
  /**
   * Async — resolves on a successful charge, rejects on failure.
   * The modal flips to its `success` phase only when this resolves; on reject
   * it returns the user to `selecting` so they can pick a different account
   * (the parent should also surface a toast).
   */
  onResolve: (opts: {
    txId: string;
    bankId: string;
    accountId: string;
    updateLinked: boolean;
  }) => Promise<void>;
}

export function ResolveModal({
  open,
  onClose,
  expense,
  tx,
  banks,
  onResolve,
}: ResolveModalProps) {
  const [bankId, setBankId] = useState<string>(expense?.bankId ?? '');
  const [accountId, setAccountId] = useState<string>(expense?.accountId ?? '');
  const [updateLinked, setUpdateLinked] = useState(false);
  const [phase, setPhase] = useState<Phase>('selecting');

  // Reset state when the modal opens with a new tx/expense.
  // We rely on `open` flipping to false; parent unmounts on close in practice.

  if (!expense || !tx) {
    return <Dialog open={open} onClose={onClose} size="xl" />;
  }

  const linkedBank = expense.bankId;
  const linkedAccount = expense.accountId;
  const selectedBank = findBank(banks, bankId);
  const selectedAccount = findAccount(banks, bankId, accountId);
  const isDifferent = bankId !== linkedBank || accountId !== linkedAccount;
  const dueAmount = parseFloat(tx.amount ?? '0');
  const accountBalance = selectedAccount ? parseFloat(selectedAccount.balance) : 0;
  const hasInsufficient = !!selectedAccount && accountBalance < dueAmount;
  const canPay = !!selectedAccount && phase === 'selecting' && !hasInsufficient;
  const dueAmountValue = tx.amount ?? '0';

  const handlePay = async () => {
    setPhase('loading');
    try {
      await onResolve({
        txId: tx.id,
        bankId,
        accountId,
        updateLinked: isDifferent && updateLinked,
      });
      setPhase('success');
      // Brief success view, then close.
      setTimeout(() => onClose(), 1400);
    } catch {
      // Parent surfaces the toast. Return to selecting so the user can retry
      // with a different account.
      setPhase('selecting');
    }
  };

  const handleClose = () => {
    if (phase !== 'selecting') return;
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      size="xl"
      closeOnOverlayClick={phase === 'selecting'}
      closeOnEscape={phase === 'selecting'}
      showCloseButton={phase === 'selecting'}
      title={
        <div>
          <div className="text-micro uppercase tracking-[0.2em] text-text-muted mb-1">
            {resolveLabels.eyebrow}
          </div>
          <div>{expense.title}</div>
        </div>
      }
      footer={
        phase === 'selecting' ? (
          <DialogActions>
            <Button variant="ghost" onClick={handleClose}>
              {resolveLabels.cancel}
            </Button>
            <Button
              variant="primary"
              startIcon={<CreditCard size={16} />}
              disabled={!canPay}
              onClick={handlePay}
            >
              {resolveLabels.payNow}
            </Button>
          </DialogActions>
        ) : null
      }
    >
      {phase === 'selecting' && (
        <div className="flex flex-col gap-6">
          {/* Amount banner */}
          <div className="flex items-end justify-between gap-4 pb-5 border-b border-border">
            <div>
              <div className="text-micro uppercase tracking-[0.2em] text-text-muted mb-1">
                {resolveLabels.amountDue}
              </div>
              <Money
                amount={dueAmountValue}
                className="text-h1 font-bold text-text-primary leading-none"
              />
            </div>
            <div className="text-left">
              <div className="text-micro uppercase tracking-[0.2em] text-text-muted mb-1">
                {resolveLabels.scheduledFor}
              </div>
              <div className="text-body-sm font-medium font-numbers">
                {formatDate(tx.scheduledFor)}
              </div>
            </div>
          </div>

          <BankAccountPicker
            banks={banks}
            bankId={bankId}
            accountId={accountId}
            onChange={({ bankId: nextBank, accountId: nextAccount }) => {
              setBankId(nextBank);
              setAccountId(nextAccount);
            }}
            linkedBankId={linkedBank}
            linkedAccountId={linkedAccount}
            amountDue={tx.amount ?? '0'}
            bankLabel={resolveLabels.payFromLabel}
            accountLabel={resolveLabels.accountLabel}
          />

          {hasInsufficient && selectedAccount && (
            <Callout
              variant="error"
              compact
              description={resolveLabels.insufficientWarning(
                selectedAccount.balance,
                dueAmountValue,
              )}
            />
          )}

          {isDifferent && selectedBank && selectedAccount && (
            <label
              className={[
                'flex items-start gap-3 p-4 rounded-sm border cursor-pointer transition-colors',
                updateLinked
                  ? 'bg-success-light border-primary-400'
                  : 'bg-card-bg border-border',
              ].join(' ')}
            >
              <Checkbox
                checked={updateLinked}
                onChange={(e) => setUpdateLinked(e.target.checked)}
              />
              <span className="flex-1 text-right">
                <span className="block text-body-sm font-semibold text-text-primary">
                  {resolveLabels.setAsLinkedTitle}
                </span>
                <span className="block mt-1 text-caption text-text-secondary leading-normal">
                  {resolveLabels.setAsLinkedBody(
                    expense.title,
                    selectedBank.name,
                    selectedAccount.label,
                  )}
                </span>
              </span>
            </label>
          )}
        </div>
      )}

      {phase === 'loading' && selectedBank && selectedAccount && (
        <div className="flex flex-col items-center justify-center text-center py-12 gap-4">
          <Spinner size="xl" />
          <div className="text-h3 font-bold text-text-primary">
            {resolveLabels.processingTitle}
          </div>
          <p className="text-body-sm text-text-secondary max-w-sm">
            {resolveLabels.processingBody(
              dueAmountValue,
              selectedBank.name,
              selectedAccount.label,
            )}
          </p>
        </div>
      )}

      {phase === 'success' && selectedBank && selectedAccount && (
        <div className="flex flex-col items-center justify-center text-center py-12 gap-4">
          <div className="size-16 flex items-center justify-center rounded-full bg-success-light text-success">
            <Check size={32} strokeWidth={3} />
          </div>
          <div className="text-h2 font-bold text-text-primary">
            {resolveLabels.successTitle}
          </div>
          <p className="text-body-sm text-text-secondary max-w-sm">
            {resolveLabels.successBody(
              dueAmountValue,
              selectedBank.name,
              selectedAccount.label,
            )}
          </p>
          {isDifferent && updateLinked && (
            <p className="text-caption italic text-text-muted max-w-sm">
              {resolveLabels.successLinkedNote}
            </p>
          )}
        </div>
      )}
    </Dialog>
  );
}
