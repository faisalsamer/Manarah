-- ============================================================================
-- Complete Database Schema - Manarah Financial Platform
-- Integrates: Core, Expenses, Marasi (Savings), Zakat, AI Modules
-- All timestamps are TIMESTAMPTZ. Money is NUMERIC(15, 2).
-- ============================================================================

-- ─── Helper Functions ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS
  'Generic trigger function. Attach with: BEFORE UPDATE ON <table> FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();';

-- ─── Enums ──────────────────────────────────────────────────────────────────

-- Expenses Module Enums
CREATE TYPE public.amount_type AS ENUM ('fixed', 'variable');
CREATE TYPE public.schedule_unit AS ENUM ('day', 'week', 'month');
CREATE TYPE public.day_of_week AS ENUM ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');
CREATE TYPE public.payment_mode AS ENUM ('auto', 'manual');
CREATE TYPE public.expense_status AS ENUM ('active', 'paused', 'archived');
CREATE TYPE public.transaction_status AS ENUM ('scheduled', 'awaiting_confirmation', 'processing', 'retrying', 'succeeded', 'failed', 'skipped');
CREATE TYPE public.attempt_status AS ENUM ('info', 'succeeded', 'failed');
CREATE TYPE public.expense_notification_type AS ENUM ('payment_failed', 'awaiting_confirmation', 'all_retries_exhausted', 'auto_skipped');

-- Marasi Module Enums
CREATE TYPE public.marsa_status AS ENUM ('active', 'paused', 'reached', 'cancelled', 'archived');
CREATE TYPE public.marsa_frequency AS ENUM ('weekly', 'biweekly', 'monthly');
CREATE TYPE public.marsa_tx_type AS ENUM ('auto_debit', 'manual_topup', 'withdrawal', 'release');
CREATE TYPE public.marsa_tx_status AS ENUM ('scheduled', 'processing', 'retrying', 'succeeded', 'failed', 'cancelled');
CREATE TYPE public.marsa_attempt_status AS ENUM ('info', 'succeeded', 'failed');
CREATE TYPE public.marsa_notification_type AS ENUM ('deposit_failed', 'all_retries_exhausted', 'goal_reached', 'milestone_reached', 'upcoming_deposit');

-- Zakat Module Enums
CREATE TYPE public.nisab_standard AS ENUM ('SILVER', 'GOLD');
CREATE TYPE public.asset_type AS ENUM ('GOLD_SAVINGS', 'SILVER_SAVINGS', 'STOCKS', 'CONFIRMED_DEBTS', 'TRADE_GOODS', 'CASH', 'CUSTOM');
CREATE TYPE public.asset_status AS ENUM ('ACTIVE', 'ZAKAT_PAID', 'DELETED', 'EDITED');
CREATE TYPE public.hawl_status AS ENUM ('ACTIVE', 'BROKEN', 'COMPLETED', 'PENDING');
CREATE TYPE public.payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
CREATE TYPE public.asset_history_action AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'ZAKAT_PAID');

-- Shared Enums
CREATE TYPE public.notification_channel AS ENUM ('push', 'email', 'sms', 'in_app');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bank_id TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  is_connected BOOLEAN NOT NULL DEFAULT false,
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_banks_user ON public.banks(user_id);

CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id UUID NOT NULL REFERENCES public.banks(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_type TEXT NOT NULL,
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SAR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accounts_bank ON public.accounts(bank_id);

-- ============================================================================
-- EXPENSES MODULE
-- ============================================================================

CREATE TABLE public.recurring_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 100),
  description TEXT CHECK (description IS NULL OR length(description) <= 500),
  amount_type public.amount_type NOT NULL,
  amount NUMERIC(15, 2),
  unit public.schedule_unit NOT NULL,
  interval INTEGER NOT NULL CHECK (interval >= 1),
  day_of_week public.day_of_week,
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
  time_of_day TIME NOT NULL,
  payment_mode public.payment_mode NOT NULL DEFAULT 'auto',
  status public.expense_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT amount_required_when_fixed CHECK (
    (amount_type = 'fixed' AND amount IS NOT NULL) OR
    (amount_type = 'variable' AND amount IS NULL)
  ),
  CONSTRAINT day_of_week_only_when_weekly CHECK (
    (unit = 'week' AND day_of_week IS NOT NULL) OR
    (unit <> 'week' AND day_of_week IS NULL)
  ),
  CONSTRAINT day_of_month_only_when_monthly CHECK (
    (unit = 'month' AND day_of_month IS NOT NULL) OR
    (unit <> 'month' AND day_of_month IS NULL)
  )
);

