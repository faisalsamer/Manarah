'use client';

import { History, Inbox, Repeat } from 'lucide-react';
import { Tabs, TabsItem, TabsList } from '@/components/ui/Tabs';
import { tabLabels } from '@/lib/expenses/labels';

export type ExpensesTabValue = 'recurring' | 'history' | 'action';

export interface ExpensesTabsProps {
  value: ExpensesTabValue;
  onChange: (value: ExpensesTabValue) => void;
  recurringCount: number;
  historyCount: number;
  actionCount: number;
}

export function ExpensesTabs({
  value,
  onChange,
  recurringCount,
  historyCount,
  actionCount,
}: ExpensesTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(v) => onChange(v as ExpensesTabValue)}
      className="mb-8 sticky top-0 z-10 bg-page-bg/85 backdrop-blur-md -mx-6 sm:-mx-8 px-6 sm:px-8 pt-1"
    >
      <TabsList>
        <TabsItem value="recurring" icon={<Repeat size={16} />} count={recurringCount}>
          {tabLabels.recurring}
        </TabsItem>
        <TabsItem value="history" icon={<History size={16} />} count={historyCount}>
          {tabLabels.history}
        </TabsItem>
        <TabsItem
          value="action"
          icon={<Inbox size={16} />}
          count={actionCount}
          urgent={actionCount > 0}
        >
          {tabLabels.action}
        </TabsItem>
      </TabsList>
    </Tabs>
  );
}
