'use client';

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Info,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';

type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success' | 'question';

interface VariantConfig {
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  confirmVariant: 'primary' | 'danger';
}

const variantConfig: Record<ConfirmVariant, VariantConfig> = {
  danger: {
    icon: <AlertTriangle size={26} strokeWidth={2.25} />,
    iconBg: 'bg-[var(--color-danger-light)]',
    iconColor: 'text-[var(--color-danger)]',
    confirmVariant: 'danger',
  },
  warning: {
    icon: <AlertCircle size={26} strokeWidth={2.25} />,
    iconBg: 'bg-[var(--color-warning-light)]',
    iconColor: 'text-[var(--color-warning)]',
    confirmVariant: 'primary',
  },
  info: {
    icon: <Info size={26} strokeWidth={2.25} />,
    iconBg: 'bg-[var(--color-info-light)]',
    iconColor: 'text-[var(--color-info)]',
    confirmVariant: 'primary',
  },
  success: {
    icon: <CheckCircle2 size={26} strokeWidth={2.25} />,
    iconBg: 'bg-[var(--color-success-light)]',
    iconColor: 'text-[var(--color-success)]',
    confirmVariant: 'primary',
  },
  question: {
    icon: <HelpCircle size={26} strokeWidth={2.25} />,
    iconBg: 'bg-[var(--color-primary-50)]',
    iconColor: 'text-[var(--color-primary-400)]',
    confirmVariant: 'primary',
  },
};

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  hideCancel?: boolean;
  icon?: ReactNode;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  variant = 'question',
  loading: controlledLoading,
  hideCancel = false,
  icon,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isControlled = controlledLoading !== undefined;
  const loading = isControlled ? !!controlledLoading : internalLoading;
  const config = variantConfig[variant];

  const handleConfirm = async () => {
    try {
      if (!isControlled) setInternalLoading(true);
      await onConfirm();
    } finally {
      if (!isControlled) setInternalLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? () => {} : onClose}
      size="sm"
      showCloseButton={false}
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <div className="flex flex-col items-center text-center pt-6 pb-2">
        <div
          className={[
            'flex items-center justify-center size-14 rounded-full mb-4',
            config.iconBg,
            config.iconColor,
          ].join(' ')}
        >
          {icon ?? config.icon}
        </div>

        <h2 className="text-[var(--text-h3)] font-bold text-[var(--color-text-primary)] leading-[var(--leading-tight)]">
          {title}
        </h2>

        {description && (
          <p className="mt-2 max-w-[36ch] text-[var(--text-body-sm)] text-[var(--color-text-secondary)] leading-[var(--leading-normal)]">
            {description}
          </p>
        )}

        <div className="flex w-full gap-3 mt-6">
          {!hideCancel && (
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              fullWidth
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            variant={config.confirmVariant}
            onClick={handleConfirm}
            loading={loading}
            fullWidth
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