CREATE INDEX idx_recurring_expenses_user ON public.recurring_expenses(user_id);
CREATE INDEX idx_recurring_expenses_account ON public.recurring_expenses(account_id);
CREATE INDEX idx_recurring_expenses_active ON public.recurring_expenses(status) WHERE status = 'active';

CREATE TRIGGER trg_recurring_expenses_set_updated_at
  BEFORE UPDATE ON public.recurring_expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.recurring_expenses IS
  'The recurrence rule (intent). Each row spawns many payment_transactions over time.';
COMMENT ON COLUMN public.recurring_expenses.account_id IS
  'The user-linked account this expense is paid from. ON DELETE RESTRICT prevents accidentally orphaning expenses when a bank is unlinked — the user must archive/delete the expense first.';
COMMENT ON COLUMN public.recurring_expenses.amount IS
  'Required when amount_type = fixed; must be NULL when amount_type = variable. Variable amounts are entered by the user each cycle on the awaiting_confirmation transaction.';
COMMENT ON COLUMN public.recurring_expenses.day_of_week IS
  'Only set when unit = week; otherwise NULL (enforced by check constraint).';
COMMENT ON COLUMN public.recurring_expenses.day_of_month IS
  'Only set when unit = month (1-31). If the chosen day does not exist in a given month (e.g. 31 in February, or 30/31 in shorter months), the payment runs on the closest earlier day that exists — i.e. the last available day of that month. Example: day_of_month = 31 executes on Feb 28 (or 29 in leap years), Apr 30, Jun 30, Sep 30, Nov 30. The original value is preserved here; the scheduler resolves the actual execution date at run time. The user is shown a note about this behavior in the wizard.';
COMMENT ON COLUMN public.recurring_expenses.time_of_day IS
  'Local time the payment should fire. Stored as TIME (no timezone). Combined with the user''s timezone at scheduling time.';
COMMENT ON COLUMN public.recurring_expenses.payment_mode IS
  'auto = charge on schedule without prompting. manual = notify user each cycle and require approval before debit. Manual cycles auto-skip after 24h of no response.';
COMMENT ON COLUMN public.recurring_expenses.status IS
  'active = generating cycles. paused = stop generating but keep history. archived = soft-deleted.';

CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_expense_id UUID NOT NULL REFERENCES public.recurring_expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  amount NUMERIC(15, 2),
  status public.transaction_status NOT NULL DEFAULT 'scheduled',
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count BETWEEN 0 AND 3),
  bank_ref TEXT,
  failure_reason TEXT,
  note TEXT,
  resolved_manually BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_transactions_expense ON public.payment_transactions(recurring_expense_id);
CREATE INDEX idx_payment_transactions_user ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX idx_payment_transactions_scheduled ON public.payment_transactions(scheduled_for);
CREATE INDEX idx_payment_transactions_pending
  ON public.payment_transactions(scheduled_for)
  WHERE status IN ('scheduled', 'awaiting_confirmation', 'retrying');

CREATE TRIGGER trg_payment_transactions_set_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.payment_transactions IS
  'A single billing cycle (the execution). One recurring_expense → many payment_transactions over time. Snapshot fields preserve the source account at execution time so history stays accurate even if the rule''s linked account changes later.';
COMMENT ON COLUMN public.payment_transactions.user_id IS
  'Denormalized from recurring_expenses for fast RLS and per-user queries. Set once on insert; never changes.';
COMMENT ON COLUMN public.payment_transactions.scheduled_for IS
  'When the payment is meant to fire. For day_of_month rules, this is already resolved (e.g. Feb 28 instead of Feb 31).';
COMMENT ON COLUMN public.payment_transactions.executed_at IS
  'When the payment actually went through. NULL until succeeded or, for failures, may remain NULL.';
COMMENT ON COLUMN public.payment_transactions.amount IS
  'NULL until known. For variable expenses this is filled when the user enters the amount; for fixed it is copied from the rule at scheduling time.';
COMMENT ON COLUMN public.payment_transactions.retry_count IS
  '0 = initial attempt only. 1-3 = automatic retries (every 3 hours). After retry_count = 3 the status flips to ''failed''.';
COMMENT ON COLUMN public.payment_transactions.bank_ref IS
  'Bank-issued reference returned by the gateway on success. NULL otherwise. This is the link to the bank''s own ledger (account_transactions.json).';
