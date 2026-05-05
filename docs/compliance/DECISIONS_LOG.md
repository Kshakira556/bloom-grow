# CUB — Compliance Decisions Log (POPIA)

Last updated: 2026-05-05

> Internal document. Keep entries short and factual. This log is evidence of decisions taken for accountability.

## Owners

- POPIA Director / Information Officer: Shakira Knight
- Incident inbox: incidents@cubapp.co.za
- Backups: nicole@cubapp.co.za, shakira@cubapp.co.za

## How to use

- Add a new entry for any meaningful decision affecting personal information processing (retention, access controls, operators, exports, breach response, etc.).
- Link to the PR/commit and any relevant tickets/emails.

## Entries

### 2026-05-05 — POPIA baseline implementation

- Decision: Implement POPIA openness + DSAR + deletion/anonymisation + plan redaction lifecycle + legal hold + audit logging + rate limiting.
- Rationale: Provide defensible processing and auditability for co‑parenting records while minimising risk and enabling data subject participation.
- Evidence: Code changes across frontend/backend, SQL migrations under `docs/sql/`, operational runbooks under `docs/compliance/`.

