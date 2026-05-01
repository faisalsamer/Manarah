'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiSend } from '@/lib/api/client';
import type { MarsaDraft, MarsaTransactionVM, MarsaVM } from '@/lib/marasi/types';

/**
 * Marasi (savings goals) + the mutations that change them.
 * Each mutation refetches the goal list. Sibling lists
 * (`useMarasiTransactions`, `useMarasiNotifications`, `useLinkedBanks`) need
 * to be refetched from the page after mutations that affect them — e.g.:
 *   - `topUp` and `retry` create new transactions and may change balances
 *   - `release` empties a goal and creates a release transaction
 */
export function useMarasi() {
  const [data, setData] = useState<MarsaVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const list = await apiGet<MarsaVM[]>('/api/marasi');
      setData(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refetch(); }, [refetch]);

  const create = useCallback(
    async (draft: MarsaDraft): Promise<MarsaVM> => {
      const created = await apiSend<MarsaVM>('/api/marasi', 'POST', draft);
      await refetch();
      return created;
    },
    [refetch],
  );

  const topUp = useCallback(
    async (marsaId: string, amount: string): Promise<MarsaTransactionVM> => {
      const tx = await apiSend<MarsaTransactionVM>(
        `/api/marasi/${marsaId}/topup`,
        'POST',
        { amount },
      );
      await refetch();
      return tx;
    },
    [refetch],
  );

  const release = useCallback(
    async (
      marsaId: string,
      args: {
        mode: 'release' | 'cancel';
        destinationBankId: string;
        destinationAccountId: string;
      },
    ): Promise<MarsaVM> => {
      const goal = await apiSend<MarsaVM>(
        `/api/marasi/${marsaId}/release`,
        'POST',
        args,
      );
      await refetch();
      return goal;
    },
    [refetch],
  );

  const retry = useCallback(
    async (marsaId: string): Promise<MarsaTransactionVM> => {
      const tx = await apiSend<MarsaTransactionVM>(
        `/api/marasi/${marsaId}/retry`,
        'POST',
        {},
      );
      await refetch();
      return tx;
    },
    [refetch],
  );

  const changeSource = useCallback(
    async (
      marsaId: string,
      args: { bankId: string; accountId: string },
    ): Promise<MarsaVM> => {
      const goal = await apiSend<MarsaVM>(
        `/api/marasi/${marsaId}/source`,
        'PATCH',
        args,
      );
      await refetch();
      return goal;
    },
    [refetch],
  );

  return {
    data,
    loading,
    error,
    refetch,
    create,
    topUp,
    release,
    retry,
    changeSource,
  };
}
