'use client';

import { ArrowDownLeft, ArrowUpRight, RotateCw } from 'lucide-react';
import type { ComponentType } from 'react';
import { Badge } from '@/components/ui/Badge';
import { txTypeLabels } from '@/lib/marasi/labels';
import type { MarsaTxType } from '@/lib/marasi/types';

type BadgeVariant = 'primary' | 'success' | 'warning';

interface TypeVisual {
  variant: BadgeVariant;
  Icon: ComponentType<{ size?: number | string; className?: string; strokeWidth?: number }>;
}

const typeVisual: Record<MarsaTxType, TypeVisual> = {
  auto_debit:   { variant: 'primary', Icon: RotateCw },
  manual_topup: { variant: 'success', Icon: ArrowDownLeft },
  release:      { variant: 'warning', Icon: ArrowUpRight },
};

export interface MarsaTxTypeBadgeProps {
  type: MarsaTxType;
  size?: 'sm' | 'md';
  className?: string;
}

export function MarsaTxTypeBadge({ type, size = 'sm', className }: MarsaTxTypeBadgeProps) {
  const visual = typeVisual[type];
  const { Icon } = visual;
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <Badge
      variant={visual.variant}
      size={size}
      icon={<Icon size={iconSize} strokeWidth={2.25} />}
      className={className}
    >
      {txTypeLabels[type]}
    </Badge>
  );
}
