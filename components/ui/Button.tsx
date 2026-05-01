'use client';

import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';

const baseClasses =
  'inline-flex items-center justify-center font-semibold rounded-full whitespace-nowrap cursor-pointer ' +
  'font-[var(--font-arabic)] transition-all duration-[250ms] ease-out ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-400 text-white shadow-[0_4px_16px_rgba(0,196,140,0.25)] ' +
    'hover:bg-primary-500 hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(0,196,140,0.35)] ' +
    'active:translate-y-0 active:shadow-[0_4px_16px_rgba(0,196,140,0.25)]',
  outline:
    'bg-transparent text-primary-400 border-[1.5px] border-primary-400 ' +
    'hover:bg-primary-50',
  ghost:
    'bg-transparent text-[var(--color-text-secondary)] border-[1.5px] border-[var(--color-border)] ' +
    'hover:bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]',
  danger:
    'bg-[var(--color-danger)] text-white shadow-[0_4px_16px_rgba(229,57,53,0.25)] ' +
    'hover:bg-[#C62828] hover:-translate-y-px',
  link:
    'bg-transparent text-primary-400 underline-offset-4 ' +
    'hover:text-primary-500 hover:underline',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-[13px] h-8 px-3 gap-1.5',
  md: 'text-[14px] h-10 px-5 gap-2',
  lg: 'text-[15px] h-12 px-6 gap-2',
};

const linkSizeClasses: Record<ButtonSize, string> = {
  sm: 'text-[13px] gap-1 px-0 py-0 h-auto',
  md: 'text-[14px] gap-1.5 px-0 py-0 h-auto',
  lg: 'text-[15px] gap-1.5 px-0 py-0 h-auto',
};

const iconSize: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 18 };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  startIcon,
  endIcon,
  loading = false,
  fullWidth = false,
  type = 'button',
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const sizeCls = variant === 'link' ? linkSizeClasses[size] : sizeClasses[size];

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={[
        baseClasses,
        variantClasses[variant],
        sizeCls,
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <Loader2 size={iconSize[size]} className="animate-spin" />
      ) : (
        startIcon
      )}
      {children}
      {!loading && endIcon}
    </button>
  );
}

type IconButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'subtle';

const iconBtnVariant: Record<IconButtonVariant, string> = {
  primary:
    'bg-primary-400 text-white shadow-[0_4px_16px_rgba(0,196,140,0.25)] hover:bg-primary-500',
  outline:
    'bg-transparent text-primary-400 border-[1.5px] border-primary-400 hover:bg-primary-50',
  ghost:
    'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]',
  danger:
    'bg-transparent text-[var(--color-danger)] hover:bg-[var(--color-danger-light)]',
  subtle:
    'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] ' +
    'hover:border-[var(--color-border-strong)]',
};

const iconBtnSize: Record<ButtonSize, string> = {
  sm: 'size-7 rounded-md',
  md: 'size-9 rounded-lg',
  lg: 'size-11 rounded-lg',
};

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  ariaLabel: string;
  variant?: IconButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function IconButton({
  icon,
  ariaLabel,
  variant = 'subtle',
  size = 'md',
  loading = false,
  type = 'button',
  disabled,
  className = '',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center cursor-pointer transition-all duration-[250ms] ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        iconBtnSize[size],
        iconBtnVariant[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? <Loader2 size={iconSize[size]} className="animate-spin" /> : icon}
    </button>
  );
}

export interface ButtonGroupProps {
  children: ReactNode;
  className?: string;
}

export function ButtonGroup({ children, className = '' }: ButtonGroupProps) {
  return (
    <div className={['inline-flex items-center gap-2', className].join(' ')}>
      {children}
    </div>
  );
}
