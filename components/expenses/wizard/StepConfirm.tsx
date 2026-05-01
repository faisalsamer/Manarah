'use client';

import {
  Building2,
  Calendar,
  FileText,
  Hand,
  Tag,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Callout } from '@/components/ui/Callout';
import { Money } from '@/components/ui/RiyalSign';
import { wizardLabels } from '@/lib/expenses/labels';
import type { BankVM, ExpenseDraft } from '@/lib/expenses/types';
import { findAccount, findBank, formatSchedule } from '@/lib/expenses/utils';

export interface StepConfirmProps {
  data: ExpenseDraft;
  banks: BankVM[];
}

export function StepConfirm({ data, banks }: StepConfirmProps) {
  const bank = findBank(banks, data.bankId);
  const account = findAccount(banks, data.bankId, data.accountId);

  const amountValue: ReactNode =
    data.amountType === 'fixed'
      ? <Money amount={data.amount} />
      : wizardLabels.summaryVariableAmount;

  // formatSchedule expects a partial expense shape — adapt the draft.
  const scheduleValue = data.unit
    ? formatSchedule({
        unit: data.unit,
        interval: data.interval,
        dayOfWeek: data.dayOfWeek,
        dayOfMonth: data.dayOfMonth,
        timeOfDay: data.timeOfDay,
      })
    : '';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-h2 font-bold text-text-primary leading-tight mb-1">
          {wizardLabels.confirmHeading}
        </p>
        <p className="text-body-sm text-text-secondary">
          {wizardLabels.confirmHelper}
        </p>
      </div>

      <div className="bg-card-bg border border-border rounded-md overflow-hidden">
        <SummaryRow icon={Tag} label={wizardLabels.summaryTitle} value={data.title} />
        {data.description && (
          <SummaryRow icon={FileText} label={wizardLabels.summaryDescription} value={data.description} />
        )}
        <SummaryRow
          icon={Building2}
          label={wizardLabels.summarySource}
          value={`${bank?.name ?? ''} · ${account?.label ?? ''} ${account?.accountNumber ?? ''}`.trim()}
        />
        <SummaryRow icon={Wallet} label={wizardLabels.summaryAmount} value={amountValue} accent />
        <SummaryRow icon={Calendar} label={wizardLabels.summarySchedule} value={scheduleValue} accent />
        <SummaryRow
          icon={data.paymentMode === 'auto' ? Zap : Hand}
          label={wizardLabels.summaryMode}
          value={
            data.paymentMode === 'auto'
              ? wizardLabels.summaryAutoMode
              : wizardLabels.summaryManualMode
          }
          last
        />
      </div>

      <Callout
        variant="warning"
        title={wizardLabels.retryNoteTitle}
        description={wizardLabels.retryNoteBody}
      />
    </div>
  );
}

interface SummaryRowProps {
  icon: LucideIcon;
  label: ReactNode;
  value: ReactNode;
  accent?: boolean;
  last?: boolean;
}

function SummaryRow({ icon: Icon, label, value, accent, last }: SummaryRowProps) {
  return (
    <div
      className={[
        'flex items-center gap-4 px-5 py-4',
        last ? '' : 'border-b border-border',
      ].join(' ')}
    >
      <div className="flex items-center justify-center size-8 shrink-0 rounded-xs bg-surface text-primary-500">
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-micro uppercase tracking-[0.15em] text-text-muted mb-0.5">
          {label}
        </div>
        <div
          className={[
            'truncate',
            accent
              ? 'text-h4 font-bold text-text-primary'
              : 'text-body-sm font-medium text-text-primary',
          ].join(' ')}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
