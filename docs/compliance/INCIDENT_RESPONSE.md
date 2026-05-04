# CUB — Incident & Breach Response Runbook (POPIA)

Last updated: 2026-05-04

> Internal document. Not legal advice. This runbook is designed to be practical and evidence-driven.

<!--
TODO (Owner: Shakira Knight / POPIA Director)
- [ ] Decide your severity levels and target response times.
- [ ] Decide where evidence is stored (private drive / restricted repo / ticketing).
- [ ] Decide who has authority to rotate keys, revoke access, and message users.
- [ ] Confirm operator breach notification channels (Supabase/Render/Vercel/Resend).
- [ ] Add Information Regulator reporting info if/when you want it included in internal runbook.
-->

## 1) Goals

- Protect users (parents and children) and reduce harm
- Contain and stop the incident fast
- Preserve evidence for accountability and legal defensibility
- Communicate clearly and only with verified facts

## 2) Roles & responsibilities

- Incident commander: POPIA Director (Shakira Knight) unless delegated
- Technical lead: backend/infra maintainer
- Communications: POPIA Director (user-facing and operator-facing)

## 3) Triage checklist (first 30 minutes)

1. Confirm the incident is real (logs, monitoring, user reports).
2. Scope:
   - what systems are involved (frontend/backend/db/storage/email)?
   - what data types are affected (messages/vault/docs/identity)?
   - what time window?
3. Contain:
   - disable affected endpoints if necessary
   - rotate compromised credentials immediately
   - revoke sessions/tokens if required
4. Preserve evidence:
   - capture logs (timestamps + request ids if available)
   - snapshot relevant DB rows (do not mutate evidence without tracking)

## 4) Containment actions (common)

### Credentials / secrets

- Rotate:
  - `JWT_SECRET`
  - Supabase service role key (Render only)
  - Resend API key
  - Any operator tokens

### Storage (Vault documents)

- Validate bucket remains private
- Validate signed URLs are short-lived
- If exposure suspected, invalidate and rotate keys, and consider temporary access suspension

### Application controls

- Increase rate limiting temporarily
- Temporarily block exports and document signed URLs if needed

## 5) Investigation steps (after containment)

- Identify root cause:
  - auth bypass?
  - privilege escalation?
  - leaked credentials?
  - misconfigured bucket policy?
- Determine affected data:
  - which users?
  - which plans?
  - which documents/objects?
- Determine whether data was accessed/exfiltrated:
  - request logs
  - audit logs
  - operator logs

## 6) Communication (principles)

- Do not speculate. Share verified facts.
- Be clear on:
  - what happened
  - what data types were affected
  - what you’ve done to contain
  - what users should do (password reset, etc.)
  - how to contact the Information Officer

## 7) Post-incident actions

- Patch root cause
- Write a brief postmortem:
  - timeline
  - impact
  - root cause
  - mitigations
  - follow-up actions
- Update RoPA and security controls if needed
- Review whether user notifications are required (POPIA expectations)

