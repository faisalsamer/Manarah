'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiSend } from '@/lib/api/client';
import type { ExpenseDraft, ExpenseVM } from '@/lib/expenses/types';

/**
 * Recurring expenses + the mutations that change them.
 * Mutations auto-refetch this hook's own list. If you need to refresh
 * `useTransactions` / `useLinkedBanks` after one of these (e.g. delete cascades
 * to transactions), call their `refetch` from the page.
 */
export function useExpenses() {
  const [data, setData] = useState<ExpenseVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const list = await apiGet<ExpenseVM[]>('/api/expenses');
      setData(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount + whenever `refetch` identity changes.
  // The rule fires because `refetch` calls `setState` — but that's exactly
  // what a fetch hook is for. Equivalent to TanStack Query's auto-fetch.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refetch(); }, [refetch]);

  const create = useCallback(
    async (draft: ExpenseDraft): Promise<ExpenseVM> => {
      const created = await apiSend<ExpenseVM>('/api/expenses', 'POST', draft);
      await refetch();
      return created;
    },
    [refetch],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      await apiSend<{ ok: true }>(`/api/expenses/${id}`, 'DELETE');
      await refetch();
    },
    [refetch],
  );

  return { data, loading, error, refetch, create, remove };
}
