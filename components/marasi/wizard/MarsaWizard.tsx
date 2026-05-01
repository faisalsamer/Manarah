'use client';

import {
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Repeat,
  Tag,
  Target,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Stepper, type Step } from '@/components/ui/Stepper';
import { wizardLabels } from '@/lib/marasi/labels';
import type { BankVM, MarsaDraft } from '@/lib/marasi/types';
import { calcPlan } from '@/lib/marasi/utils';
import { StepConfirm } from './StepConfirm';
import { StepFrequency } from './StepFrequency';
import { StepGoal } from './StepGoal';
import { StepSource } from './StepSource';
import { StepTarget } from './StepTarget';

export interface MarsaWizardProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (draft: MarsaDraft) => void;
  banks: BankVM[];
}

const TOTAL_STEPS = 5;

const STEPS: Step[] = [
  { id: 1, label: wizardLabels.steps.goal,      icon: <Tag size={14} /> },
  { id: 2, label: wizardLabels.steps.target,    icon: <Target size={14} /> },
  { id: 3, label: wizardLabels.steps.frequency, icon: <Repeat size={14} /> },
  { id: 4, label: wizardLabels.steps.source,    icon: <Building2 size={14} /> },
  { id: 5, label: wizardLabels.steps.confirm,   icon: <Check size={14} /> },
];

const emptyDraft = (): MarsaDraft => ({
  title: '',
  bankId: '',
  accountId: '',
  targetAmount: '',
  targetDate: '',
  frequency: '',
});

export function MarsaWizard({ open, onClose, onSubmit, banks }: MarsaWizardProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<MarsaDraft>(emptyDraft);

  const update = (patch: Partial<MarsaDraft>) =>
    setData((prev) => ({ ...prev, ...patch }));

  const canProceed = useMemo(() => {
    switch (step) {
      case 0:
        return data.title.trim().length > 0;
      case 1: {
        if (!data.targetAmount || parseFloat(data.targetAmount) <= 0) return false;
        if (!data.targetDate) return false;
        // The target date must be at least one day in the future for calcPlan to succeed.
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(data.targetDate);
        target.setHours(0, 0, 0, 0);
        return target.getTime() > today.getTime();
      }
      case 2:
        if (!data.frequency) return false;
        return (
          calcPlan(parseFloat(data.targetAmount), 0, data.frequency, data.targetDate) !==
          null
        );
      case 3:
        return !!data.bankId && !!data.accountId;
      default:
        return true;
    }
  }, [step, data]);

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      onSubmit(data);
      setData(emptyDraft());
      setStep(0);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleClose = () => {
    setData(emptyDraft());
    setStep(0);
    onClose();
  };

  let body: ReactNode = null;
  switch (step) {
    case 0:
      body = <StepGoal data={data} update={update} />;
      break;
    case 1:
      body = <StepTarget data={data} update={update} />;
      break;
    case 2:
      body = <StepFrequency data={data} update={update} />;
      break;
    case 3:
      body = <StepSource data={data} banks={banks} update={update} />;
      break;
    case 4:
      body = <StepConfirm data={data} banks={banks} />;
      break;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      size="2xl"
      title={
        <div>
          <div className="text-micro uppercase tracking-[0.2em] text-text-muted mb-1">
            {wizardLabels.stepOf(step + 1, TOTAL_STEPS)}
          </div>
          <div>{STEPS[step].label}</div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <Button
            variant="ghost"
            startIcon={<ChevronRight size={16} />}
            disabled={step === 0}
            onClick={handleBack}
          >
            {wizardLabels.back}
          </Button>
          <Button
            variant="primary"
            disabled={!canProceed}
            endIcon={step === TOTAL_STEPS - 1 ? <Check size={16} /> : <ChevronLeft size={16} />}
            onClick={handleNext}
          >
            {step === TOTAL_STEPS - 1 ? wizardLabels.submit : wizardLabels.next}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Stepper steps={STEPS} current={step} />
        {body}
      </div>
    </Dialog>
  );
}
