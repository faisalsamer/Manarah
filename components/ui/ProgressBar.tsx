'use client';

import type { CSSProperties } from 'react';

type ProgressTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
type ProgressSize = 'sm' | 'md' | 'lg';

const heightClasses: Record<ProgressSize, string> = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2.5',
};

const fillClasses: Record<ProgressTone, string> = {
  primary: 'bg-primary-400',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  neutral: 'bg-text-muted',
};

export interface ProgressBarProps {
  /** 0–100 (clamped). */
  value: number;
  tone?: ProgressTone;
  size?: ProgressSize;
  /**
   * When true, renders an indeterminate shimmer using `progress-shimmer`
   * (defined in globals.css). Off by default.
   */
  indeterminate?: boolean;
  /** Optional aria label when no surrounding text describes the bar. */
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

export function ProgressBar({
  value,
  tone = 'primary',
  size = 'md',
  indeterminate = false,
  ariaLabel,
  className = '',
  style,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={[
        'relative w-full overflow-hidden rounded-full bg-progress-track',
        heightClasses[size],
        className,
      ].join(' ')}
      style={style}
    >
      <div
        className={[
          'h-full rounded-full transition-[width] duration-[600ms] ease-out',
          fillClasses[tone],
          indeterminate ? 'animate-pulse' : '',
        ].join(' ')}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
