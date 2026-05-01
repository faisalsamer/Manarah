-- Add the two notification types we use in the front end but the original
-- enum didn't include: a successful charge confirmation and an upcoming-payment
-- heads-up.
--
-- ALTER TYPE ... ADD VALUE can't run inside a transaction in older Postgres,
-- but Supabase migrations run statement-by-statement so this is fine. The
-- IF NOT EXISTS guard makes it idempotent.

ALTER TYPE public.expense_notification_type ADD VALUE IF NOT EXISTS 'payment_succeeded';
ALTER TYPE public.expense_notification_type ADD VALUE IF NOT EXISTS 'upcoming_payment';
