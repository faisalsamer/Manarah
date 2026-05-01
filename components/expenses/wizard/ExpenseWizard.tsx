'use client';

import {
  Bell,
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Tag,
  Wallet,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Stepper, type Step } from '@/components/ui/Stepper';
import { wizardLabels } from '@/lib/expenses/labels';
import type { BankVM, ExpenseDraft } from '@/lib/expenses/types';
import { StepAmount } from './StepAmount';
import { StepConfirm } from './StepConfirm';
import { StepDetails } from './StepDetails';
import { StepMode } from './StepMode';
import { StepSchedule } from './StepSchedule';
import { StepSource } from './StepSource';

export interface ExpenseWizardProps {
  open: boolean;
  onClose: () => void;
  /** May return a Promise — the wizard awaits it and shows a loading button. */
  onSubmit: (draft: ExpenseDraft) => void | Promise<void>;
  banks: BankVM[];
}

const TOTAL_STEPS = 6;

const STEPS: Step[] = [
  { id: 1, label: wizardLabels.steps.details, icon: <Tag size={14} /> },
  { id: 2, label: wizardLabels.steps.source, icon: <Building2 size={14} /> },
  { id: 3, label: wizardLabels.steps.amount, icon: <Wallet size={14} /> },
  { id: 4, label: wizardLabels.steps.schedule, icon: <Calendar size={14} /> },
  { id: 5, label: wizardLabels.steps.mode, icon: <Bell size={14} /> },
  { id: 6, label: wizardLabels.steps.confirm, icon: <Check size={14} /> },
];

const emptyDraft = (): ExpenseDraft => ({
  title: '',
  description: '',
  bankId: '',
  accountId: '',
  amountType: '',
  amount: '',
  unit: '',
  interval: 1,
  dayOfWeek: 'sun',
  dayOfMonth: 1,
  timeOfDay: '09:00',
  paymentMode: 'auto',
});

export function ExpenseWizard({ open, onClose, onSubmit, banks }: ExpenseWizardProps) {
  const [step, setStep] = useState(0); // 0-based
  const [data, setData] = useState<ExpenseDraft>(emptyDraft);
  const [submitting, setSubmitting] = useState(false);

  const update = (patch: Partial<ExpenseDraft>) =>
    setData((prev) => ({ ...prev, ...patch }));

  const canProceed = useMemo(() => {
    switch (step) {
      case 0:
        return data.title.trim().length > 0;
      case 1:
        return !!data.bankId && !!data.accountId;
      case 2:
        if (!data.amountType) return false;
        if (data.amountType === 'fixed') return !!data.amount && parseFloat(data.amount) > 0;
        return true;
      case 3:
        if (!data.unit || !data.interval || data.interval < 1 || !data.timeOfDay) return false;
        if (data.unit === 'week' && !data.dayOfWeek) return false;
        if (data.unit === 'month' && (!data.dayOfMonth || data.dayOfMonth < 1 || data.dayOfMonth > 31)) {
          return false;
        }
        return true;
      case 4:
        return data.paymentMode === 'auto' || data.paymentMode === 'manual';
      default:
        return true;
    }
  }, [step, data]);

  const handleNext = async () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(data);
      setData(emptyDraft());
      setStep(0);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (submitting) return;
    if (step > 0) setStep(step - 1);
  };

  const handleClose = () => {
    if (submitting) return;
    setData(emptyDraft());
    setStep(0);
    onClose();
  };

  let body: ReactNode = null;
  switch (step) {
    case 0:
      body = <StepDetails data={data} update={update} />;
      break;
    case 1:
      body = <StepSource data={data} banks={banks} update={update} />;
      break;
    case 2:
      body = <StepAmount data={data} update={update} />;
      break;
    case 3:
      body = <StepSchedule data={data} update={update} />;
      break;
    case 4:
      body = <StepMode data={data} update={update} />;
      break;
    case 5:
      body = <StepConfirm data={data} banks={banks} />;
      break;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      size="2xl"
      closeOnOverlayClick={!submitting}
      closeOnEscape={!submitting}
      showCloseButton={!submitting}
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
            disabled={step === 0 || submitting}
            onClick={handleBack}
          >
            {wizardLabels.back}
          </Button>
          <Button
            variant="primary"
            disabled={!canProceed || submitting}
            loading={submitting}
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
