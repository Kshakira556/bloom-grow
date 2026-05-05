# CUB — Privacy Policy / Privacy Notice (External)

Last updated: 2026-05-05

> Plain-language notice aligned with the Protection of Personal Information Act, 4 of 2013 (POPIA).

## 1) Responsible Party & Information Officer

- Responsible Party: **[INSERT LEGAL ENTITY NAME]** (operator of the CUB website and application)
- POPIA Director / Information Officer: **Shakira Knight**
- Contact: **kni.shakira@gmail.com** / **+27818535226**
- Incident inbox: **incidents@cubapp.co.za** (Backups: **nicole@cubapp.co.za**, **shakira@cubapp.co.za**)

## 2) What personal information we collect

### Account & identity
- Full name
- Email address (required)
- Phone number (optional)
- Role (parent / mediator / admin / CUB internal)
- Subscription/account type (trial/paid) and subscription status
- Authentication data (password hash; we never store your plain password)
- Terms/Privacy acceptance record (flag, version, timestamp)

### Co‑parenting records
- Parenting plans and participants
- Visits/schedules and related change requests
- Messages and message history (edits, deletions, seen status, flags)
- Proposals/notes linked to a plan (where applicable)

### Child Vault (higher sensitivity)
- Child details and guardian-provided information
- Legal / medical / safety information
- Emergency contacts
- Vault document metadata and secure storage references

### Audit & operational logs
- Security and operational logs (for fraud prevention, troubleshooting, and accountability)
- Audit logs of sensitive actions (exports, signed URLs, edits, legal hold, etc.)

## 3) Why we collect it (purposes)

We collect and process personal information to:
- provide the CUB service (plans, visits, messaging, Vault, exports)
- maintain safety and continuity of child records
- maintain reliability and an audit trail where appropriate
- respond to support queries and privacy requests
- prevent fraud, misuse, and security incidents
- comply with lawful obligations where applicable

## 4) Lawful basis (high level)

We process personal information where it is lawful and necessary, including where it is necessary to provide the service, where it supports legitimate interests (accountability/dispute resolution), and where legal obligations apply.

Children’s information is treated as higher sensitivity. CUB processes child-related information in the context of guardian involvement and for the legitimate purpose of maintaining structured co‑parenting records and child safety information.

## 5) Where it is stored

- Database: Supabase (production)
- Vault documents: Supabase Storage (private bucket) using time-limited signed URLs
- Hosting:
  - Frontend: Vercel
  - Backend API: Render
- Email delivery: Resend

## 6) Who has access

- Parents: access to their own account and the plans/children they are authorised to access.
- Mediators/Admins (client-facing roles): access to administrative views as required for their role and assignments.
- CUB internal staff (cub_internal): operational tools and restricted access for support/compliance tasks.

Access is role-based and is logged for sensitive actions where appropriate.

## 7) Retention (how long we keep information)

CUB keeps information only for as long as needed for the service and lawful purposes. Practical retention rules:
- Account/profile data: retained while active/deactivated; after deletion request, personal identifiers are removed or anonymised after a grace period (currently **30 days**) where feasible.
- Shared records (messages/plan history): retained where lawful for accountability and dispute resolution; deleted users may be de-identified where feasible.
- Child Vault records/documents: not automatically deleted when one parent deletes their profile, because the other guardian may still lawfully require them and they may be needed for safety/accountability.
- Plan “full destruction”: requires all guardians; plan-scoped content is retained for a limited period (typically **18 months**) for dispute/legal safety purposes, then redacted/anonymised unless legal hold applies.
- Low-value operational data (expired invites/tokens): deleted when no longer needed.

## 8) Further processing (secondary use)

If CUB uses personal information for a new purpose, we will only do so where it is compatible with the original purpose and lawful, or where you have consented.

## 9) Security safeguards

We use reasonable technical and organisational measures to protect personal information, including:
- password hashing and authenticated access controls
- private document storage with signed URLs
- rate limiting and monitoring to reduce abuse
- audit logging for sensitive actions

## 10) Exports

If you export records (PDF/JSON/ZIP), you are responsible for keeping the exported files secure and only sharing them with trusted recipients.

## 11) Your rights (data subject participation)

You can request:
- access to your information (DSAR)
- correction
- deletion/anonymisation of your profile information (where feasible and lawful)
- objection/withdrawal where applicable

Use the in-app Privacy Requests page and/or contact the Information Officer.

## 12) Complaints

Contact the POPIA Director / Information Officer (above). If you are not satisfied with our response, you may escalate to the Information Regulator (South Africa).

## 13) Changes

We may update this notice from time to time. The “Last updated” date above reflects the current version.

