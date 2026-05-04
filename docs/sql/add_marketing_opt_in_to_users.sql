-- POPIA / Direct marketing readiness (Section 69)
-- Store explicit opt-in and unsubscribe timestamps.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS marketing_opt_in_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS marketing_unsubscribed_at TIMESTAMPTZ NULL;

