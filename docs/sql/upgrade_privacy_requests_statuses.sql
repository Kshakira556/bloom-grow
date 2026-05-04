-- Upgrade privacy_requests.status lifecycle to:
-- pending / acknowledged / fulfilled / rejected
--
-- This is safe to run once. It maps existing values:
-- open -> pending
-- in_progress -> acknowledged
-- closed -> fulfilled

ALTER TABLE privacy_requests
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NULL;

UPDATE privacy_requests
SET status =
  CASE status
    WHEN 'open' THEN 'pending'
    WHEN 'in_progress' THEN 'acknowledged'
    WHEN 'closed' THEN 'fulfilled'
    ELSE status
  END,
  updated_at = COALESCE(updated_at, NOW())
WHERE status IN ('open','in_progress','closed');

-- Optional: enforce allowed statuses via CHECK constraint
ALTER TABLE privacy_requests
  DROP CONSTRAINT IF EXISTS privacy_requests_status_check;

ALTER TABLE privacy_requests
  ADD CONSTRAINT privacy_requests_status_check
  CHECK (status IN ('pending','acknowledged','fulfilled','rejected'));

