'use client';

import { wizardLabels } from '@/lib/expenses/labels';
import type { BankVM, ExpenseDraft } from '@/lib/expenses/types';
import { BankAccountPicker } from '../BankAccountPicker';

export interface StepSourceProps {
  data: ExpenseDraft;
  banks: BankVM[];
  update: (patch: Partial<ExpenseDraft>) => void;
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
      />
    </div>
  );
}
