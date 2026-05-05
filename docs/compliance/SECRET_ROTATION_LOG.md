# CUB — Secrets / Key Rotation Log

Last updated: 2026-05-05

> Internal document. Not legal advice. Record every secret rotation here for accountability.

## Rotation cadence (recommended defaults)

- JWT secret: every 90–180 days (or immediately after suspected compromise)
- Supabase service role key: every 90–180 days (or immediately after suspected compromise)
- Resend API key: every 180 days (or immediately after suspected compromise)
- Database credentials: per operator guidance / after suspected compromise

## Entries

### Template

- Date/time (SAST):
- Secret name:
- Reason (scheduled / incident / suspected exposure):
- Rotated by:
- Systems updated (Render/Vercel/Supabase/etc.):
- Verification (how you confirmed it works):
- Notes:

