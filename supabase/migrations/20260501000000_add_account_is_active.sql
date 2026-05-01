-- Add soft-disconnect support to accounts
-- is_active = false means the user has disconnected this account from the app.
-- The row and all its FK-referenced history (marasi, payments, etc.) are preserved.

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN accounts.is_active IS 'false = soft-disconnected by user; row kept for historical FK integrity';
