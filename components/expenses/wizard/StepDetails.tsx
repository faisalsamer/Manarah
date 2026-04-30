'use client';

import { Field, Input, Textarea } from '@/components/ui/Form';
import { wizardLabels } from '@/lib/expenses/labels';
import type { ExpenseDraft } from '@/lib/expenses/types';

export interface StepDetailsProps {
  data: ExpenseDraft;
  update: (patch: Partial<ExpenseDraft>) => void;
}

export function StepDetails({ data, update }: StepDetailsProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-h2 font-bold text-text-primary leading-tight mb-1">
          {wizardLabels.detailsHeading}
        </p>
        <p className="text-body-sm text-text-secondary">
          {wizardLabels.detailsHelper}
        </p>
      </div>

      <Field label={wizardLabels.titleLabel} required>
        <Input
          autoFocus
          value={data.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder={wizardLabels.titlePlaceholder}
        />
      </Field>

      <Field label={wizardLabels.descriptionLabel} hint={wizardLabels.descriptionHint}>
        <Textarea
          value={data.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder={wizardLabels.descriptionPlaceholder}
          rows={3}
        />
      </Field>
    </div>
  );
}
