-- POPIA: Account deletion lifecycle (safe, minimal, reversible)
-- Notes:
-- - This implements a "soft delete" lifecycle with a scheduled date.
-- - A later backend process anonymises personal profile fields after the grace period.
-- - We keep shared co-parenting records intact for the other parent and audit trail.

-- 1) Extend users table with deletion lifecycle columns
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS deletion_scheduled_for TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMP NULL;

-- 2) Create a request log table for deletion requests (auditability)
-- Requires pgcrypto or another UUID generator. If you don't have it yet:
--   CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_at TIMESTAMP NOT NULL DEFAULT now(),
  scheduled_for TIMESTAMP NOT NULL,
  processed_at TIMESTAMP NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT NULL,

  CONSTRAINT account_deletion_requests_status_check
    CHECK (status IN ('pending', 'processed', 'canceled'))
);

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_user_id
  ON account_deletion_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_status
  ON account_deletion_requests(status);

