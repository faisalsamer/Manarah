-- Schedule the expenses orchestrator to run every 5 minutes.
--
-- Architecture: pg_cron fires every 5 min → calls `run_expense_cycle()` →
-- that function uses pg_net to POST our Next.js API route, which runs the
-- TypeScript orchestrator (materialize cycles, charge, retry, auto-skip,
-- notify). The DB function is intentionally a thin wrapper — all real logic
-- lives in TS so it can call the bank API + notification providers.

-- ─── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ─── The thin wrapper function ───────────────────────────────
-- For local dev: pg_cron runs inside the Supabase Docker container, so we
-- reach the host (where `next dev` runs) via host.docker.internal. In prod,
-- replace the URL with the deployed app URL and the secret with whatever
-- you've put in the deployment env (or, better, fetch from a Postgres GUC
-- via current_setting('app.cron_secret')).
CREATE OR REPLACE FUNCTION public.run_expense_cycle()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM net.http_post(
    url     := 'http://host.docker.internal:3000/api/cron/expenses',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-cron-secret', 'local-dev-cron-secret'
    ),
    body    := '{}'::jsonb
  );
END;
$$;

-- ─── Schedule every 5 minutes ────────────────────────────────
-- Idempotent: drop the existing schedule first if it exists.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expenses-tick') THEN
    PERFORM cron.unschedule('expenses-tick');
  END IF;
END $$;

SELECT cron.schedule(
  'expenses-tick',
  '*/5 * * * *',
  $$ SELECT public.run_expense_cycle(); $$
);
