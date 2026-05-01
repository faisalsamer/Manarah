'use client';

import { BankAccountPicker } from '@/components/expenses/BankAccountPicker';
import { wizardLabels } from '@/lib/marasi/labels';
import type { BankVM, MarsaDraft } from '@/lib/marasi/types';

export interface StepSourceProps {
  data: MarsaDraft;
  banks: BankVM[];
  update: (patch: Partial<MarsaDraft>) => void;
}

export function StepSource({ data, banks, update }: StepSourceProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-h2 font-bold text-text-primary leading-tight mb-1">
          {wizardLabels.sourceHeading}
        </p>
        <p className="text-body-sm text-text-secondary">
          {wizardLabels.sourceHelper}
        </p>
      </div>

      <BankAccountPicker
        banks={banks}
        bankId={data.bankId}
        accountId={data.accountId}
        onChange={({ bankId, accountId }) => update({ bankId, accountId })}
        bankLabel={wizardLabels.bankLabel}
        accountLabel={wizardLabels.accountLabel}
      />
    </div>
  );
}