COMMENT ON COLUMN public.payment_transactions.resolved_manually IS
  'TRUE if a previously failed transaction was paid through the Resolve flow (i.e. user manually re-ran the payment, possibly from a different account).';

CREATE TABLE public.payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.payment_transactions(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL CHECK (attempt_number >= 0),
  at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status public.attempt_status NOT NULL,
  message TEXT NOT NULL CHECK (length(message) <= 500),
  gateway_code TEXT,
  gateway_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_attempts_transaction ON public.payment_attempts(transaction_id, at);

COMMENT ON TABLE public.payment_attempts IS
  'Immutable log: one row per gateway call or user action. Powers the per-payment timeline drilldown. No updated_at — rows are append-only.';
COMMENT ON COLUMN public.payment_attempts.attempt_number IS
  '0 = initial attempt. 1-3 = automatic retries. Manual resolutions / user actions also append here with a fresh attempt_number.';
COMMENT ON COLUMN public.payment_attempts.message IS
  'Human-readable log line shown to the user, e.g. "Declined by Al Rajhi: insufficient funds (balance SAR 540.00)".';
COMMENT ON COLUMN public.payment_attempts.gateway_code IS
  'Raw bank/gateway code (e.g. "INSUFFICIENT_FUNDS", "TIMEOUT"). Internal use; not shown to the user.';
COMMENT ON COLUMN public.payment_attempts.gateway_response IS
  'Full gateway payload for debugging. Internal use only.';

CREATE TABLE public.expense_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE CASCADE,
  type public.expense_notification_type NOT NULL,
  channel public.notification_channel NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expense_notifications_user ON public.expense_notifications(user_id, sent_at DESC);
CREATE INDEX idx_expense_notifications_unread ON public.expense_notifications(user_id, sent_at DESC) WHERE read_at IS NULL;

COMMENT ON TABLE public.expense_notifications IS
  'Outbound notifications. No updated_at — read_at is a one-shot write, not a generic mutation field.';

-- ============================================================================
-- MARASI MODULE (Savings)
-- مَرَاسِي · "harbors" · the savings module
-- ============================================================================

CREATE TABLE public.marasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 100),
  target_amount NUMERIC(15, 2) NOT NULL CHECK (target_amount > 0),
  periodic_amount NUMERIC(15, 2) NOT NULL CHECK (periodic_amount > 0),
  frequency public.marsa_frequency NOT NULL,
  target_date DATE NOT NULL,
  current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  status public.marsa_status NOT NULL DEFAULT 'active',
  failed_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
  next_deposit_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  reached_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT paused_at_iff_paused CHECK (
    (status = 'paused' AND paused_at IS NOT NULL) OR
    (status <> 'paused' AND paused_at IS NULL)
  ),
  CONSTRAINT reached_at_iff_reached CHECK (
    (status = 'reached' AND reached_at IS NOT NULL) OR
    (status <> 'reached' AND reached_at IS NULL)
  ),
  CONSTRAINT cancelled_at_iff_cancelled CHECK (
    (status = 'cancelled' AND cancelled_at IS NOT NULL) OR
    (status <> 'cancelled' AND cancelled_at IS NULL)
  ),
  CONSTRAINT periodic_not_exceeding_target CHECK (periodic_amount <= target_amount)
);

CREATE INDEX idx_marasi_user ON public.marasi(user_id);
CREATE INDEX idx_marasi_account ON public.marasi(account_id);
CREATE INDEX idx_marasi_active ON public.marasi(status) WHERE status = 'active';
CREATE INDEX idx_marasi_due
  ON public.marasi(next_deposit_at)
  WHERE status = 'active' AND next_deposit_at IS NOT NULL;

CREATE TRIGGER trg_marasi_set_updated_at
  BEFORE UPDATE ON public.marasi
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.marasi IS
  'The savings goal (intent). Each row references the linked_account that funds its auto-debits. Generates many marasi_transactions over time — one per scheduled deposit cycle plus any manual top-ups or withdrawals.';
COMMENT ON COLUMN public.marasi.account_id IS
  'The user-linked bank account auto-debits pull from. ON DELETE RESTRICT prevents accidentally orphaning an active Marsa when a bank is unlinked — the user must pause/archive the Marsa or switch its funding source first.';
COMMENT ON COLUMN public.marasi.target_amount IS
  'The total amount the user wants saved. Immutable in spirit — editing target should typically create a re-plan event rather than silently change history.';
