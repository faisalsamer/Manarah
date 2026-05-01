'use client';

import type { ReactNode } from 'react';

type Tone = 'neutral' | 'primary' | 'warning' | 'danger' | 'info';

const toneStyles: Record<Tone, { iconBg: string; iconColor: string; ring: string }> = {
  neutral: {
    iconBg: 'bg-surface',
    iconColor: 'text-text-secondary',
    ring: 'border-border',
  },
  primary: {
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-500',
    ring: 'border-border',
  },
  warning: {
    iconBg: 'bg-warning-light',
    iconColor: 'text-warning',
    ring: 'border-border',
  },
  danger: {
    iconBg: 'bg-danger-light',
    iconColor: 'text-danger',
    ring: 'border-border',
  },
  info: {
    iconBg: 'bg-info-light',
    iconColor: 'text-info',
    ring: 'border-border',
  },
};

export interface HeroStatProps {
  label: ReactNode;
  value: ReactNode;
  suffix?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  className?: string;
}

/**
 * Marāsi-flavored stat card: rounded, elevated, with a tinted icon chip.
 * Lives in the marasi module rather than `components/ui/` so we keep the
 * generic `Stat` primitive untouched (mirrors `components/expenses/HeroStat`).
 */
export function HeroStat({
  label,
  value,
  suffix,
  icon,
  tone = 'neutral',
  className = '',
}: HeroStatProps) {
  const t = toneStyles[tone];

  return (
    <div
      className={[
        'flex items-start gap-4 p-5 rounded-lg bg-card-bg',
        'border shadow-xs hover:shadow-sm',
        'transition-shadow duration-[200ms]',
        'font-arabic',
        t.ring,
        className,
      ].join(' ')}
    >
      {icon && (
        <div
          className={[
            'shrink-0 flex items-center justify-center size-11 rounded-md',
            t.iconBg,
            t.iconColor,
          ].join(' ')}
        >
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-caption uppercase tracking-[0.12em] text-text-muted font-semibold">
          {label}
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap font-numbers">
          <span className="text-[26px] sm:text-[28px] font-bold text-text-primary leading-none truncate">
            {value}
          </span>
          {suffix && (
            <span className="text-body-sm text-text-secondary font-arabic">
              {suffix}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
