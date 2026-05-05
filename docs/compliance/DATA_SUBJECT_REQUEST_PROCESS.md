# CUB — Data Subject Request Process (DSAR / Correction / Deletion / Objection)

Last updated: 2026-05-05

> Internal document. Not legal advice. This describes how users exercise rights and how CUB processes requests.

## How users can request

In-app:
- Privacy Requests page: `/privacy-requests`

Self-service exports:
- DSAR JSON: `GET /api/privacy/my-data`
- DSAR ZIP: `GET /api/privacy/my-data/bundle`

Deletion request:
- Settings → “Request deletion” (`POST /api/users/deletion-request`)

## How CUB processes requests (internal)

CUB Internal:
- `/cub` → Privacy Requests
- Statuses:
  - `pending` → `acknowledged` → `fulfilled` OR `rejected`

Record keeping:
- Store evidence in `[INSERT_PRIVATE_EVIDENCE_LOCATION]` (see `EVIDENCE_STORAGE.md`)
- Optionally add notes in `PROCESSING_LOG.md`

## Records of requests handled

- `privacy_requests` table (status + timestamps)
- audit logs (privacy status updates + email failures)
- exported DSAR files (where applicable) stored in evidence folder

