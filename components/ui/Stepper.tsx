'use client';

import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

export interface Step {
  id: string | number;
  label: ReactNode;
  icon?: ReactNode;
}

export interface StepperProps {
  steps: Step[];
  /** 0-based index of the active step */
  current: number;
  /** Hide step labels on small screens (always visible from sm: up). */
  hideLabelsOnMobile?: boolean;
  className?: string;
}

export function Stepper({
  steps,
  current,
  hideLabelsOnMobile = true,
  className = '',
}: StepperProps) {
  return (
    <ol
      className={[
        'flex items-center gap-2 font-arabic',
        className,
      ].join(' ')}
    >
      {steps.map((step, idx) => {
        const isActive = idx === current;
        const isDone = idx < current;
        const filled = isDone || isActive;
        return (
          <li
            key={step.id}
            className="flex items-center flex-1 last:flex-none gap-3 min-w-0"
            aria-current={isActive ? 'step' : undefined}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={[
                  'flex items-center justify-center size-8 rounded-full border-[1.5px] shrink-0',
                  'text-body-sm font-bold font-numbers',
                  'transition-all duration-[200ms]',
                  filled
                    ? 'bg-primary-400 text-white border-primary-400'
                    : 'bg-transparent text-text-muted border-border-strong',
                ].join(' ')}
              >
                {isDone ? (
                  <Check size={14} strokeWidth={3} />
                ) : (
                  step.icon ?? idx + 1
                )}
              </div>
              <span
                className={[
                  'text-body-sm truncate',
                  hideLabelsOnMobile ? 'hidden sm:inline' : '',
                  isActive
                    ? 'text-text-primary font-semibold'
                    : 'text-text-secondary',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                aria-hidden
                className={[
                  'flex-1 h-px transition-colors duration-[200ms]',
                  isDone
                    ? 'bg-primary-400'
                    : 'bg-border',
                ].join(' ')}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
