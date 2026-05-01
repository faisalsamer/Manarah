'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiSend } from '@/lib/api/client';
import type { ExpenseNotificationVM } from '@/lib/expenses/notifications/types';
import { useRealtimeRefetch } from '../useRealtimeRefetch';

interface Options {
  unreadOnly?: boolean;
  limit?: number;
}

export function useNotifications(opts: Options = {}) {
  const { unreadOnly, limit } = opts;
  const [data, setData] = useState<ExpenseNotificationVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (unreadOnly) params.set('unread', 'true');
      if (limit) params.set('limit', String(limit));
      const qs = params.toString();
      const list = await apiGet<ExpenseNotificationVM[]>(
        `/api/notifications${qs ? `?${qs}` : ''}`,
      );
      setData(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [unreadOnly, limit]);

  // Initial fetch on mount + whenever `refetch` identity changes (filter options).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refetch(); }, [refetch]);

  // Live updates: refetch whenever a row is INSERTed (cron writes) or UPDATEd
  // (mark-as-read from another tab). Debounced inside the hook.
  useRealtimeRefetch({ table: 'expense_notifications', event: '*', onChange: refetch });

  const markRead = useCallback(
    async (id: string): Promise<ExpenseNotificationVM> => {
      const updated = await apiSend<ExpenseNotificationVM>(
        `/api/notifications/${id}`,
        'PATCH',
      );
      await refetch();
      return updated;
    },
    [refetch],
  );

  const markAllRead = useCallback(async (): Promise<number> => {
    const result = await apiSend<{ updated: number }>('/api/notifications', 'PATCH');
    await refetch();
    return result.updated;
  }, [refetch]);

  return { data, loading, error, refetch, markRead, markAllRead };
}
