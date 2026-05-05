# CUB — Marketing Email Templates (Section 69 readiness)

Last updated: 2026-05-05

> CUB does not currently send marketing emails. This file exists so that if/when marketing begins, templates and required safeguards are ready.

## Rules (must-follow)

- Only send to users with `marketing_opt_in = true`.
- Every marketing email must include:
  - a clear unsubscribe link
  - a brief statement that it is a marketing message
- Unsubscribe must work without login using:
  - `GET /api/users/marketing/unsubscribe?token=...`

## Template: Product update (example)

Subject: CUB product update

Body (HTML):
- Header: "CUB Product Update"
- Short summary
- CTA link to app
- Footer:
  - "You are receiving this email because you opted in to marketing emails in CUB."
  - "Unsubscribe" link: `{{UNSUBSCRIBE_URL}}`

## Unsubscribe URL construction

- Generate a one-time token server-side using the authenticated user id:
  - `POST /api/users/marketing/unsubscribe-token` → `{ token }`
- Unsubscribe URL:
  - `https://cub-parenting-plan-backend.onrender.com/api/users/marketing/unsubscribe?token={{token}}`

