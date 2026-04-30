'use client';

import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeMap: Record<SpinnerSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 28,
  xl: 40,
};

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: ReactNode;
  fullArea?: boolean;
  tone?: 'primary' | 'muted' | 'inverse';
}

const toneClasses: Record<NonNullable<SpinnerProps['tone']>, string> = {
  primary: 'text-primary-400',
  muted: 'text-text-muted',
  inverse: 'text-white',
};

export function Spinner({
  size = 'md',
  className = '',
  label,
  fullArea = false,
  tone = 'primary',
}: SpinnerProps) {
  const icon = (
    <Loader2
      size={sizeMap[size]}
      strokeWidth={2.25}
      className={['animate-spin', toneClasses[tone]].join(' ')}
    />
  );

  if (!label && !fullArea) {
    return <span className={['inline-flex', className].join(' ')}>{icon}</span>;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        fullArea
          ? 'flex flex-col items-center justify-center w-full py-12 gap-3'
          : 'inline-flex items-center gap-2',
        'text-text-secondary font-arabic',
        className,
      ].join(' ')}
    >
      {icon}
      {label && (
        <span className="text-body-sm">{label}</span>
      )}
    </div>
  );
}
