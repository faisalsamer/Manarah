'use client';

import type { ReactNode } from 'react';

type BadgeVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'subtle';
type BadgeSize = 'sm' | 'md';

const variantClasses: Record<BadgeVariant, string> = {
  neutral:
    'bg-surface text-text-secondary border-border',
  primary:
    'bg-primary-50 text-primary-600 border-primary-100',
  success:
    'bg-success-light text-success border-transparent',
  warning:
    'bg-warning-light text-warning border-transparent',
  danger:
    'bg-danger-light text-danger border-transparent',
  info:
    'bg-info-light text-info border-transparent',
  subtle:
    'bg-transparent text-text-muted border-border',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'h-5 px-2 gap-1 text-micro',
  md: 'h-6 px-2.5 gap-1.5 text-caption',
};

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  endIcon?: ReactNode;
  dot?: boolean;
  children?: ReactNode;
  className?: string;
}

export function Badge({
  variant = 'neutral',
  size = 'sm',
  icon,
  endIcon,
  dot = false,
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center justify-center whitespace-nowrap rounded-full border',
        'font-arabic font-semibold leading-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
    >
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {icon}
      {children}
      {endIcon}
    </span>
  );
}
