-- Schedule the marasi orchestrator to run every 10 minutes.
--
-- Architecture mirrors the expenses cron: pg_cron fires → calls
-- `run_marasi_cycle()` → that function uses pg_net to POST our Next.js API
-- route, which runs the TypeScript orchestrator (materialize cycles → charge
-- due txs → process retries; auto-mark `reached` and cancel pending txs on
-- target hit). The DB function is a thin HTTP wrapper — all real logic lives
-- in TS so it can call the bank API + write notifications + anything else
-- our codebase already does.
--
-- Cadence: 10 minutes (vs. 5 for expenses). Marasi has lower throughput per
-- user (a few goals each on weekly/biweekly/monthly cadence) so a longer
-- tick still gives sub-hour responsiveness without churn.

-- Both extensions are already created by the expenses cron migration; the
-- IF NOT EXISTS guards make this idempotent.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ─── The thin wrapper function ───────────────────────────────
-- For local dev: pg_cron runs inside the Supabase Docker container, so we
-- reach the host (where `next dev` runs) via host.docker.internal. In prod,
-- replace the URL with the deployed app URL and the secret with whatever
-- you've put in the deployment env (or, better, fetch from a Postgres GUC
-- via current_setting('app.cron_secret')).
CREATE OR REPLACE FUNCTION public.run_marasi_cycle()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM net.http_post(
    url     := 'http://host.docker.internal:3000/api/cron/marasi',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-cron-secret', 'local-dev-cron-secret'
    ),
    body    := '{}'::jsonb
  );
END;
$$;

-- ─── Schedule every 10 minutes ───────────────────────────────
-- Idempotent: drop the existing schedule first if it exists.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'marasi-tick') THEN
    PERFORM cron.unschedule('marasi-tick');
  END IF;
END $$;

SELECT cron.schedule(
  'marasi-tick',
  '*/10 * * * *',
  $$ SELECT public.run_marasi_cycle(); $$
);
