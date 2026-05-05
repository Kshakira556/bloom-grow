# CUB — Internal Data Protection Policy (POPIA)

Last updated: 2026-05-05

> Internal document. Not legal advice. This policy defines the rules CUB follows when handling personal information.

## 1) Scope

This policy applies to:
- all personal information processed by CUB (users, children, plans, messages, Vault, documents)
- all environments (production, staging, local) where personal data exists
- all roles with access (parents, client-facing mediator/admin roles, CUB internal)

## 2) Roles & accountability

- POPIA Director / Information Officer: **Shakira Knight**
- Incident inbox: **incidents@cubapp.co.za**
- Backups: **nicole@cubapp.co.za**, **shakira@cubapp.co.za**

Responsibilities:
- ensure POPIA openness and lawful processing
- approve operator access to production data and secrets
- ensure privacy requests are handled and recorded
- lead incident response and breach communications

## 3) Core principles

- Purpose limitation: collect/process only for defined service purposes.
- Minimisation: do not collect/store more than needed.
- Security safeguards: protect data with reasonable technical and organisational measures.
- Transparency: keep Privacy Notice and Terms consistent with system behaviour.
- Auditability: preserve evidence of sensitive actions and decisions.

## 4) Access control rules

- Production access is least-privilege.
- Only authorised roles may access sensitive views.
- Secrets (DB credentials, service role keys, email keys) are stored in backend environment variables (Render), not in frontend.
- CUB internal access is restricted to the `cub_internal` role.

## 5) Data handling rules

- Do not export/share personal information outside approved channels unless necessary and lawful.
- Do not paste personal information into third-party tools without a lawful basis and approval.
- Do not use production personal data in local/dev unless necessary; prefer test data.

## 6) Retention & deletion policy summary

- Account deletion: anonymise personal identifiers after grace period (currently 30 days) where feasible.
- Plan destruction: requires all guardians; delayed redaction window (typically 18 months); legal hold overrides.
- Logs: retained for security/accountability as needed.

## 7) Training & awareness (internal)

If/when staff are added:
- provide a short POPIA onboarding briefing
- record acknowledgements (email confirmation or signed acknowledgement)

## 8) Review cadence

- Review this policy at least every 6–12 months or after major system changes.

