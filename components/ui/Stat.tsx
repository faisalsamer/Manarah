'use client';

import type { ReactNode } from 'react';

type StatTrend = 'up' | 'down' | 'flat';

const trendColor: Record<StatTrend, string> = {
  up: 'text-success',
  down: 'text-danger',
  flat: 'text-text-muted',
};

const trendArrow: Record<StatTrend, string> = {
  up: '↑',
  down: '↓',
  flat: '–',
};

export interface StatProps {
  label: ReactNode;
  value: ReactNode;
  suffix?: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  trend?: StatTrend;
  trendLabel?: ReactNode;
  accent?: boolean;
  className?: string;
}

export function Stat({
  label,
  value,
  suffix,
  hint,
  icon,
  trend,
  trendLabel,
  accent = false,
  className = '',
}: StatProps) {
  return (
    <div
      className={[
        'flex flex-col gap-1.5 p-5',
        'bg-card-bg',
        'font-arabic text-right',
        accent ? 'border-r-[3px] border-primary-400' : '',
        className,
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-caption uppercase tracking-[0.12em] text-text-muted font-semibold">
          {label}
        </span>
        {icon && <span className="text-text-muted">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2 font-numbers">
        <span className="text-h1 font-bold text-text-primary leading-tight">
          {value}
        </span>
        {suffix && (
          <span className="text-body-sm text-text-secondary">
            {suffix}
          </span>
        )}
      </div>
      {(trend || trendLabel || hint) && (
        <div className="flex items-center gap-1 text-caption">
          {trend && (
            <span aria-hidden className={trendColor[trend]}>
              {trendArrow[trend]}
            </span>
          )}
          {trendLabel && (
            <span className={trend ? trendColor[trend] : 'text-text-muted'}>
              {trendLabel}
            </span>
          )}
          {hint && (
            <span className="text-text-muted">{hint}</span>
          )}
        </div>
      )}
    </div>
  );
}

type StatGridColumns = 2 | 3 | 4;

const colsClass: Record<StatGridColumns, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-4',
};

export interface StatGridProps {
  children: ReactNode;
  columns?: StatGridColumns;
  className?: string;
}

export function StatGrid({ children, columns = 3, className = '' }: StatGridProps) {
  return (
    <div
      className={[
        'grid gap-px overflow-hidden',
        'rounded-md',
        'bg-border',
        'border border-border',
        colsClass[columns],
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
