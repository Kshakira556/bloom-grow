# CUB — Record of Processing Activities (RoPA)

Last updated: 2026-05-04

> Internal document. Not legal advice. This is a working POPIA compliance artifact for CUB.

<!--
TODO (Owner: Shakira Knight / POPIA Director)
- [ ] Confirm official entity name for “Responsible Party”.
- [ ] Confirm deputy Information Officer (if any) and escalation chain.
- [ ] Confirm incident inbox alias and backups (incidents@cubapp.co.za; backups: nicole@cubapp.co.za, shakira@cubapp.co.za).
- [ ] Confirm data hosting regions for Vercel/Render/Supabase/Resend (cross-border statement).
- [ ] Confirm retention positions for any items not covered by “retain while lawful / redact on destruction clock”.
- [ ] Confirm list of staff/admin access roles and who can access production data.
-->

## 1) Responsible Party / Information Officer

- Responsible Party: CUB (operator of the CUB website and application)
- POPIA Director / Information Officer: Shakira Knight
- Contact: kni.shakira@gmail.com / +27818535226

## 2) Summary of processing

CUB is an auditable co-parenting record system. It processes personal information to:
- enable co-parenting collaboration (plans, visits, messaging)
- maintain safety and continuity of child records (Vault)
- provide accountability and dispute-resolution records (auditability, history, exports)

## 3) Categories of data subjects

- Parents / guardians (end users)
- Children (special personal information)
- Mediators / client organisations (client-facing roles)
- CUB internal staff (cub_internal role)

## 4) Categories of personal information

### Account & identity
- Full name, email address, phone number (optional)
- Account type/subscription status
- Authentication data (password hash, JWT sessions)
- Terms/Privacy acceptance flags (version + timestamp)

### Parenting plans & operational records
- Plan metadata (title, status, participants)
- Visits (time ranges, optional location and notes)
- Change requests / proposals (plan-related metadata)

### Messages
- Message content
- Timestamps
- Seen status
- Edits and deletion history
- Flag status/reasons (oversight)

### Child Vault (special personal information)
- Child identifying details and caregiver-provided information
- Medical / legal / safety / emergency contact information
- Documents metadata and secure storage references

### Auditability & security logs
- Audit log actions and timestamps for sensitive operations (exports, signed URLs, edits, etc.)

## 5) Purposes and lawful basis (high level)

POPIA allows processing where it is:
- necessary to provide the service and fulfil user expectations (contractual/service delivery)
- necessary for legitimate interests (accountability, dispute resolution, legal defence)
- necessary for legal obligations (where applicable)

Children’s data is treated as higher sensitivity. Processing is justified by guardian involvement and the legitimate purpose of maintaining structured records in the best interests of the child.

## 6) Recipients / operators (processors)

Operators used by CUB:
- Vercel (frontend hosting)
- Render (backend hosting)
- Supabase (database + private Storage for Vault documents)
- Resend (transactional email delivery)

## 7) International transfers / cross-border

Operators may store/process data outside South Africa depending on their infrastructure. CUB uses reasonable safeguards and limits access in line with POPIA expectations.

## 8) Retention (operational policy summary)

Default position (defensible retention):
- Core co-parenting records are retained where lawful for accountability and dispute resolution.
- “Account deletion” means anonymisation of the deleting user’s identifiers (name/email/phone) after a grace period.
- “Plan destruction” requires both guardians, then a delayed redaction window (typically 18 months), after which plan-scoped content is redacted.
- Low-value operational data (expired invites/tokens) may be deleted automatically.

## 9) Security measures (summary)

Technical:
- Password hashing (bcrypt)
- JWT authentication
- Private document storage with time-limited signed URLs (view/download)
- Rate limiting on sensitive endpoints
- Audit logs for sensitive actions

Organisational:
- Controlled access to production secrets and service-role credentials
- Incident response runbook (see `docs/compliance/INCIDENT_RESPONSE.md`)

## 10) Data subject request handling

Requests are accepted via in-app privacy request flow and/or direct contact to the Information Officer. Requests include:
- access
- correction
- deletion/anonymisation
- objection

## 11) Change control / evidence

Maintain evidence of:
- policy versions (Privacy Notice + Terms)
- major decisions about retention, deletion, redaction, and legal hold
- key rotation dates and access changes
