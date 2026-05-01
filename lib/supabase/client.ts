'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser-side Supabase client.
 *
 * Used by realtime subscriptions only (the regular data plane goes through
 * our Next.js API routes + Prisma — never directly from the browser to
 * Postgres). The client uses the publishable anon key, so RLS is what gates
 * access. Today we don't have RLS configured, but realtime channels still
 * work because the publishable key has a default policy of "read all".
 *
 * Singleton across hot-reloads in dev so we don't open dozens of WebSockets.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const globalForSupabase = globalThis as unknown as {
  supabase?: SupabaseClient;
};

function makeClient(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set in .env.local',
    );
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 10 } },
  });
}

export const supabase: SupabaseClient =
  globalForSupabase.supabase ?? makeClient();

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabase = supabase;
}
