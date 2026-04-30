-- Add display metadata to banks
ALTER TABLE public.banks
  ADD COLUMN IF NOT EXISTS bank_name_ar TEXT,
  ADD COLUMN IF NOT EXISTS bank_code    TEXT,
  ADD COLUMN IF NOT EXISTS logo_url     TEXT,
  ADD COLUMN IF NOT EXISTS bank_type    TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS banks_user_id_bank_id_key
  ON public.banks (user_id, bank_id);
  
-- Add identity and display fields to accounts
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS account_name TEXT,
  ADD COLUMN IF NOT EXISTS iban         TEXT,
  ADD COLUMN IF NOT EXISTS is_primary   BOOLEAN NOT NULL DEFAULT false;
