'use client';

import { Hand, Zap } from 'lucide-react';
import { Callout } from '@/components/ui/Callout';
import { RadioCard, RadioCardGroup } from '@/components/ui/Form';
import { wizardLabels } from '@/lib/expenses/labels';
import type { ExpenseDraft, PaymentMode } from '@/lib/expenses/types';

export interface StepModeProps {
  data: ExpenseDraft;
  update: (patch: Partial<ExpenseDraft>) => void;
}

export function StepMode({ data, update }: StepModeProps) {
  const isManual = data.paymentMode === 'manual';
  const variableAuto = data.amountType === 'variable' && data.paymentMode === 'auto';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-h2 font-bold text-text-primary leading-tight mb-1">
          {wizardLabels.modeHeading}
        </p>
        <p className="text-body-sm text-text-secondary">
          {wizardLabels.modeHelper}
        </p>
      </div>

      <RadioCardGroup
        value={data.paymentMode}
        onChange={(value) => update({ paymentMode: value as PaymentMode })}
        columns={2}
      >
        <RadioCard
          value="auto"
          icon={<Zap size={20} />}
          title={wizardLabels.autoTitle}
          description={wizardLabels.autoSubtitle}
          example={wizardLabels.autoExample}
        />
        <RadioCard
          value="manual"
          icon={<Hand size={20} />}
          title={wizardLabels.manualTitle}
          description={wizardLabels.manualSubtitle}
          example={wizardLabels.manualExample}
        />
      </RadioCardGroup>

      {isManual && (
        <Callout
          variant="info"
          title={wizardLabels.manualInfoTitle}
          description={wizardLabels.manualInfoBody}
        />
      )}

      {variableAuto && (
        <Callout variant="warning" description={wizardLabels.variableAutoNote} />
      )}
    </div>
  );
}
