-- Marketing: public unsubscribe tokens (token-based, no login)
-- Run in Supabase SQL editor.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS marketing_unsubscribe_tokens (
  token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_marketing_unsubscribe_tokens_user_id
  ON marketing_unsubscribe_tokens(user_id);

