-- Messages: attachments support (Supabase Storage private bucket)
-- Safe to run once (idempotent).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Document',
  file_path TEXT NOT NULL,
  content_type TEXT NULL,
  size_bytes BIGINT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id
  ON message_attachments(message_id);

CREATE INDEX IF NOT EXISTS idx_message_attachments_created_at
  ON message_attachments(created_at DESC);

