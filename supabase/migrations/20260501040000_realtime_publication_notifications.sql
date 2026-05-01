-- Add notification tables to the Supabase realtime publication so the
-- browser can receive postgres_changes events for them.
--
-- Without this, `useRealtimeRefetch` subscribes successfully but the channel
-- never fires — Supabase only forwards changes for tables that are members
-- of the `supabase_realtime` publication.
--
-- Idempotent: each ADD is guarded by a pg_publication_tables check, so this
-- migration is safe to re-apply (e.g. after `supabase db reset`).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'expense_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.expense_notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'marasi_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.marasi_notifications;
  END IF;
END $$;
