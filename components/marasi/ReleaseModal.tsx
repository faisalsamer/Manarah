'use client';

import { ArrowUpRight, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BankAccountPicker } from '@/components/expenses/BankAccountPicker';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Dialog, DialogActions } from '@/components/ui/Dialog';
import { Spinner } from '@/components/ui/Spinner';
import { Money } from '@/components/ui/RiyalSign';
import { releaseLabels } from '@/lib/marasi/labels';
import type { BankVM, MarsaVM } from '@/lib/marasi/types';
import { findAccount, findBank } from '@/lib/marasi/utils';

type Phase = 'selecting' | 'loading' | 'success';
export type ReleaseMode = 'release' | 'cancel';

export interface ReleaseModalProps {
  open: boolean;
  onClose: () => void;
  marsa: MarsaVM | undefined;
  banks: BankVM[];
  /**
   * "release" → goal is `reached`, withdraw funds
   * "cancel"  → goal is `active`, terminate AND withdraw funds
   */
  mode: ReleaseMode;
  onConfirm: (opts: {
    marsaId: string;
    mode: ReleaseMode;
    destinationBankId: string;
    destinationAccountId: string;
  }) => void;
}

export function ReleaseModal({
  open,
  onClose,
  marsa,
  banks,
  mode,
  onConfirm,
}: ReleaseModalProps) {
  // Default destination = the source account on the goal.
  const [bankId, setBankId] = useState<string>(marsa?.bankId ?? '');
  const [accountId, setAccountId] = useState<string>(marsa?.accountId ?? '');
  const [phase, setPhase] = useState<Phase>('selecting');

  // Re-seed state whenever the modal opens with a different goal.
  useEffect(() => {
    if (open && marsa) {
      setBankId(marsa.bankId);
      setAccountId(marsa.accountId);
      setPhase('selecting');
    }
  }, [open, marsa]);

  if (!marsa) {
    return <Dialog open={open} onClose={onClose} size="xl" />;
  }

  const destBank = findBank(banks, bankId);
  const destAccount = findAccount(banks, bankId, accountId);
  const canSubmit = !!destBank && !!destAccount && phase === 'selecting';

  const handleSubmit = () => {
    setPhase('loading');
    setTimeout(() => {
      setPhase('success');
      setTimeout(() => {
        onConfirm({
          marsaId: marsa.id,
          mode,
          destinationBankId: bankId,
          destinationAccountId: accountId,
        });
      }, 1400);
    }, 1500);
  };

  const handleClose = () => {
    if (phase !== 'selecting') return;
    onClose();
  };

  const isCancel = mode === 'cancel';

  const eyebrow = isCancel ? releaseLabels.cancelEyebrow : releaseLabels.releaseEyebrow;
  const heading = isCancel ? releaseLabels.cancelHeading : releaseLabels.releaseHeading;
  const helper = isCancel ? releaseLabels.cancelHelper : releaseLabels.releaseHelper;
  const submitLabel = isCancel ? releaseLabels.cancelSubmit : releaseLabels.releaseSubmit;
  const successTitle = isCancel
    ? releaseLabels.successCancelTitle
    : releaseLabels.successReleaseTitle;

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
            {eyebrow}
          </div>
          <div>{marsa.title}</div>
        </div>
      }
      footer={
        phase === 'selecting' ? (
          <DialogActions>
            <Button variant="ghost" onClick={handleClose}>
              {releaseLabels.cancel}
            </Button>
            <Button
              variant={isCancel ? 'danger' : 'primary'}
              startIcon={isCancel ? undefined : <ArrowUpRight size={16} />}
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {submitLabel}
            </Button>
          </DialogActions>
        ) : null
      }
    >
      {phase === 'selecting' && (
        <div className="flex flex-col gap-6">
          {/* Heading + helper */}
          <div>
            <p className="text-h3 font-bold text-text-primary leading-tight mb-1">
              {heading}
            </p>
            <p className="text-body-sm text-text-secondary">{helper}</p>
          </div>

          {/* Amount banner */}
          <div className="flex items-end justify-between gap-4 pb-5 border-b border-border">
            <div>
              <div className="text-micro uppercase tracking-[0.2em] text-text-muted mb-1">
                {releaseLabels.amountLabel}
              </div>
              <div className="text-h1 font-bold text-text-primary leading-none">
                <Money amount={marsa.currentBalance} />
              </div>
            </div>
          </div>

          {/* Cancel-specific impact list */}
          {isCancel && (
            <Callout
              variant="warning"
              title={releaseLabels.cancelImpactTitle}
            >
              <ul className="list-disc pr-5 space-y-1 text-body-sm">
                <li>{releaseLabels.cancelImpact1}</li>
                <li>{releaseLabels.cancelImpact2}</li>
                <li>{releaseLabels.cancelImpact3}</li>
              </ul>
            </Callout>
          )}

          {/* Destination picker — pre-filled with the source account but freely changeable */}
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
            bankLabel={releaseLabels.destinationLabel}
          />
        </div>
      )}

      {phase === 'loading' && destBank && destAccount && (
        <div className="flex flex-col items-center justify-center text-center py-12 gap-4">
          <Spinner size="xl" />
          <div className="text-h3 font-bold text-text-primary">
            {releaseLabels.processingTitle}
          </div>
          <p className="text-body-sm text-text-secondary max-w-sm">
            {releaseLabels.processingBody(marsa.currentBalance, destBank.name, destAccount.label)}
          </p>
        </div>
      )}

      {phase === 'success' && destBank && destAccount && (
        <div className="flex flex-col items-center justify-center text-center py-12 gap-4">
          <div className="size-16 flex items-center justify-center rounded-full bg-success-light text-success">
            <Check size={32} strokeWidth={3} />
          </div>
          <div className="text-h2 font-bold text-text-primary">{successTitle}</div>
          <p className="text-body-sm text-text-secondary max-w-sm">
            {releaseLabels.successBody(marsa.currentBalance, destBank.name, destAccount.label)}
          </p>
        </div>
      )}
    </Dialog>
  );
}
