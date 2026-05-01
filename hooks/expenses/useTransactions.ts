'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiGet, apiSend } from '@/lib/api/client';
import type { TransactionStatus, TransactionVM } from '@/lib/expenses/types';

interface Options {
  expenseId?: string;
  /** Restrict to a fixed set of statuses (e.g. action-required tab fetches `['failed', 'awaiting_confirmation']`). */
  statuses?: TransactionStatus[];
  /** Skip the fetch entirely (e.g. while the parent doesn't yet have an expense to filter by). Defaults to true. */
  enabled?: boolean;
}

export function useTransactions(opts: Options = {}) {
  const { expenseId, statuses, enabled = true } = opts;
  // Stabilize the statuses array key so a fresh array reference per render
  // doesn't trigger an infinite refetch loop.
  const statusesKey = useMemo(() => statuses?.slice().sort().join(',') ?? '', [statuses]);

  const [data, setData] = useState<TransactionVM[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (expenseId) params.set('expenseId', expenseId);
      if (statusesKey) params.set('statuses', statusesKey);
      const qs = params.toString();
      const list = await apiGet<TransactionVM[]>(`/api/transactions${qs ? `?${qs}` : ''}`);
      setData(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [enabled, expenseId, statusesKey]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refetch(); }, [refetch]);

  const skip = useCallback(
    async (txId: string): Promise<TransactionVM> => {
      const updated = await apiSend<TransactionVM>(
        `/api/transactions/${txId}/skip`,
        'POST',
        {},
      );
      await refetch();
      return updated;
    },
    [refetch],
  );

  const confirm = useCallback(
    async (txId: string, amount: string): Promise<TransactionVM> => {
      const updated = await apiSend<TransactionVM>(
        `/api/transactions/${txId}/confirm`,
        'POST',
        { amount },
      );
      await refetch();
      return updated;
    },
    [refetch],
  );

  const resolve = useCallback(
    async (
      txId: string,
      args: { bankId: string; accountId: string; updateLinked: boolean },
    ): Promise<TransactionVM> => {
      const updated = await apiSend<TransactionVM>(
        `/api/transactions/${txId}/resolve`,
        'POST',
        args,
      );
      await refetch();
      return updated;
    },
    [refetch],
  );

  return { data, loading, error, refetch, skip, confirm, resolve };
}

// ─── Server-paginated read for the History view ──────────────
interface PageOptions {
  page: number;
  pageSize: number;
  /** `'all'` (or omitted) returns rows across every status. */
  status?: TransactionStatus | 'all';
  expenseId?: string;
}

interface TransactionsPageResponse {
  items: TransactionVM[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Server-side paginated transactions. Use this for long ledgers (history
 * table) instead of `useTransactions` so we never download the whole list.
 */
export function useTransactionsPage(opts: PageOptions) {
  const { page, pageSize, status, expenseId } = opts;
  const [data, setData] = useState<TransactionVM[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (status && status !== 'all') params.set('status', status);
      if (expenseId) params.set('expenseId', expenseId);
      const result = await apiGet<TransactionsPageResponse>(
        `/api/transactions/page?${params.toString()}`,
      );
      setData(result.items);
      setTotal(result.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, status, expenseId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refetch(); }, [refetch]);

  return { data, total, loading, error, refetch, page, pageSize };
}

// ─── Counts (for tab badges) ────────────────────────────────
export interface TransactionsCounts {
  executed: number;
  actionRequired: number;
}

const ZERO_COUNTS: TransactionsCounts = { executed: 0, actionRequired: 0 };

export function useTransactionsCounts() {
  const [data, setData] = useState<TransactionsCounts>(ZERO_COUNTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiGet<TransactionsCounts>('/api/transactions/counts');
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}

// ─── Stats (for the History view's three top tiles) ─────────
export interface TransactionsStats {
  totalPaid: string;
  succeededCount: number;
  failedCount: number;
}

const ZERO_STATS: TransactionsStats = {
  totalPaid: '0',
  succeededCount: 0,
  failedCount: 0,
};

export function useTransactionsStats() {
  const [data, setData] = useState<TransactionsStats>(ZERO_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiGet<TransactionsStats>('/api/transactions/stats');
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}
