'use client';

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import type { ReactNode } from 'react';

type CalloutVariant = 'info' | 'warning' | 'error' | 'success' | 'neutral';

interface VariantConfig {
  icon: ReactNode;
  bg: string;
  border: string;
  iconColor: string;
  titleColor: string;
}

const variantConfig: Record<CalloutVariant, VariantConfig> = {
  info: {
    icon: <Info size={18} strokeWidth={2.25} />,
    bg: 'bg-info-light',
    border: 'border-info/20',
    iconColor: 'text-info',
    titleColor: 'text-info',
  },
  warning: {
    icon: <AlertTriangle size={18} strokeWidth={2.25} />,
    bg: 'bg-warning-light',
    border: 'border-warning/25',
    iconColor: 'text-warning',
    titleColor: 'text-warning',
  },
  error: {
    icon: <AlertCircle size={18} strokeWidth={2.25} />,
    bg: 'bg-danger-light',
    border: 'border-danger/25',
    iconColor: 'text-danger',
    titleColor: 'text-danger',
  },
  success: {
    icon: <CheckCircle2 size={18} strokeWidth={2.25} />,
    bg: 'bg-success-light',
    border: 'border-success/20',
    iconColor: 'text-success',
    titleColor: 'text-success',
  },
  neutral: {
    icon: <Info size={18} strokeWidth={2.25} />,
    bg: 'bg-surface',
    border: 'border-border',
    iconColor: 'text-text-secondary',
    titleColor: 'text-text-primary',
  },
};

export interface CalloutProps {
  variant?: CalloutVariant;
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  onClose?: () => void;
  children?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function Callout({
  variant = 'info',
  title,
  description,
  icon,
  action,
  children,
  className = '',
  compact = false,
}: CalloutProps) {
  const config = variantConfig[variant];

  return (
    <div
      role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
      className={[
        'flex items-start gap-3 rounded-md border',
        compact ? 'p-3' : 'p-4',
        'font-arabic text-right',
        config.bg,
        config.border,
        className,
      ].join(' ')}
    >
      <div className={['flex-shrink-0 mt-0.5', config.iconColor].join(' ')}>
        {icon ?? config.icon}
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <div
            className={[
              'text-body font-semibold leading-snug',
              config.titleColor,
            ].join(' ')}
          >
            {title}
          </div>
        )}
        {description && (
          <div
            className={[
              title ? 'mt-1' : '',
              'text-body-sm text-text-primary leading-normal',
            ].join(' ')}
          >
            {description}
          </div>
        )}
        {children && (
          <div className={[title || description ? 'mt-2' : '', 'text-body-sm text-text-primary'].join(' ')}>
            {children}
          </div>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
