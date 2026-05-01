'use client';

import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  PiggyBank,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { Badge } from '@/components/ui/Badge';
import {
  goalActionRequiredLabel,
  goalReadyToWithdrawTag,
  goalStatusLabels,
  goalWithdrawnTag,
} from '@/lib/marasi/labels';
import type { MarsaStatus } from '@/lib/marasi/types';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'primary' | 'neutral';

interface StatusVisual {
  variant: BadgeVariant;
  Icon: ComponentType<{ size?: number | string; className?: string; strokeWidth?: number }>;
}

const statusVisual: Record<MarsaStatus, StatusVisual> = {
  active:    { variant: 'primary', Icon: PiggyBank },
  reached:   { variant: 'success', Icon: CheckCircle2 },
  cancelled: { variant: 'neutral', Icon: Archive },
};

export interface MarsaStatusBadgeProps {
  status: MarsaStatus;
  /** When > 0 on an active goal, override the badge to a "needs action" pill. */
  failedAttempts?: number;
  /** When true on a `reached` goal, mark it withdrawn. Ignored otherwise. */
  withdrawn?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function MarsaStatusBadge({
  status,
  failedAttempts = 0,
  withdrawn = false,
  size = 'sm',
  className,
}: MarsaStatusBadgeProps) {
  // Active + failures = action-needed override
  if (status === 'active' && failedAttempts > 0) {
    const iconSize = size === 'sm' ? 12 : 14;
    return (
      <Badge
        variant="danger"
        size={size}
        icon={<AlertTriangle size={iconSize} strokeWidth={2.25} />}
        className={className}
      >
        {goalActionRequiredLabel}
      </Badge>
    );
  }

  const visual = statusVisual[status];
  const { Icon } = visual;
  const iconSize = size === 'sm' ? 12 : 14;

  const isReachedAwaiting = status === 'reached' && !withdrawn;
  const isReachedWithdrawn = status === 'reached' && withdrawn;

  return (
    <Badge
      variant={visual.variant}
      size={size}
      icon={<Icon size={iconSize} strokeWidth={2.25} />}
      className={className}
    >
      {goalStatusLabels[status]}
      {isReachedAwaiting && ` · ${goalReadyToWithdrawTag}`}
      {isReachedWithdrawn && ` · ${goalWithdrawnTag}`}
    </Badge>
  );
}
