-- Adds terms/privacy acceptance tracking to the `users` table.
-- Run this against your Postgres database for the CUB backend.
--
-- NOTE:
-- - Store ONLY boolean/timestamps/versions here (no sensitive document content).
-- - The backend code is backward-compatible and will fall back if these columns do not exist,
--   but you should apply this migration to actually persist acceptance.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS terms_version TEXT NULL,
  ADD COLUMN IF NOT EXISTS privacy_version TEXT NULL,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP NULL;

