'use client';

import { Callout } from '@/components/ui/Callout';
import { Field, MoneyInput, RadioCard, RadioCardGroup } from '@/components/ui/Form';
import { commonLabels, wizardLabels } from '@/lib/expenses/labels';
import type { AmountType, ExpenseDraft } from '@/lib/expenses/types';

export interface StepAmountProps {
  data: ExpenseDraft;
  update: (patch: Partial<ExpenseDraft>) => void;
}

export function StepAmount({ data, update }: StepAmountProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-h2 font-bold text-text-primary leading-tight mb-1">
          {wizardLabels.amountHeading}
        </p>
        <p className="text-body-sm text-text-secondary">
          {wizardLabels.amountHelper}
        </p>
      </div>

      <RadioCardGroup
        value={data.amountType || undefined}
        onChange={(value) => {
          const next = value as AmountType;
          update({ amountType: next, amount: next === 'fixed' ? data.amount : '' });
        }}
        columns={2}
      >
        <RadioCard
          value="fixed"
          title={wizardLabels.fixedTitle}
          description={wizardLabels.fixedSubtitle}
          example={wizardLabels.fixedExample}
        />
        <RadioCard
          value="variable"
          title={wizardLabels.variableTitle}
          description={wizardLabels.variableSubtitle}
          example={wizardLabels.variableExample}
        />
      </RadioCardGroup>

      {data.amountType === 'fixed' && (
        <Field label={wizardLabels.amountLabel} required>
          <MoneyInput
            autoFocus
            value={data.amount}
            onChange={(e) => update({ amount: e.target.value })}
            placeholder="0.00"
            currency={commonLabels.currency}
          />
        </Field>
      )}

      {data.amountType === 'variable' && (
        <Callout variant="warning" description={wizardLabels.variableInfo} />
      )}
    </div>
  );
}
