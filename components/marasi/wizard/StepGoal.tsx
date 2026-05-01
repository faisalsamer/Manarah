'use client';

import { Field, Input } from '@/components/ui/Form';
import { wizardLabels } from '@/lib/marasi/labels';
import type { MarsaDraft } from '@/lib/marasi/types';

export interface StepGoalProps {
  data: MarsaDraft;
  update: (patch: Partial<MarsaDraft>) => void;
}

export function StepGoal({ data, update }: StepGoalProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-h2 font-bold text-text-primary leading-tight mb-1">
          {wizardLabels.goalHeading}
        </p>
        <p className="text-body-sm text-text-secondary">
          {wizardLabels.goalHelper}
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
    </div>
  );
}
