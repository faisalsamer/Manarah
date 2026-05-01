'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '@/lib/api/client';
import type { MarsaTransactionVM } from '@/lib/marasi/types';

interface Options {
  marsaId?: string;
}

/**
 * Marasi ledger entries. Pass `marsaId` to scope to one goal (used by the
 * drill sheet). No mutations live here — the actual writes go through
 * `useMarasi`'s `topUp` / `release` / `retry`. After those, call this hook's
 * `refetch` from the page.
 */
export function useMarasiTransactions(opts: Options = {}) {
  const { marsaId } = opts;
  const [data, setData] = useState<MarsaTransactionVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const url = marsaId
        ? `/api/marasi-transactions?marsaId=${encodeURIComponent(marsaId)}`
        : '/api/marasi-transactions';
      const list = await apiGet<MarsaTransactionVM[]>(url);
      setData(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [marsaId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}
