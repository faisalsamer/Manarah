'use client';

import { CalendarDays, CalendarRange, RotateCw } from 'lucide-react';
import { useMemo } from 'react';
import { Callout } from '@/components/ui/Callout';
import { Field, RadioCard, RadioCardGroup } from '@/components/ui/Form';
import { cycleWord, frequencyEveryLabels, wizardLabels } from '@/lib/marasi/labels';
import type { MarsaDraft, MarsaFrequency } from '@/lib/marasi/types';
import { calcPlan } from '@/lib/marasi/utils';

export interface StepFrequencyProps {
  data: MarsaDraft;
  update: (patch: Partial<MarsaDraft>) => void;
}

export function StepFrequency({ data, update }: StepFrequencyProps) {
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
          {wizardLabels.frequencyHeading}
        </p>
        <p className="text-body-sm text-text-secondary">
          {wizardLabels.frequencyHelper}
        </p>
      </div>

      <Field>
        <RadioCardGroup
          value={data.frequency || undefined}
          onChange={(v) => update({ frequency: v as MarsaFrequency })}
          columns={3}
        >
          <RadioCard
            value="weekly"
            icon={<RotateCw size={18} strokeWidth={2.25} />}
            title={wizardLabels.weeklyTitle}
            description={wizardLabels.weeklySubtitle}
            example={wizardLabels.weeklyExample}
          />
          <RadioCard
            value="biweekly"
            icon={<CalendarRange size={18} strokeWidth={2.25} />}
            title={wizardLabels.biweeklyTitle}
            description={wizardLabels.biweeklySubtitle}
            example={wizardLabels.biweeklyExample}
          />
          <RadioCard
            value="monthly"
            icon={<CalendarDays size={18} strokeWidth={2.25} />}
            title={wizardLabels.monthlyTitle}
            description={wizardLabels.monthlySubtitle}
            example={wizardLabels.monthlyExample}
          />
        </RadioCardGroup>
      </Field>

      <Callout
        variant={plan ? 'info' : 'neutral'}
        title={wizardLabels.planTitle}
        description={
          plan && data.frequency
            ? wizardLabels.planSummary(
                plan.periodicAmount,
                frequencyEveryLabels[data.frequency],
                cycleWord(plan.cycles),
              )
            : wizardLabels.planMissingDetails
        }
      />
    </div>
  );
}