COMMENT ON COLUMN public.marasi.periodic_amount IS
  'Computed at creation as ceil((target_amount − current_balance) / number_of_cycles_until_target_date). Re-computed when the user changes target_amount, target_date, or frequency. The last cycle may debit a smaller "remainder" amount — handled at execution time, not stored here.';
COMMENT ON COLUMN public.marasi.frequency IS
  'How often auto-debits run. weekly / biweekly / monthly. Used together with target_date to derive periodic_amount and next_deposit_at.';
COMMENT ON COLUMN public.marasi.target_date IS
  'When the user wants the goal reached. The scheduler stops generating cycles past this date; if the goal is still short, the user is prompted to extend or top up.';
COMMENT ON COLUMN public.marasi.status IS
  'active = generating cycles. paused = stop cycling but keep history; can be resumed. reached = balance ≥ target_amount, set automatically. cancelled = user gave up; funds released. archived = soft-deleted from default views.';
COMMENT ON COLUMN public.marasi.failed_attempts IS
  'Count of consecutive failed auto-debit attempts on the most recent cycle. Reset to 0 on the next successful deposit (auto or manual). Drives the "Action needed" UI badge and triggers the all_retries_exhausted notification when it hits 3.';
COMMENT ON COLUMN public.marasi.next_deposit_at IS
  'Pre-computed timestamp of the next scheduled auto-debit. NULL when status is not active. Indexed to power the scheduler''s due-jobs query.';

CREATE TABLE public.marasi_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marsa_id UUID NOT NULL REFERENCES public.marasi(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  type public.marsa_tx_type NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  scheduled_for TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  status public.marsa_tx_status NOT NULL DEFAULT 'scheduled',
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count BETWEEN 0 AND 3),
  bank_ref TEXT,
  failure_reason TEXT,
  note TEXT,
  resolved_manually BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT scheduled_for_required_for_auto_debit CHECK (
    (type = 'auto_debit' AND scheduled_for IS NOT NULL) OR
    (type <> 'auto_debit')
  )
);

CREATE INDEX idx_marasi_transactions_marsa ON public.marasi_transactions(marsa_id, created_at DESC);
CREATE INDEX idx_marasi_transactions_user ON public.marasi_transactions(user_id);
CREATE INDEX idx_marasi_transactions_account ON public.marasi_transactions(account_id);
CREATE INDEX idx_marasi_transactions_status ON public.marasi_transactions(status);
CREATE INDEX idx_marasi_transactions_scheduled ON public.marasi_transactions(scheduled_for);
CREATE INDEX idx_marasi_transactions_pending
  ON public.marasi_transactions(scheduled_for)
  WHERE status IN ('scheduled', 'processing', 'retrying');

CREATE TRIGGER trg_marasi_transactions_set_updated_at
  BEFORE UPDATE ON public.marasi_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.marasi_transactions IS
  'Every money movement for a savings goal. One row per scheduled auto-debit cycle, manual top-up, withdrawal, or final release. Snapshot fields preserve the source account at execution time so history stays accurate even if the Marsa''s linked account changes or is unlinked later.';
COMMENT ON COLUMN public.marasi_transactions.user_id IS
  'Denormalized from marasi for fast RLS and per-user queries. Set once on insert; never changes.';
COMMENT ON COLUMN public.marasi_transactions.type IS
  'auto_debit = scheduled bank → goal. manual_topup = user-initiated. withdrawal = user pulls money before goal completes. release = automatic on goal cancellation or completion.';
COMMENT ON COLUMN public.marasi_transactions.scheduled_for IS
  'When the cycle is meant to fire. Required for auto_debit; NULL for instant types (manual_topup, withdrawal, release execute immediately).';
COMMENT ON COLUMN public.marasi_transactions.executed_at IS
  'When money actually moved. NULL until the row reaches succeeded; remains NULL on failed/cancelled rows.';
COMMENT ON COLUMN public.marasi_transactions.amount IS
  'Always positive. Direction is implied by type: auto_debit/manual_topup add to the goal, withdrawal/release subtract from it.';
COMMENT ON COLUMN public.marasi_transactions.retry_count IS
  '0 = initial attempt. 1-3 = automatic retries (every 3 hours by default). After retry_count = 3 the status flips to ''failed'' and an all_retries_exhausted notification is sent.';
COMMENT ON COLUMN public.marasi_transactions.bank_ref IS
  'Bank-issued reference returned by the gateway on success. NULL otherwise. Links this row to the bank''s own ledger entry.';
