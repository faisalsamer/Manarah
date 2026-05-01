'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '@/lib/api/client';
import type { BankVM } from '@/lib/expenses/types';

/**
 * The user's linked banks + accounts, with live balances pulled from the
 * bank API. Refetch after any operation that moves money (confirm / resolve)
 * so balances stay current.
 */
export function useLinkedBanks() {
  const [data, setData] = useState<BankVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const list = await apiGet<BankVM[]>('/api/banks/linked');
      setData(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}
