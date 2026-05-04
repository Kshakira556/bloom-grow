-- Plan destruction (redaction) lifecycle
-- Implements: destruction_requested_at, destruction_due_at, redacted_at, legal_hold, destruction_status
-- plus a plan_destruction_requests table to track both guardians' requests.

ALTER TABLE parenting_plans
  ADD COLUMN IF NOT EXISTS destruction_requested_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS destruction_due_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS redacted_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS legal_hold BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS destruction_status TEXT NULL;

-- Track each guardian's request for full shared-record destruction.
CREATE TABLE IF NOT EXISTS plan_destruction_requests (
  plan_id UUID NOT NULL REFERENCES parenting_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (plan_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_plan_destruction_requests_plan_id
  ON plan_destruction_requests(plan_id);

-- Optional helper index for due plans
CREATE INDEX IF NOT EXISTS idx_parenting_plans_destruction_due
  ON parenting_plans(destruction_due_at)
  WHERE destruction_due_at IS NOT NULL AND redacted_at IS NULL;

