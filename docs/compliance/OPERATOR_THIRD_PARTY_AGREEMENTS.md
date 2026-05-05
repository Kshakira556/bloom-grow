# CUB — Operator / Third‑Party Agreements (POPIA)

Last updated: 2026-05-05

> Internal document. Not legal advice. POPIA expects you to ensure operators (processors) protect personal information.

## Operators used by CUB

- Vercel — frontend hosting
- Render — backend hosting
- Supabase — database + private storage
- Resend — email delivery

## Where to get contracts / terms

Most operators provide standard terms, DPAs (Data Processing Addendums), and security pages:

- Vercel: Terms + Privacy + “Data Processing Addendum (DPA)” (search Vercel legal/DPA)
- Render: Terms + Privacy + any DPA/security documentation (search Render legal/DPA)
- Supabase: Terms + Privacy + DPA + security documentation (search Supabase DPA/security)
- Resend: Terms + Privacy + DPA/security docs (search Resend legal/DPA)

## What to store as evidence (minimum)

In your private evidence folder (`EVIDENCE_STORAGE.md`):
- PDFs or snapshots of:
  - Terms of Service
  - DPA (if available)
  - security/technical measures page
- Notes on:
  - where data is hosted (regions)
  - what access controls are in place
  - key rotation dates (if any)

## Practical checklist (operator due diligence)

- [ ] Confirm each operator provides a DPA (or equivalent contractual terms).
- [ ] Confirm breach notification/support channels for each operator.
- [ ] Confirm your production credentials are least-privilege (especially Supabase service role on backend only).
- [ ] Record any changes or exceptions in `DECISIONS_LOG.md`.

