'use client';

import {
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  RotateCw,
  SkipForward,
  XCircle,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { Badge } from '@/components/ui/Badge';
import { statusLabels } from '@/lib/expenses/labels';
import type { TransactionStatus } from '@/lib/expenses/types';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

interface StatusVisual {
  variant: BadgeVariant;
  Icon: ComponentType<{ size?: number | string; className?: string; strokeWidth?: number }>;
  spin?: boolean;
}

const statusVisual: Record<TransactionStatus, StatusVisual> = {
  succeeded: { variant: 'success', Icon: CheckCircle2 },
  failed: { variant: 'danger', Icon: XCircle },
  retrying: { variant: 'warning', Icon: RotateCw, spin: true },
  awaiting_confirmation: { variant: 'info', Icon: HelpCircle },
  scheduled: { variant: 'neutral', Icon: Clock },
  skipped: { variant: 'neutral', Icon: SkipForward },
  processing: { variant: 'info', Icon: Loader2, spin: true },
};

export interface ExpenseStatusBadgeProps {
  status: TransactionStatus;
  retryCount?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function ExpenseStatusBadge({
  status,
  retryCount,
  size = 'sm',
  className,
}: ExpenseStatusBadgeProps) {
  const visual = statusVisual[status];
  const { Icon } = visual;
  const iconSize = size === 'sm' ? 12 : 14;

  const showRetryCount = status === 'retrying' && typeof retryCount === 'number';

  return (
    <Badge
      variant={visual.variant}
      size={size}
      icon={
        <Icon
          size={iconSize}
          strokeWidth={2.25}
          className={visual.spin ? 'animate-spin' : ''}
        />
      }
      className={className}
    >
      {statusLabels[status]}
      {showRetryCount && ` ${retryCount}/3`}
    </Badge>
  );
}
