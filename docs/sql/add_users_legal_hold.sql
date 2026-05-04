-- CUB: legal hold on user lifecycle operations
-- Prevents automated anonymisation from running while legal_hold is enabled.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS legal_hold BOOLEAN NOT NULL DEFAULT FALSE;

