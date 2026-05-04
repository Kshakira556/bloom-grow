# CUB — Operator Access & Key Rotation Checklist

Last updated: 2026-05-04

> Internal document. Not legal advice. Keep this aligned to least privilege and POPIA accountability.

<!--
TODO (Owner: Shakira Knight / POPIA Director)
- [ ] Store secrets only in Render/Vercel/GitHub Secrets (never in frontend code).
- [ ] Decide rotation cadence (recommended: 90 days for JWT + email providers; immediate rotation on suspected compromise).
- [ ] Confirm who has access to Supabase org/project, Render, Vercel, Resend, and GitHub.
- [ ] Add a “break-glass” procedure (who can access prod in emergencies and how it’s logged).
-->

## 1) Systems and secrets

### Render (backend)

- `DATABASE_URL`
- `JWT_SECRET`
- `RESEND_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `SUPABASE_BUCKET`

Rotation checklist:
<!--
TODO
- [ ] Rotation cadence (recommended defaults):
      - `JWT_SECRET`: every 90 days (forces re-login) and immediately on suspected compromise.
      - `RESEND_API_KEY`: every 90 days and immediately on suspected compromise.
      - `SUPABASE_SERVICE_ROLE_KEY`: rotate only when needed (least churn), but immediately on suspected compromise or staff access changes.
      - Cron account password (`cub-internal@cub.local`): every 90 days and immediately on staff access changes.
- [ ] Rotation procedure (do this in order):
      1) Rotate secret in operator dashboard (Render/Supabase/Resend/GitHub).
      2) Update the target service environment variables/secrets.
      3) Redeploy service (Render/Vercel) if required.
      4) Verify critical paths:
         - Auth login works
         - Vault document upload/view works
         - Cron jobs succeed (GitHub Actions)
      5) Record evidence (date/time, who rotated, what was rotated, verification notes).
- [ ] Rotate `JWT_SECRET` (forces re-login for users).
- [ ] Rotate `RESEND_API_KEY`.
- [ ] Rotate Supabase service role key if compromised (or use a new project key).
- [ ] Confirm the backend still signs Vault upload/view URLs after rotation.
-->

### Vercel (frontend)

Only include public configuration needed by the client build:
- `VITE_API_URL`

Avoid keeping Supabase anon keys in frontend if not needed.
<!--
TODO
- [ ] Remove `VITE_SUPABASE_ANON_KEY` / `VITE_SUPABASE_URL` from Vercel if Vault uploads are fully backend-signed.
-->

### Supabase (database + storage)

Storage expectations:
- Bucket is private
- No public SELECT policy that allows listing objects
- No public INSERT policy once backend-signed uploads are live

<!--
TODO
- [ ] Verify Storage policies quarterly.
- [ ] Ensure only admins can manage service role keys.
-->

### Resend (transactional email)

<!--
TODO
- [ ] Move off `onboarding@resend.dev` to a real domain (e.g. `no-reply@cubapp.co.za`) once DNS is configured.
- [ ] Configure SPF/DKIM per Resend instructions and verify deliverability.
- [ ] Ensure DNS/SPF/DKIM are set for a real `from` domain (don’t keep `onboarding@resend.dev` long-term).
- [ ] Confirm invite links use token resolution (no email/account type query params).
-->

### GitHub Actions (cron jobs)

Secrets:
- `CUB_API_BASE`
- `CUB_CRON_EMAIL`
- `CUB_CRON_PASSWORD`

<!--
TODO
- [ ] Treat cron credentials like production admin credentials (store only in GitHub Secrets).
- [ ] Rotate cron password if staff access changes.
-->

## 2) Access control (people)

<!--
TODO
- [ ] Keep a list of authorised staff.
- [ ] Remove access immediately when staff/contractors leave.
- [ ] Use 2FA everywhere (GitHub, Supabase, Render, Vercel, Resend).
-->

## 3) Evidence

Keep evidence of:
- rotation dates
- who performed the rotation
- incident-triggered rotations
