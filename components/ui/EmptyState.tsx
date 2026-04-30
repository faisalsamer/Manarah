'use client';

import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

type EmptyStateSize = 'sm' | 'md' | 'lg';

interface SizeConfig {
  padding: string;
  iconBox: string;
  iconSize: number;
  title: string;
  desc: string;
}

const sizeConfig: Record<EmptyStateSize, SizeConfig> = {
  sm: {
    padding: 'py-8 px-4',
    iconBox: 'size-12',
    iconSize: 22,
    title: 'text-body-lg',
    desc: 'text-body-sm',
  },
  md: {
    padding: 'py-12 px-6',
    iconBox: 'size-16',
    iconSize: 28,
    title: 'text-h3',
    desc: 'text-body',
  },
  lg: {
    padding: 'py-20 px-8',
    iconBox: 'size-20',
    iconSize: 36,
    title: 'text-h2',
    desc: 'text-body-lg',
  },
};

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  size?: EmptyStateSize;
  bordered?: boolean;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
  bordered = false,
  className = '',
}: EmptyStateProps) {
  const c = sizeConfig[size];
  return (
    <div
      className={[
        'flex flex-col items-center justify-center text-center',
        'font-arabic',
        c.padding,
        bordered
          ? 'rounded-md border border-dashed border-border-strong bg-surface'
          : '',
        className,
      ].join(' ')}
    >
      <div
        className={[
          'flex items-center justify-center rounded-full mb-4',
          'bg-surface text-text-muted',
          'border border-border',
          c.iconBox,
        ].join(' ')}
      >
        {icon ?? <Inbox size={c.iconSize} strokeWidth={1.75} />}
      </div>
      <div
        className={[
          'font-semibold text-text-primary leading-tight',
          c.title,
        ].join(' ')}
      >
        {title}
      </div>
      {description && (
        <div
          className={[
            'mt-2 max-w-[42ch] text-text-secondary leading-normal',
            c.desc,
          ].join(' ')}
        >
          {description}
        </div>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