COMMENT ON COLUMN public.marasi_transactions.resolved_manually IS
  'TRUE if a previously failed transaction was paid through the user-triggered Retry flow (possibly funded from a different account). Distinguishes user-resolved failures from successful first attempts when reading history.';

CREATE TABLE public.marasi_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.marasi_transactions(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL CHECK (attempt_number >= 0),
  at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status public.marsa_attempt_status NOT NULL,
  message TEXT NOT NULL CHECK (length(message) <= 500),
  gateway_code TEXT,
  gateway_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_marasi_attempts_transaction ON public.marasi_attempts(transaction_id, at);

COMMENT ON TABLE public.marasi_attempts IS
  'Immutable log: one row per gateway call or user action against a marasi_transaction. Powers the per-deposit timeline drilldown in the UI. Append-only — no updated_at column.';
COMMENT ON COLUMN public.marasi_attempts.attempt_number IS
  '0 = initial attempt. 1-3 = automatic retries. Manual resolutions and user-driven actions append with a fresh attempt_number after the auto-retry sequence.';
COMMENT ON COLUMN public.marasi_attempts.message IS
  'Human-readable log line shown to the user, e.g. "Declined by Al Rajhi: insufficient funds (balance SAR 540.00)".';
COMMENT ON COLUMN public.marasi_attempts.gateway_code IS
  'Raw bank/gateway code (e.g. "INSUFFICIENT_FUNDS", "TIMEOUT"). Internal use; not shown to the user.';
COMMENT ON COLUMN public.marasi_attempts.gateway_response IS
  'Full gateway payload for debugging. Internal use only.';

CREATE TABLE public.marasi_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  marsa_id UUID REFERENCES public.marasi(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.marasi_transactions(id) ON DELETE CASCADE,
  type public.marsa_notification_type NOT NULL,
  channel public.notification_channel NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_marasi_notifications_user ON public.marasi_notifications(user_id, sent_at DESC);
CREATE INDEX idx_marasi_notifications_unread ON public.marasi_notifications(user_id, sent_at DESC) WHERE read_at IS NULL;

COMMENT ON TABLE public.marasi_notifications IS
  'Outbound notifications scoped to the Marāsi module. No updated_at — read_at is a one-shot write, not a generic mutation field.';
COMMENT ON COLUMN public.marasi_notifications.type IS
  'deposit_failed = single attempt failed. all_retries_exhausted = 3 retries done, status flipped to failed. goal_reached = balance hit target. milestone_reached = optional 25/50/75% progress nudges. upcoming_deposit = pre-debit reminder if user opted in.';

-- ============================================================================
-- ZAKAT MODULE
-- ============================================================================

CREATE TABLE public.zakat_payment_receivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  iban TEXT NOT NULL,
  account_name TEXT NOT NULL,
  bank_name TEXT,
  is_charity BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zakat_payment_receivers_user ON public.zakat_payment_receivers(user_id);

CREATE TRIGGER trg_zakat_payment_receivers_set_updated_at
  BEFORE UPDATE ON public.zakat_payment_receivers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.user_zakat_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  nisab_standard public.nisab_standard NOT NULL DEFAULT 'SILVER',
  nisab_locked_until TIMESTAMPTZ,
  nisab_standard_confirmed BOOLEAN NOT NULL DEFAULT false,
  previous_net_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  money_collected_date TIMESTAMPTZ,
  last_zakat_payment_date TIMESTAMPTZ,
  is_setup_complete BOOLEAN NOT NULL DEFAULT false,
  auto_pay_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_pay_receiver_id UUID REFERENCES public.zakat_payment_receivers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_user_zakat_settings_set_updated_at
  BEFORE UPDATE ON public.user_zakat_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.zakat_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  asset_type public.asset_type NOT NULL,
  custom_label TEXT,
  description TEXT,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SAR',
  weight_grams NUMERIC(10, 3),
  karat INTEGER,
  owned_since TIMESTAMPTZ NOT NULL,
  owned_until TIMESTAMPTZ,
  status public.asset_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zakat_assets_user ON public.zakat_assets(user_id, status);
CREATE INDEX idx_zakat_assets_owned ON public.zakat_assets(user_id, owned_since);

CREATE TRIGGER trg_zakat_assets_set_updated_at
  BEFORE UPDATE ON public.zakat_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.zakat_asset_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.zakat_assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action public.asset_history_action NOT NULL,
  snapshot JSONB NOT NULL,
  change_note TEXT,
  action_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zakat_asset_history_asset ON public.zakat_asset_history(asset_id);
CREATE INDEX idx_zakat_asset_history_user ON public.zakat_asset_history(user_id, action_at);

CREATE TABLE public.zakat_liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SAR',
  due_date TIMESTAMPTZ,
  notes TEXT,
  is_settled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zakat_liabilities_user ON public.zakat_liabilities(user_id, is_settled);

CREATE TRIGGER trg_zakat_liabilities_set_updated_at
  BEFORE UPDATE ON public.zakat_liabilities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.zakat_hawl (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_zakat_settings(user_id) ON DELETE CASCADE,
  status public.hawl_status NOT NULL DEFAULT 'PENDING',
  start_date TIMESTAMPTZ NOT NULL,
  expected_end_date TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  broken_at TIMESTAMPTZ,
  break_reason TEXT,
  nisab_standard public.nisab_standard NOT NULL,
  balance_at_start NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zakat_hawl_user ON public.zakat_hawl(user_id, status);

CREATE TRIGGER trg_zakat_hawl_set_updated_at
  BEFORE UPDATE ON public.zakat_hawl
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.hawl_daily_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hawl_id UUID NOT NULL REFERENCES public.zakat_hawl(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  check_date DATE NOT NULL,
  bank_balance NUMERIC(15, 2) NOT NULL,
  manual_assets_total NUMERIC(15, 2) NOT NULL,
  total_net_worth NUMERIC(15, 2) NOT NULL,
  nisab_value_sar NUMERIC(15, 2) NOT NULL,
  gold_price_per_gram NUMERIC(10, 4) NOT NULL,
  silver_price_per_gram NUMERIC(10, 4) NOT NULL,
  is_above_nisab BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hawl_id, check_date)
);

CREATE INDEX idx_hawl_daily_checks_user ON public.hawl_daily_checks(user_id, check_date);

CREATE TABLE public.nisab_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_date DATE NOT NULL UNIQUE,
  gold_price_per_gram NUMERIC(10, 4) NOT NULL,
  gold_nisab_grams INTEGER NOT NULL DEFAULT 85,
  gold_nisab_value_sar NUMERIC(15, 2) NOT NULL,
  silver_price_per_gram NUMERIC(10, 4) NOT NULL,
  silver_nisab_grams INTEGER NOT NULL DEFAULT 595,
  silver_nisab_value_sar NUMERIC(15, 2) NOT NULL,
  source TEXT NOT NULL DEFAULT 'goldapi',
  raw_response JSONB,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nisab_price_history_date ON public.nisab_price_history(price_date);

CREATE TABLE public.zakat_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  hawl_id UUID REFERENCES public.zakat_hawl(id) ON DELETE SET NULL,
  nisab_standard public.nisab_standard NOT NULL,
  nisab_value_sar NUMERIC(15, 2) NOT NULL,
  gold_price_per_gram NUMERIC(10, 4) NOT NULL,
  silver_price_per_gram NUMERIC(10, 4) NOT NULL,
  bank_balance_total NUMERIC(15, 2) NOT NULL,
  manual_assets_total NUMERIC(15, 2) NOT NULL,
  liabilities_total NUMERIC(15, 2) NOT NULL,
  net_worth NUMERIC(15, 2) NOT NULL,
  is_above_nisab BOOLEAN NOT NULL,
  zakat_amount NUMERIC(15, 2),
  zakat_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.025,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zakat_calculations_user ON public.zakat_calculations(user_id, calculated_at);

CREATE TABLE public.zakat_calculation_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_id UUID NOT NULL REFERENCES public.zakat_calculations(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.zakat_assets(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  value_at_calc NUMERIC(15, 2) NOT NULL,
  is_zakatable BOOLEAN NOT NULL
);

CREATE INDEX idx_zakat_calculation_assets_calc ON public.zakat_calculation_assets(calculation_id);

CREATE TABLE public.zakat_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_zakat_settings(user_id) ON DELETE CASCADE,
  calculation_id UUID UNIQUE REFERENCES public.zakat_calculations(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SAR',
  status public.payment_status NOT NULL DEFAULT 'PENDING',
  receiver_id UUID REFERENCES public.zakat_payment_receivers(id) ON DELETE SET NULL,
  to_iban TEXT,
  bank_reference TEXT,
  is_automated BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zakat_payments_user ON public.zakat_payments(user_id, created_at);

CREATE TRIGGER trg_zakat_payments_set_updated_at
  BEFORE UPDATE ON public.zakat_payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- AI MODULE
-- ============================================================================

CREATE TABLE public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_recommendations_user ON public.ai_recommendations(user_id, created_at);
