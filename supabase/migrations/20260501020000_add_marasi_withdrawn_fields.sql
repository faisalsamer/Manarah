-- Add withdrawal-tracking fields to `marasi`.
--
-- Background: in the marasi flow, "release" and "cancel" both move money from
-- the goal's segregated balance back to one of the user's bank accounts. The
-- goal's status (`reached` / `cancelled`) tells us *what* the user did; these
-- new columns tell us *whether* the funds have actually been transferred and
-- *to which* account, mirroring the front-end VM (`withdrawn`,
-- `withdrawn_at`, `releaseBankId/AccountId`).
--
-- Lifecycle invariants enforced by check constraints:
--   - `cancelled` always implies `withdrawn` (cancel = release + terminate).
--   - `reached` may or may not be `withdrawn` ("جاهز للسحب" vs "تم السحب").
--   - `active` is never `withdrawn`.
--   - `withdrawn = true` ⇔ both `withdrawn_at` and `release_account_id` are set.

ALTER TABLE public.marasi
  ADD COLUMN withdrawn          BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN withdrawn_at       TIMESTAMPTZ,
  ADD COLUMN release_account_id UUID        REFERENCES public.accounts(id) ON DELETE SET NULL;

-- ─── Invariant constraints ───────────────────────────────────

-- withdrawn ⇔ withdrawn_at IS NOT NULL ⇔ release_account_id IS NOT NULL
ALTER TABLE public.marasi
  ADD CONSTRAINT withdrawn_at_iff_withdrawn CHECK (
    (withdrawn = TRUE  AND withdrawn_at IS NOT NULL AND release_account_id IS NOT NULL) OR
    (withdrawn = FALSE AND withdrawn_at IS NULL     AND release_account_id IS NULL)
  );

-- An active goal can never be withdrawn.
ALTER TABLE public.marasi
  ADD CONSTRAINT active_implies_not_withdrawn CHECK (
    status <> 'active' OR withdrawn = FALSE
  );

-- A cancelled goal must be withdrawn (cancel = release + terminate).
ALTER TABLE public.marasi
  ADD CONSTRAINT cancelled_implies_withdrawn CHECK (
    status <> 'cancelled' OR withdrawn = TRUE
  );

-- ─── Index for "release destination" lookups ─────────────────
-- Used when rendering withdrawn-banner copy + when reporting "amount returned
-- to account X across all goals".
CREATE INDEX idx_marasi_release_account
  ON public.marasi(release_account_id)
  WHERE release_account_id IS NOT NULL;

-- ─── Comments ────────────────────────────────────────────────
COMMENT ON COLUMN public.marasi.withdrawn IS
  'Whether the goal''s segregated balance has been transferred back to a bank account. Always FALSE for active goals; set TRUE in the same $transaction that creates a successful release tx (either after reaching the goal, or as part of a cancel).';

COMMENT ON COLUMN public.marasi.withdrawn_at IS
  'Timestamp of the release that emptied the balance. Mirrors the executed_at of the `release`-type marasi_transactions row.';

COMMENT ON COLUMN public.marasi.release_account_id IS
  'The user-linked account funds were transferred to. May differ from the goal''s funding `account_id` — the user picks the destination at release time. ON DELETE SET NULL: we lose the destination pointer if the bank is unlinked, but the historical release tx itself is preserved.';
