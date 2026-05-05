# CUB — Data Mapping / Data Inventory

Last updated: 2026-05-05

> Internal document. Not legal advice. Use this to show what data you collect, why, where it’s stored, who has access, and retention.

## Summary table

| Category | What we collect | Why | Where stored | Who has access | Retention |
|---|---|---|---|---|---|
| Account | name, email, phone (optional), role, subscription fields | provide service, identity/contact, billing | Supabase (users table) | parent (self), admin/mediator (limited), cub_internal (ops) | while active/deactivated; anonymised after deletion request + grace period |
| Consent | terms/privacy accepted + version + timestamp | openness and lawful processing evidence | Supabase (users columns) | cub_internal/admin for audits | retained with account record; may persist after anonymisation where lawful |
| Plans | plan metadata, participants | co‑parenting collaboration | Supabase | plan participants; admin/mediator/cub_internal as authorised | retained while lawful; plan redaction if both guardians request destruction |
| Visits | schedule times, optional notes/location | scheduling, child welfare coordination | Supabase | plan participants; admin/mediator/cub_internal as authorised | retained while lawful; redacted on plan destruction job |
| Messages | content, timestamps, edits/deletes, seen status, flags | communication record + accountability | Supabase (messages + message_history) | participants; admin/mediator/cub_internal as authorised | retained while lawful; redacted on plan destruction job; deleted users de-identified where feasible |
| Vault (child) | child details, medical/legal/safety/emergency data | safety + structured record | Supabase (vault tables) | authorised guardians; admin/mediator/cub_internal as authorised | retained while lawful; not deleted due to one parent’s profile deletion |
| Vault documents | file metadata + secure storage path | store official records | Supabase Storage (private bucket) + Supabase DB metadata | authorised guardians via signed URLs; cub_internal for ops | retained while lawful; delete/redact as part of applicable lifecycle where lawful |
| Audit logs | action, actor, target, timestamp, notes | accountability + investigations | Supabase (audit_logs) | cub_internal/admin as authorised | retained as needed for security/accountability |
| Privacy requests | request type/details/status | fulfill data subject rights | Supabase (privacy_requests) | cub_internal | retained for accountability/evidence |
| Incidents | title, severity, status, owner, notes | breach response evidence | Supabase (incidents) | cub_internal | retained for accountability/evidence |

## Operators (processors)

- Vercel — frontend hosting
- Render — backend API hosting
- Supabase — database + private storage
- Resend — email delivery

## Hosting regions (fill in)

- Vercel: [INSERT]
- Render: [INSERT]
- Supabase: [INSERT]
- Resend: [INSERT]

