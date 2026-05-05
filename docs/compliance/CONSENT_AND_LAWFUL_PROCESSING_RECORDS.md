# CUB — Consent & Lawful Processing Records

Last updated: 2026-05-05

> Internal document. Not legal advice. Shows how consent/acceptance is captured and what it covers.

## 1) What users consent/agree to

At registration, users must:
- accept the Terms and Conditions
- acknowledge the Privacy Notice

This establishes the baseline openness and the service relationship for processing necessary to deliver CUB’s features.

## 2) How consent/acceptance is captured

- UI: Register page requires a checkbox to proceed.
- Backend: registration endpoint rejects registration if acceptance is not provided.
- Database: store acceptance evidence on `users`:
  - `terms_accepted` (boolean)
  - `terms_version` (text)
  - `privacy_version` (text)
  - `terms_accepted_at` (timestamp)

## 3) Evidence / audit trail

- The above DB fields act as the primary record of acceptance.
- Supporting evidence:
  - policy version dates (Privacy/Terms “Last updated”)
  - any major changes recorded in `DECISIONS_LOG.md`

## 4) Lawful processing beyond consent

Some processing is justified by lawful necessity for:
- service delivery (plans, visits, messaging, Vault, exports)
- legitimate interest (accountability, dispute resolution, legal defence)
- legal obligations (where applicable)

## 5) Withdrawal/objection handling

- Users can submit objection/withdrawal-related requests via `/privacy-requests`.
- CUB assesses requests and responds within a reasonable time.
- Processing may continue where there is another lawful basis (e.g., legal hold, dispute resolution, audit requirements).

