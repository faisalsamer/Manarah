'use client';

import { Field, Input, MoneyInput } from '@/components/ui/Form';
import { wizardLabels } from '@/lib/marasi/labels';
import type { MarsaDraft } from '@/lib/marasi/types';

const minTargetDate = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
};

export interface StepTargetProps {
  data: MarsaDraft;
  update: (patch: Partial<MarsaDraft>) => void;
}

export function StepTarget({ data, update }: StepTargetProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-h2 font-bold text-text-primary leading-tight mb-1">
          {wizardLabels.targetHeading}
        </p>
        <p className="text-body-sm text-text-secondary">
          {wizardLabels.targetHelper}
        </p>
      </div>

      <Field label={wizardLabels.targetAmountLabel} required>
        <MoneyInput
          value={data.targetAmount}
          onChange={(e) => update({ targetAmount: e.target.value })}
          placeholder="0.00"
        />
      </Field>

      <Field
        label={wizardLabels.targetDateLabel}
        hint={wizardLabels.targetDateHint}
        required
      >
        <Input
          type="date"
          fullWidth={false}
          min={minTargetDate()}
          value={data.targetDate}
          onChange={(e) => update({ targetDate: e.target.value })}
          className="w-56 font-numbers"
        />
      </Field>
    </div>
  );
}
