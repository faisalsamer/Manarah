'use client';

import { Callout } from '@/components/ui/Callout';
import { Field, Input, TimeInput } from '@/components/ui/Form';
import {
  dayOfWeekLabels,
  orderedDaysOfWeek,
  scheduleUnitLabels,
  wizardLabels,
} from '@/lib/expenses/labels';
import type { DayOfWeekId, ExpenseDraft, ScheduleUnit } from '@/lib/expenses/types';

const SCHEDULE_UNITS: ScheduleUnit[] = ['day', 'week', 'month'];

export interface StepScheduleProps {
  data: ExpenseDraft;
  update: (patch: Partial<ExpenseDraft>) => void;
}

export function StepSchedule({ data, update }: StepScheduleProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-h2 font-bold text-text-primary leading-tight mb-1">
          {wizardLabels.scheduleHeading}
        </p>
        <p className="text-body-sm text-text-secondary">
          {wizardLabels.scheduleHelper}
        </p>
      </div>

      <Field label={wizardLabels.unitLabel} required>
        <div className="grid grid-cols-3 gap-2">
          {SCHEDULE_UNITS.map((u) => {
            const active = data.unit === u;
            return (
              <button
                key={u}
                type="button"
                onClick={() => update({ unit: u })}
                aria-pressed={active}
                className={[
                  'px-4 py-3 rounded-sm border-[1.5px]',
                  'text-body-sm font-semibold',
                  'transition-all duration-[150ms]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2',
                  active
                    ? 'bg-primary-400 text-white border-primary-400'
                    : 'bg-card-bg border-border hover:border-border-strong',
                ].join(' ')}
              >
                {scheduleUnitLabels[u].one}
              </button>
            );
          })}
        </div>
      </Field>

      {data.unit && (
        <Field label={wizardLabels.intervalLabel(data.unit)} required>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={365}
              fullWidth={false}
              value={data.interval}
              onChange={(e) => update({ interval: parseInt(e.target.value, 10) || 1 })}
              className="w-24 text-center font-numbers"
            />
            <span className="text-body-sm text-text-secondary">
              {scheduleUnitLabels[data.unit][
                data.interval === 1 ? 'one' : data.interval === 2 ? 'two' : 'many'
              ]}
            </span>
          </div>
        </Field>
      )}

      {data.unit === 'week' && (
        <Field label={wizardLabels.dayOfWeekLabel} required>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {orderedDaysOfWeek.map((d: DayOfWeekId) => {
              const active = data.dayOfWeek === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => update({ dayOfWeek: d })}
                  aria-pressed={active}
                  className={[
                    'px-3 py-2.5 rounded-sm border-[1.5px]',
                    'text-body-sm font-semibold whitespace-nowrap',
                    'transition-all duration-[150ms]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2',
                    active
                      ? 'bg-primary-400 text-white border-primary-400'
                      : 'bg-card-bg border-border hover:border-border-strong',
                  ].join(' ')}
                >
                  {dayOfWeekLabels[d].full}
                </button>
              );
            })}
          </div>
        </Field>
      )}

      {data.unit === 'month' && (
        <Field label={wizardLabels.dayOfMonthLabel} required>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={31}
              fullWidth={false}
              value={data.dayOfMonth}
              onChange={(e) => update({ dayOfMonth: parseInt(e.target.value, 10) || 1 })}
              className="w-24 text-center font-numbers"
            />
            <span className="text-body-sm text-text-secondary">
              {data.dayOfMonth ? `يوم ${data.dayOfMonth}` : ''}
            </span>
          </div>
          <p className="mt-1.5 text-caption text-text-muted leading-snug">
            {wizardLabels.dayOfMonthHint}
          </p>
        </Field>
      )}

      {data.unit && (
        <Field label={wizardLabels.timeLabel} required>
          <TimeInput
            fullWidth={false}
            value={data.timeOfDay}
            onChange={(e) => update({ timeOfDay: e.target.value })}
            className="w-40 font-numbers"
          />
        </Field>
      )}

      {data.unit && data.timeOfDay && (
        <Callout
          variant="warning"
          title={wizardLabels.retryNoteTitle}
          description={wizardLabels.retryNoteBody}
        />
      )}
    </div>
  );
}
