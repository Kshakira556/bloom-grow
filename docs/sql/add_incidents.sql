-- CUB Internal: incidents table (minimal capture for incident response)
-- Fields: opened_at, severity, owner, status, notes

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  title TEXT NOT NULL,
  owner TEXT NULL,
  notes TEXT NULL,
  updated_at TIMESTAMPTZ NULL,
  CONSTRAINT incidents_severity_check CHECK (severity IN ('low','medium','high','critical')),
  CONSTRAINT incidents_status_check CHECK (status IN ('open','in_progress','closed'))
);

CREATE INDEX IF NOT EXISTS idx_incidents_opened_at
  ON incidents(opened_at DESC);

