'use client';

import { Plus, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { pageLabels } from '@/lib/expenses/labels';

export interface ExpensesHeaderProps {
  onNewExpense: () => void;
}

export function ExpensesHeader({ onNewExpense }: ExpensesHeaderProps) {
  return (
    <header className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-10 mb-10 border-b border-border">
      <div className="min-w-0">
        <span
          className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-primary-50 text-primary-600 text-caption font-semibold tracking-[0.12em] uppercase"
        >
          <Repeat size={12} strokeWidth={2.5} />
          {pageLabels.eyebrow}
        </span>
        <h1 className="text-[28px] sm:text-[32px] font-bold text-text-primary leading-[1.15] mb-3">
          {pageLabels.title}
        </h1>
        <p className="text-body text-text-secondary max-w-xl leading-normal">
          {pageLabels.subtitle}
        </p>
      </div>
      <Button
        variant="primary"
        size="lg"
        startIcon={<Plus size={18} strokeWidth={2.5} />}
        onClick={onNewExpense}
        className="self-start sm:self-end shrink-0"
      >
        {pageLabels.newExpense}
      </Button>
    </header>
  );
}
