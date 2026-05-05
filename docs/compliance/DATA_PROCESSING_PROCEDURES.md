# CUB — Data Processing Procedures

Last updated: 2026-05-05

> Internal document. Not legal advice. This describes the day-to-day procedures to operate CUB safely.

## 1) User onboarding & consent

- Registration requires acceptance of Terms + Privacy Notice.
- Store acceptance in `users` (accepted flag + version + timestamp).
- If a user does not accept, registration must be blocked.

## 2) Access control & support

- Use role-based access:
  - `parent`: only their authorised plans/children
  - `mediator`/`admin`: client-facing administrative access
  - `cub_internal`: operational access and compliance tools
- For support tasks, use CUB internal tools and avoid direct DB changes unless necessary and logged.

## 3) Vault documents (private storage)

- Bucket must remain private.
- Frontend never uses a Supabase service role key.
- Backend issues signed upload URLs and signed view URLs.
- Record audit logs for signed URL generation.

## 4) Privacy requests handling (DSAR/correction/deletion/objection)

Intake:
- Users submit via `/privacy-requests` in-app (authenticated).

Processing:
- Use CUB Internal → Privacy Requests:
  - `pending` → `acknowledged` → `fulfilled` (or `rejected`)
- Record evidence (export output, applied correction, etc.) in `PROCESSING_LOG.md` and/or your evidence folder.
- Emails:
  - “received” email sent on intake
  - “status updated” email sent on status changes

## 5) Account deletion/anonymisation

- User requests deletion from Settings.
- System schedules anonymisation (30 day grace).
- Automated job processes due deletions.
- If legal hold is enabled, job must skip.

## 6) Plan destruction (both guardians)

- Both guardians must request destruction.
- System sets destruction due date (18 months) and locks new activity where applicable.
- Automated job redacts plan-scoped content when due.
- If legal hold is enabled, job must skip.

## 7) Incident response

- Follow `INCIDENT_RESPONSE.md`
- Create an incident entry in CUB Internal → Incidents
- Preserve evidence in `EVIDENCE_STORAGE.md` location
- Rotate secrets if compromise suspected

## 8) Operator access & key rotation

- Restrict operator console access (Vercel/Render/Supabase/Resend).
- Rotate secrets on schedule and record in `SECRET_ROTATION_LOG.md`.

