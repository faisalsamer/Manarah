'use client';

import { ArrowUpRight, Building2, Clock, Hand, Trash2, Zap } from 'lucide-react';
import { IconButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  amountTypeLabels,
  commonLabels,
  paymentModeLabels,
  recurringLabels,
} from '@/lib/expenses/labels';
import type { BankVM, ExpenseVM, TransactionVM } from '@/lib/expenses/types';
import {
  findAccount,
  findBank,
  formatAmount,
  formatDate,
  formatSchedule,
  lastSignificantTransaction,
} from '@/lib/expenses/utils';
import { ExpenseStatusBadge } from './ExpenseStatusBadge';

export interface ExpenseCardProps {
  expense: ExpenseVM;
  transactions: TransactionVM[];
  banks: BankVM[];
  onOpen: (expenseId: string) => void;
  onDelete: (expenseId: string) => void;
}

export function ExpenseCard({
  expense,
  transactions,
  banks,
  onOpen,
  onDelete,
}: ExpenseCardProps) {
  const bank = findBank(banks, expense.bankId);
  const account = findAccount(banks, expense.bankId, expense.accountId);
  const last = lastSignificantTransaction(transactions);
  const isFixed = expense.amountType === 'fixed';

  return (
    <div className="group bg-card-bg border border-border hover:border-border-strong rounded-md transition-colors">
      <div className="flex items-stretch">
        {/* accent bar */}
        <div
          aria-hidden
          className="w-1 self-stretch rounded-r-md"
          style={{
            backgroundColor: isFixed
              ? 'var(--color-primary-400)'
              : 'var(--color-warning)',
          }}
        />

        <button
          type="button"
          onClick={() => onOpen(expense.id)}
          className="flex-1 p-5 flex items-center justify-between gap-6 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 rounded-md"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-body-lg font-semibold text-text-primary truncate">
                {expense.title}
              </h3>
              <Badge size="sm" variant="subtle">
                {amountTypeLabels[expense.amountType]}
              </Badge>
              {expense.paymentMode === 'manual' ? (
                <Badge size="sm" variant="info" icon={<Hand size={10} strokeWidth={2.5} />}>
                  {paymentModeLabels.manual}
                </Badge>
              ) : (
                <Badge size="sm" variant="primary" icon={<Zap size={10} strokeWidth={2.5} />}>
                  {paymentModeLabels.auto}
                </Badge>
              )}
              {last && <ExpenseStatusBadge status={last.status} retryCount={last.retryCount} />}
            </div>

            {expense.description && (
              <p className="text-body-sm text-text-secondary mb-2 truncate">
                {expense.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-caption text-text-secondary flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <Building2 size={12} />
                {bank?.name} · {account?.label} {account?.accountNumber}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={12} />
                {formatSchedule(expense)}
              </span>
              {last?.executedAt && (
                <span className="inline-flex items-center gap-1.5 text-text-muted">
                  {recurringLabels.cardLastRun}: {formatDate(last.executedAt)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-left font-numbers">
              {isFixed ? (
                <>
                  <div className="text-h2 font-bold text-text-primary leading-none">
                    {formatAmount(expense.amount)}{' '}
                    <span className="text-caption text-text-muted">
                      {commonLabels.currency}
                    </span>
                  </div>
                  <div className="text-caption uppercase tracking-wider text-text-muted mt-1 font-arabic">
                    {recurringLabels.perCycle}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-h3 italic text-text-muted leading-none font-arabic">
                    {recurringLabels.variableTbd}
                  </div>
                </>
              )}
            </div>
            <ArrowUpRight
              size={16}
              className="text-text-muted group-hover:text-text-primary transition-colors"
            />
          </div>
        </button>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center px-3">
          <IconButton
            icon={<Trash2 size={16} />}
            ariaLabel={commonLabels.delete}
            variant="danger"
            size="sm"
            onClick={() => onDelete(expense.id)}
          />
        </div>
      </div>
    </div>
  );
}
