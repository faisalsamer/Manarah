'use client';

import {
  Building2,
  Calendar,
  Repeat,
  Tag,
  Target,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { Callout } from '@/components/ui/Callout';
import { Money } from '@/components/ui/RiyalSign';
import {
  frequencyLabels,
  wizardLabels,
} from '@/lib/marasi/labels';
import type { BankVM, MarsaDraft } from '@/lib/marasi/types';
import {
  calcPlan,
  findAccount,
  findBank,
  formatDate,
} from '@/lib/marasi/utils';

export interface StepConfirmProps {
  data: MarsaDraft;
  banks: BankVM[];
}

export function StepConfirm({ data, banks }: StepConfirmProps) {
  const bank = findBank(banks, data.bankId);
  const account = findAccount(banks, data.bankId, data.accountId);

  const plan = useMemo(() => {
    if (!data.frequency || !data.targetAmount || !data.targetDate) return null;
    return calcPlan(
      parseFloat(data.targetAmount),
      0,
      data.frequency,
      data.targetDate,
    );
  }, [data.frequency, data.targetAmount, data.targetDate]);

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
        <SummaryRow icon={Tag} label={wizardLabels.summaryGoal} value={data.title} />
        <SummaryRow
          icon={Building2}
          label={wizardLabels.summarySource}
          value={`${bank?.name ?? ''} · ${account?.label ?? ''} ${account?.accountNumber ?? ''}`.trim()}
        />
        <SummaryRow
          icon={Target}
          label={wizardLabels.summaryTarget}
          value={<Money amount={data.targetAmount} />}
          accent
        />
        <SummaryRow
          icon={Calendar}
          label={wizardLabels.summaryDeadline}
          value={formatDate(data.targetDate)}
        />
        <SummaryRow
          icon={Repeat}
          label={wizardLabels.summaryFrequency}
          value={data.frequency ? frequencyLabels[data.frequency] : ''}
        />
        {plan && (
          <SummaryRow
            icon={TrendingUp}
            label={wizardLabels.summaryPerCycle}
            value={<Money amount={plan.periodicAmount} />}
            accent
          />
        )}
        {plan && (
          <SummaryRow
            icon={Calendar}
            label={wizardLabels.summaryFirstDeposit}
            value={formatDate(plan.firstDepositDate)}
            last
          />
        )}
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
