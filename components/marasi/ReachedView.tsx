'use client';

import { CheckCircle2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { reachedViewLabels } from '@/lib/marasi/labels';
import type { BankVM, MarsaVM } from '@/lib/marasi/types';
import { MarsaCard } from './MarsaCard';

export interface ReachedViewProps {
  marasi: MarsaVM[];
  banks: BankVM[];
  onOpen: (marsaId: string) => void;
}

export function ReachedView({ marasi, banks, onOpen }: ReachedViewProps) {
  if (marasi.length === 0) {
    return (
      <EmptyState
        bordered
        size="md"
        icon={<CheckCircle2 size={28} strokeWidth={1.75} />}
        title={reachedViewLabels.emptyTitle}
        description={reachedViewLabels.emptyDescription}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-h2 font-bold text-text-primary">
          {reachedViewLabels.sectionTitle}
        </h2>
        <span className="text-caption text-text-muted">
          {reachedViewLabels.sectionHint}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {marasi.map((m) => (
          <MarsaCard key={m.id} marsa={m} banks={banks} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}
