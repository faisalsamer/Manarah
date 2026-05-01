'use client';

import { PiggyBank, Plus, TrendingUp, Wallet } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Money } from '@/components/ui/RiyalSign';
import {
  activeViewLabels,
  heroLabels,
  pageLabels,
} from '@/lib/marasi/labels';
import type { BankVM, MarsaVM } from '@/lib/marasi/types';
import { monthlyCommitment } from '@/lib/marasi/utils';
import { HeroStat } from './HeroStat';
import { MarsaCard } from './MarsaCard';

export interface ActiveViewProps {
  marasi: MarsaVM[];
  banks: BankVM[];
  onOpen: (marsaId: string) => void;
  onNewMarsa: () => void;
}

export function ActiveView({ marasi, banks, onOpen, onNewMarsa }: ActiveViewProps) {
  const totalSaved = useMemo(
    () => marasi.reduce((sum, m) => sum + parseFloat(m.currentBalance), 0),
    [marasi],
  );
  const monthly = useMemo(() => monthlyCommitment(marasi), [marasi]);

  if (marasi.length === 0) {
    return (
      <EmptyState
        bordered
        size="md"
        icon={<PiggyBank size={28} strokeWidth={1.75} />}
        title={activeViewLabels.emptyTitle}
        description={activeViewLabels.emptyDescription}
        action={
          <Button variant="primary" startIcon={<Plus size={16} />} onClick={onNewMarsa}>
            {pageLabels.newMarsa}
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <HeroStat
          tone="primary"
          icon={<PiggyBank size={20} strokeWidth={2.25} />}
          label={heroLabels.activeLabel}
          value={marasi.length}
          suffix={heroLabels.activeSuffix}
        />
        <HeroStat
          tone="primary"
          icon={<Wallet size={20} strokeWidth={2.25} />}
          label={heroLabels.totalSavedLabel}
          value={<Money amount={totalSaved} />}
          suffix={heroLabels.totalSavedSuffix}
        />
        <HeroStat
          tone="warning"
          icon={<TrendingUp size={20} strokeWidth={2.25} />}
          label={heroLabels.monthlyCommitLabel}
          value={<Money amount={monthly} />}
          suffix={heroLabels.monthlyCommitSuffix}
        />
      </div>

      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-h2 font-bold text-text-primary">
          {activeViewLabels.sectionTitle}
        </h2>
        <span className="text-caption text-text-muted">
          {activeViewLabels.sectionHint}
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
