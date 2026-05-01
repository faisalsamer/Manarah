'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

type PgEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimeRefetchOptions {
  /** Postgres table to subscribe to (unqualified — implies `public`). */
  table: string;
  /**
   * Event(s) to listen for. `'*'` matches all. Defaults to `'INSERT'` since
   * notification streams only care about new rows arriving.
   */
  event?: PgEvent;
  /**
   * Channel name suffix — keeps subscriptions distinct when the same table
   * is watched from multiple places (e.g. unread vs all notifications).
   * Defaults to `'default'`.
   */
  channel?: string;
  /**
   * Called every time a matching change arrives. Debounced internally so a
   * burst of rows (e.g. orchestrator writing 5 notifications in a row) only
   * triggers one refetch.
   */
  onChange: () => void;
  /**
   * Pause the subscription. Useful when the parent hook hasn't loaded its
   * initial data yet, or the user is logged out.
   */
  enabled?: boolean;
  /** Debounce window in ms. Default 250. */
  debounceMs?: number;
}

/**
 * Subscribe to Postgres row changes via Supabase Realtime and call `onChange`
 * (debounced) whenever they fire.
 *
 * Designed as the realtime layer for fetch-style hooks: pair this with your
 * existing `useX` hook by passing its `refetch` as `onChange`. The hook keeps
 * the subscription open for the lifetime of the component and unsubscribes
 * cleanly on unmount.
 *
 * Filtering by user is intentionally not done here — the API endpoint that
 * `onChange` triggers is already user-scoped via `getCurrentUserId()`. We get
 * a few extra refetches in dev when multiple users exist, which is harmless.
 * Once RLS is configured the publishable-key channel will only see rows the
 * current user is allowed to see anyway.
 */
export function useRealtimeRefetch({
  table,
  event = 'INSERT',
  channel = 'default',
  onChange,
  enabled = true,
  debounceMs = 250,
}: RealtimeRefetchOptions): void {
  // Keep `onChange` reference stable across renders without resubscribing.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!enabled) return;

    const channelName = `realtime:${table}:${channel}`;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const trigger = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        onChangeRef.current();
      }, debounceMs);
    };

    // The cast on `event` is needed because Supabase narrows the listener
    // payload by event literal — we don't read the payload at all (we just
    // refetch), so the union is fine.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sub = supabase
      .channel(channelName)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event, schema: 'public', table },
        trigger,
      )
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(sub);
    };
  }, [table, event, channel, enabled, debounceMs]);
}
