'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiSend } from '@/lib/api/client';
import type { MarsaNotificationVM } from '@/lib/marasi/notifications/types';
import { useRealtimeRefetch } from '../useRealtimeRefetch';

interface Options {
  unreadOnly?: boolean;
  limit?: number;
}

/**
 * Marasi in-app notifications. The cross-module bell (`NotificationBell`)
 * uses this hook alongside `useNotifications` (expenses) and merges both
 * streams into one chronological feed.
 */
export function useMarasiNotifications(opts: Options = {}) {
  const { unreadOnly, limit } = opts;
  const [data, setData] = useState<MarsaNotificationVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (unreadOnly) params.set('unread', 'true');
      if (limit) params.set('limit', String(limit));
      const qs = params.toString();
      const list = await apiGet<MarsaNotificationVM[]>(
        `/api/marasi-notifications${qs ? `?${qs}` : ''}`,
      );
      setData(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [unreadOnly, limit]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refetch(); }, [refetch]);

  // Live updates: refetch whenever a row is INSERTed (cron writes) or UPDATEd
  // (mark-as-read from another tab). Debounced inside the hook.
  useRealtimeRefetch({ table: 'marasi_notifications', event: '*', onChange: refetch });

  const markRead = useCallback(
    async (id: string): Promise<MarsaNotificationVM> => {
      const updated = await apiSend<MarsaNotificationVM>(
        `/api/marasi-notifications/${id}`,
        'PATCH',
      );
      await refetch();
      return updated;
    },
    [refetch],
  );

  const markAllRead = useCallback(async (): Promise<number> => {
    const result = await apiSend<{ updated: number }>('/api/marasi-notifications', 'PATCH');
    await refetch();
    return result.updated;
  }, [refetch]);

  return { data, loading, error, refetch, markRead, markAllRead };
}
