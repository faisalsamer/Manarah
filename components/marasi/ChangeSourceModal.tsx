'use client';

import { Building2, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BankAccountPicker } from '@/components/expenses/BankAccountPicker';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogActions } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Form';
import { changeSourceLabels } from '@/lib/marasi/labels';
import type { BankVM, MarsaVM } from '@/lib/marasi/types';
import { findAccount, findBank } from '@/lib/marasi/utils';

export interface ChangeSourceModalProps {
  open: boolean;
  onClose: () => void;
  marsa: MarsaVM | undefined;
  banks: BankVM[];
  /** May return a Promise — the modal awaits it and shows a loading button. */
  onConfirm: (opts: {
    marsaId: string;
    bankId: string;
    accountId: string;
  }) => void | Promise<void>;
}

export function ChangeSourceModal({
  open,
  onClose,
  marsa,
  banks,
  onConfirm,
}: ChangeSourceModalProps) {
  const [bankId, setBankId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Re-seed picker with the goal's current source whenever the modal opens.
  useEffect(() => {
    if (open && marsa) {
      setBankId(marsa.bankId);
      setAccountId(marsa.accountId);
      setSubmitting(false);
    }
  }, [open, marsa]);

  if (!marsa) return <Dialog open={open} onClose={onClose} size="lg" />;

  const currentBank = findBank(banks, marsa.bankId);
  const currentAccount = findAccount(banks, marsa.bankId, marsa.accountId);
  const isSame = bankId === marsa.bankId && accountId === marsa.accountId;
  const canSubmit = !!bankId && !!accountId && !isSame && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onConfirm({ marsaId: marsa.id, bankId, accountId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      size="xl"
      closeOnOverlayClick={!submitting}
      closeOnEscape={!submitting}
      showCloseButton={!submitting}
      title={
        <div>
          <div className="text-micro uppercase tracking-[0.2em] text-text-muted mb-1">
            {changeSourceLabels.eyebrow}
          </div>
          <div>{marsa.title}</div>
        </div>
      }
      footer={
        <DialogActions>
          <Button variant="ghost" disabled={submitting} onClick={handleClose}>
            {changeSourceLabels.cancel}
          </Button>
          <Button
            variant="primary"
            startIcon={<Check size={16} />}
            disabled={!canSubmit}
            loading={submitting}
            onClick={handleSubmit}
          >
            {changeSourceLabels.confirm}
          </Button>
        </DialogActions>
      }
    >
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-h3 font-bold text-text-primary leading-tight mb-1">
            {changeSourceLabels.heading}
          </p>
          <p className="text-body-sm text-text-secondary">
            {changeSourceLabels.helper}
          </p>
        </div>

        {currentBank && currentAccount && (
          <Field label={changeSourceLabels.currentSourceLabel}>
            <div className="flex items-center gap-3 px-4 py-3 rounded-sm bg-surface border border-border">
              <div className="size-8 flex items-center justify-center rounded-xs bg-primary-50 text-primary-500 shrink-0">
                <Building2 size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-body-sm font-semibold text-text-primary truncate">
                  {currentBank.name}
                </div>
                <div className="text-caption text-text-secondary font-numbers">
                  {currentAccount.label} · {currentAccount.accountNumber}
                </div>
              </div>
            </div>
          </Field>
        )}

        <BankAccountPicker
          banks={banks}
          bankId={bankId}
          accountId={accountId}
          onChange={({ bankId: nextBank, accountId: nextAccount }) => {
            setBankId(nextBank);
            setAccountId(nextAccount);
          }}
          linkedBankId={marsa.bankId}
          linkedAccountId={marsa.accountId}
          bankLabel={changeSourceLabels.destinationLabel}
        />

        {isSame && (
          <p className="text-caption text-text-muted">
            {changeSourceLabels.sameAccountHint}
          </p>
        )}
      </div>
    </Dialog>
  );
}
