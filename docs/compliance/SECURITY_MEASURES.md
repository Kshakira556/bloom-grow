# CUB — Security Measures Documentation

Last updated: 2026-05-05

> Internal document. Not legal advice. Demonstrates “reasonable safeguards” (technical + organisational).

## 1) Access control (roles & permissions)

- Authentication: JWT (backend)
- Role-based access:
  - `parent`: access to authorised plans/children
  - `mediator`/`admin`: client-facing administrative actions
  - `cub_internal`: CUB operational tools (privacy/incident/audit/deletions)
- Sensitive actions are logged in `audit_logs` where applicable.

## 2) Password/security standards

- Passwords are never stored in plain text.
- Passwords are hashed using bcrypt.
- Login endpoint is rate-limited to reduce brute-force attempts.

## 3) Encryption (if applicable)

- In transit: HTTPS (operator-managed TLS).
- At rest: relies on operator controls (Supabase/Render/Vercel). Document operator assurances/contracts where available.
- Vault documents: stored in a private bucket; access via short-lived signed URLs.

## 4) Backups

- Database backups: managed by Supabase (operator).
- Operational practice:
  - ensure operator backups are enabled where available
  - ensure access to backups is restricted
  - document any restore events in `DECISIONS_LOG.md`

## 5) Abuse controls

- Rate limiting is applied to high-frequency write endpoints (messages, vault signed URLs, visits, privacy endpoints, etc.).
- Input length limits exist for high-risk text fields (messages, vault legal/medical/safety, journal, proposals).

## 6) Monitoring & auditability

- Audit logs are captured for sensitive actions (exports, signed URLs, privacy workflows, legal hold changes, etc.).
- CUB Internal dashboard provides a view of audit logs and operational actions.

## 7) Secrets management & rotation

- Secrets are stored in backend environment variables (Render) and are not shipped to the frontend.
- Secret rotation is recorded in `SECRET_ROTATION_LOG.md`.

