'use client';

import { Building2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Dialog, DialogActions } from '@/components/ui/Dialog';
import { Field, MoneyInput } from '@/components/ui/Form';
import { Money } from '@/components/ui/RiyalSign';
import { topUpLabels } from '@/lib/marasi/labels';
import type { BankVM, MarsaVM } from '@/lib/marasi/types';
import { findAccount, findBank } from '@/lib/marasi/utils';

export interface TopUpModalProps {
  open: boolean;
  onClose: () => void;
  marsa: MarsaVM | undefined;
  banks: BankVM[];
  onConfirm: (opts: { marsaId: string; amount: string }) => void;
}

export function TopUpModal({ open, onClose, marsa, banks, onConfirm }: TopUpModalProps) {
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (open) setAmount('');
  }, [open]);

  if (!marsa) {
    return <Dialog open={open} onClose={onClose} size="lg" />;
  }

  const bank = findBank(banks, marsa.bankId);
  const account = findAccount(banks, marsa.bankId, marsa.accountId);
  const balance = account ? parseFloat(account.balance) : 0;
  const value = parseFloat(amount);
  const hasInsufficient = !!account && Number.isFinite(value) && value > balance;
  const canSubmit = !!account && Number.isFinite(value) && value > 0 && !hasInsufficient;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onConfirm({ marsaId: marsa.id, amount });
    setAmount('');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={
        <div>
          <div className="text-micro uppercase tracking-[0.2em] text-text-muted mb-1">
            {topUpLabels.eyebrow}
          </div>
          <div>{marsa.title}</div>
        </div>
      }
      footer={
        <DialogActions>
          <Button variant="ghost" onClick={onClose}>
            {topUpLabels.cancel}
          </Button>
          <Button
            variant="primary"
            startIcon={<Plus size={16} />}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {topUpLabels.confirm}
          </Button>
        </DialogActions>
      }
    >
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-h3 font-bold text-text-primary leading-tight mb-1">
            {topUpLabels.heading}
          </p>
          <p className="text-body-sm text-text-secondary">{topUpLabels.helper}</p>
        </div>

        <Field label={topUpLabels.amountLabel} required>
          <MoneyInput
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            invalid={hasInsufficient}
          />
        </Field>

        {bank && account && (
          <Field label={topUpLabels.fromLabel}>
            <div className="flex items-center gap-3 px-4 py-3 rounded-sm bg-surface border border-border">
              <div className="size-8 flex items-center justify-center rounded-xs bg-primary-50 text-primary-500 shrink-0">
                <Building2 size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-body-sm font-semibold text-text-primary truncate">
                  {bank.name}
                </div>
                <div className="text-caption text-text-secondary font-numbers">
                  {account.label} · {account.accountNumber}
                </div>
              </div>
              <div className="text-left shrink-0">
                <div className="text-body font-semibold text-text-primary">
                  <Money amount={account.balance} />
                </div>
              </div>
            </div>
          </Field>
        )}

        {hasInsufficient && account && (
          <Callout
            variant="error"
            compact
            description={topUpLabels.insufficientWarning(account.balance, amount)}
          />
        )}
      </div>
    </Dialog>
  );
}
