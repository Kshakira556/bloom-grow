# CUB — Audit Logs / Activity Logs

Last updated: 2026-05-05

> Internal document. Not legal advice. This describes what is logged and why.

## What is logged

Examples of logged actions (non-exhaustive):
- Message actions: create/edit/delete/seen/flag
- Exports: message export, Vault export, DSAR exports
- Document access: signed URL generation for Vault documents
- Privacy workflow: request created, status updated, email failures
- Legal hold changes (user/plan)
- Plan redaction processing

## Where logs live

- Primary: `audit_logs` table in Supabase
- Supporting tables:
  - `message_history` (message-level history)
  - `privacy_requests` (privacy request lifecycle)
  - `incidents` (incident records)

## Who can view logs

- CUB Internal (`cub_internal`) via `/cub` audit log view
- Client-facing admin/mediator views (where applicable and authorised)

## How to use logs during audits/incidents

- Export relevant log rows with timestamps and IDs.
- Preserve evidence in your evidence folder (see `EVIDENCE_STORAGE.md`).
- Record major actions in `DECISIONS_LOG.md` (key rotations, policy changes, etc.).

