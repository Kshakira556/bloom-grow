-- Invite hardening: backend-resolved invite token
-- Adds an unguessable token to plan_invites so the frontend can prefill/lock email + account type
-- without trusting query parameters.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE plan_invites
  ADD COLUMN IF NOT EXISTS invite_token UUID NULL;

-- Backfill existing rows
UPDATE plan_invites
SET invite_token = gen_random_uuid()
WHERE invite_token IS NULL;

-- Enforce uniqueness + not-null going forward
ALTER TABLE plan_invites
  ALTER COLUMN invite_token SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_plan_invites_invite_token'
  ) THEN
    CREATE UNIQUE INDEX idx_plan_invites_invite_token ON plan_invites(invite_token);
  END IF;
END $$;

