# CUB — POPIA Audit Pack Checklist

Last updated: 2026-05-05

> Internal document. Not legal advice. Use this as a practical “what to show an auditor” pack.

## 1) Policies & notices (external)

- [x] Privacy Notice page exists: `/privacy`
- [x] Terms page exists: `/terms`
- [x] Privacy requests page exists: `/privacy-requests`
- [x] Footer links to Privacy/Terms/Privacy Requests
- [ ] Review wording quarterly (or after major product changes)

## 2) Information Officer / Responsible Party

- [x] Named Information Officer and contact shown in `/privacy` and Settings
- [x] Incident inbox defined: `incidents@cubapp.co.za`
- [x] Backup contacts defined: `nicole@cubapp.co.za`, `shakira@cubapp.co.za`
- [ ] Store regulator registration proof (PDF/email) in a private company folder
- [ ] Confirm legal entity name and update RoPA + Privacy Notice as needed

## 3) Lawful processing & consent evidence

- [x] Registration requires acceptance of Terms + Privacy Notice
- [x] DB fields exist on `users` for acceptance flags/version/time
- [ ] Confirm “Responsible Party” legal entity name (if not yet final)

## 4) Data inventory / RoPA (internal)

- [x] RoPA exists: `docs/compliance/ROPA.md`
- [x] Operators listed (Vercel/Render/Supabase/Resend)
- [ ] Confirm hosting regions (cross‑border statement accuracy) and fill placeholders in RoPA

## 5) Data subject participation (requests + exports)

- [x] DSAR JSON export: `GET /api/privacy/my-data`
- [x] DSAR ZIP bundle: `GET /api/privacy/my-data/bundle`
- [x] Privacy Requests intake: `POST /api/privacy/requests`
- [x] CUB Internal processing UI + status lifecycle (pending/acknowledged/fulfilled/rejected)
- [x] Privacy request emails (received + status updated) via Resend (ensure `RESEND_FROM` is configured)
- [ ] Decide SLA targets (e.g., acknowledge within X business days) and fill `docs/compliance/PRIVACY_REQUEST_SLA.md`

## 6) Retention, deletion, anonymisation

- [x] Account deletion request lifecycle + scheduled anonymisation job
- [x] Plan destruction requires both guardians + delayed redaction window + job
- [x] Legal hold for users/plans to pause automated processing
- [ ] Periodic review: confirm retention policy still matches product reality

## 7) Security safeguards (technical)

- [x] Password hashing + JWT auth
- [x] Private storage for Vault documents + signed URLs
- [x] Rate limiting on high-frequency write endpoints
- [x] Audit logging for sensitive actions (exports, signed URLs, edits, privacy status updates, etc.)
- [ ] Rotate secrets on a schedule (record in `docs/compliance/SECRET_ROTATION_LOG.md`)

## 8) Security safeguards (organisational)

- [x] Incident response runbook: `docs/compliance/INCIDENT_RESPONSE.md`
- [x] Incident capture in CUB Internal (DB table + UI)
- [ ] Define where evidence is stored and fill `docs/compliance/EVIDENCE_STORAGE.md`

## 9) Operators / vendor controls

- [x] Operator list documented (Privacy + RoPA)
- [x] Supabase bucket configured private
- [x] Service-role key kept on backend (Render) only
- [ ] Keep operator access review notes (who has access to Render/Supabase/Vercel/Resend)

## 10) Direct marketing (Section 69 readiness)

- [x] Marketing preference fields on `users` (opt-in + timestamps)
- [x] Settings UI preference toggle
- [x] Token-based unsubscribe endpoint exists + token table exists
- [x] Marketing templates placeholder: `docs/compliance/MARKETING_EMAIL_TEMPLATES.md`
- [ ] If/when marketing begins: send only to opt-in users and include unsubscribe link in every marketing email

## 11) Evidence & decision logs (internal)

- [x] Compliance decisions log: `docs/compliance/DECISIONS_LOG.md`
- [x] Privacy request processing log template: `docs/compliance/PROCESSING_LOG.md`
- [ ] Add entries whenever key decisions/secrets/roles change
