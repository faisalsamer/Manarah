'use client';

import { Archive, CheckCircle2, PiggyBank } from 'lucide-react';
import { Tabs, TabsItem, TabsList } from '@/components/ui/Tabs';
import { tabLabels } from '@/lib/marasi/labels';

export type MarasiTabValue = 'active' | 'reached' | 'cancelled';

export interface MarasiTabsProps {
  value: MarasiTabValue;
  onChange: (value: MarasiTabValue) => void;
  activeCount: number;
  reachedCount: number;
  cancelledCount: number;
  /** Highlight the active tab badge in red when any active marasi need attention. */
  activeUrgent?: boolean;
}

export function MarasiTabs({
  value,
  onChange,
  activeCount,
  reachedCount,
  cancelledCount,
  activeUrgent = false,
}: MarasiTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(v) => onChange(v as MarasiTabValue)}
      className="mb-8 sticky top-0 z-10 bg-page-bg/85 backdrop-blur-md -mx-6 sm:-mx-8 px-6 sm:px-8 pt-1"
    >
      <TabsList>
        <TabsItem
          value="active"
          icon={<PiggyBank size={16} />}
          count={activeCount}
          urgent={activeUrgent}
        >
          {tabLabels.active}
        </TabsItem>
        <TabsItem value="reached" icon={<CheckCircle2 size={16} />} count={reachedCount}>
          {tabLabels.reached}
        </TabsItem>
        <TabsItem value="cancelled" icon={<Archive size={16} />} count={cancelledCount}>
          {tabLabels.cancelled}
        </TabsItem>
      </TabsList>
    </Tabs>
  );
}
