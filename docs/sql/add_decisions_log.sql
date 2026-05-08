-- CUB Internal: structured decisions log (operational audit evidence)
-- Safe to run once.

CREATE TABLE IF NOT EXISTS decisions_log (
  id UUID PRIMARY KEY,
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  details TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decisions_log_created_at
  ON decisions_log(created_at DESC);

