'use client';

import { Building2, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Field } from '@/components/ui/Form';
import { commonLabels, resolveLabels, wizardLabels } from '@/lib/expenses/labels';
import type { BankVM } from '@/lib/expenses/types';
import { findBank, formatAmount } from '@/lib/expenses/utils';

export interface BankAccountPickerProps {
  banks: BankVM[];
  bankId: string;
  accountId: string;
  onChange: (next: { bankId: string; accountId: string }) => void;
  /** When set, mark the linked bank+account combo with a "linked" tag. */
  linkedBankId?: string;
  linkedAccountId?: string;
  /** When set, show balance + insufficient indicator on each account. */
  amountDue?: string;
  /** Customize section labels (defaults to wizard labels). */
  bankLabel?: string;
  accountLabel?: string;
}

export function BankAccountPicker({
  banks,
  bankId,
  accountId,
  onChange,
  linkedBankId,
  linkedAccountId,
  amountDue,
  bankLabel = wizardLabels.bankLabel,
  accountLabel = wizardLabels.accountLabel,
}: BankAccountPickerProps) {
  const selectedBank = findBank(banks, bankId);
  const showBalance = amountDue !== undefined;
  const dueValue = amountDue !== undefined ? parseFloat(amountDue) : 0;

  const selectBank = (id: string) => {
    const bank = findBank(banks, id);
    onChange({ bankId: id, accountId: bank?.accounts[0]?.id ?? '' });
  };

  return (
    <div className="flex flex-col gap-5">
      <Field label={bankLabel} required>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {banks.map((b) => {
            const active = bankId === b.id;
            const isLinked = b.id === linkedBankId;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => selectBank(b.id)}
                aria-pressed={active}
                className={[
                  'flex items-center justify-between gap-3 px-4 py-3 text-right rounded-sm',
                  'border-[1.5px] transition-all duration-[150ms]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2',
                  active
                    ? 'bg-primary-400 text-white border-primary-400'
                    : 'bg-card-bg border-border hover:border-border-strong',
                ].join(' ')}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Building2 size={16} />
                  <span className="text-body-sm font-semibold truncate">
                    {b.name}
                  </span>
                </span>
                {isLinked && (
                  <span
                    className={[
                      'text-micro uppercase tracking-wider px-1.5 py-0.5 rounded-full',
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-surface text-text-secondary',
                    ].join(' ')}
                  >
                    {resolveLabels.linkedTag}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Field>

      {selectedBank && (
        <Field label={accountLabel} required>
          <div className="flex flex-col gap-2">
            {selectedBank.accounts.map((a) => {
              const active = accountId === a.id;
              const isLinked = bankId === linkedBankId && a.id === linkedAccountId;
              const balance = parseFloat(a.balance);
              const enough = !showBalance || balance >= dueValue;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onChange({ bankId, accountId: a.id })}
                  aria-pressed={active}
                  className={[
                    'flex items-center justify-between gap-3 px-4 py-3 text-right rounded-sm',
                    'border-[1.5px] transition-all duration-[150ms]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2',
                    active
                      ? 'bg-primary-400 text-white border-primary-400'
                      : 'bg-card-bg border-border hover:border-border-strong',
                  ].join(' ')}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Wallet size={16} />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="text-body-sm font-semibold truncate">
                          {a.label}
                        </span>
                        {isLinked && (
                          <Badge
                            size="sm"
                            variant="subtle"
                            className={
                              active
                                ? 'bg-white/20 text-white border-white/0'
                                : ''
                            }
                          >
                            {resolveLabels.linkedTag}
                          </Badge>
                        )}
                      </span>
                      <span
                        className={[
                          'block text-caption font-numbers',
                          active ? 'text-white/70' : 'text-text-muted',
                        ].join(' ')}
                      >
                        {a.accountNumber}
                      </span>
                    </span>
                  </span>
                  {showBalance && (
                    <span className="text-left shrink-0">
                      <span className="block text-body font-semibold font-numbers leading-none">
                        {formatAmount(a.balance)}{' '}
                        <span className="text-caption font-arabic">
                          {commonLabels.currency}
                        </span>
                      </span>
                      <span
                        className={[
                          'block text-micro uppercase tracking-wider mt-1',
                          active
                            ? enough
                              ? 'text-white/70'
                              : 'text-danger-light'
                            : enough
                              ? 'text-text-muted'
                              : 'text-danger',
                        ].join(' ')}
                      >
                        {enough ? resolveLabels.balanceLabel : resolveLabels.insufficientLabel}
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Field>
      )}
    </div>
  );
}
