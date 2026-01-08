### **1. Login Page Wiring**

* [x] Login/SignIn form connected to `useAuth().login`.
* [x] Redirect to `/dashboard` on successful login.
* [x] Proper error messages on failed login.

---

### **2. Role-Aware UI**

* [x] `ProtectedRoute` implemented for authenticated-only pages.
* [x] `RoleProtectedRoute` implemented for role-specific pages (e.g., `/moderator` for `mediator` and `admin`).
* [ ] Ensure frontend role checks complement backend validation; do not trust frontend alone.

---

### **3. Remaining Pages Wiring**

| Page            | Status       | Notes                                                    |
| --------------- | ------------ | -------------------------------------------------------- |
| `Dashboard.tsx` | Needs wiring | Connect API data, role-aware display if needed.          |
| `Visits.tsx`    | Needs wiring | Connect API calls (`getVisits`) and display.             |
| `Messages.tsx`  | Needs wiring | Connect API calls for messaging.                         |
| `Journal.tsx`   | Needs wiring | Connect API calls for journal entries.                   |
| `Children.tsx`  | Needs wiring | Connect API calls for child profiles.                    |
| `Moderator.tsx` | Needs wiring | Role-protected; wire mediator/admin actions.             |
| `Register.tsx`  | Needs wiring | Connect to `register` API, handle redirect after signup. |
| `Index.tsx`     | Optional     | Landing page; wire buttons / links.                      |
| `NotFound.tsx`  | Done         | 404 page; no API wiring needed.                          |

---

### **4. Security & Demo-Ready Checklist**

1. **Authentication & Authorization**

   * [x] Login form works.
   * [x] Protected routes enforced.
   * [x] Role-protected routes enforced.
   * [ ] Tokens stored securely (in-memory).
   * [ ] Users cannot bypass route restrictions manually.

2. **API & Data Handling**

   * [ ] All pages use `http.ts` wrapper for API calls.
   * [ ] Handle `401 Unauthorized` and `403 Forbidden`.
   * [ ] Validate API responses; no sensitive data leaks.

3. **Frontend Safety**

   * [ ] Role checks on frontend are safe and supplemental.
   * [ ] Proper error handling for all API calls.

4. **Routing**

   * [x] Login, dashboard, and protected pages route correctly.
   * [ ] Role-protected routes tested with multiple roles.

5. **UI / UX**

   * [ ] Unauthorized messages displayed properly.
   * [ ] Buttons / links hidden if not allowed by role.

6. **CORS / Environment**

   * [x] `.env` correctly configured (`VITE_API_URL`).
   * [ ] Backend URLs match local development setup.
   * [ ] Remove temporary CSP meta tags if present.

7. **Demo-Ready**

   * [ ] Wired pages load correctly with test accounts.
   * [ ] Role-specific views render correctly.
   * [ ] No broken links or console errors.


# 📬 CUB Messages System – Build Scope (Consolidated)

## 3. Audit & Oversight Banner

Visible notice that communication is structured and auditable.

* “This conversation is logged and auditable for mediation purposes”
* Reinforces trust, accountability, and seriousness

---

## 4. Professional Read States

Replace social-chat language with legal-appropriate states:

* Sent
* Delivered
* Read / Acknowledged

Supports dispute resolution and accountability.

---

## 5. Structured Attachments

Attach files with **intent**, not just files:

* Documents
* Medical notes
* Court orders
* Reports

Attachments are part of the record.

---

## 6. Message Composer Guidance

The message input reinforces responsibility:

* Clear guidance text
* Character limit indicator
* Send disabled when empty

Prevents impulsive or unclear communication.

---

## 7. Mediator Actions (Handled Elsewhere)

Moderator-only actions live in the **Moderator Dashboard**, not Messages:

* Review flagged messages
* Lock threads
* Add private mediator notes
* Summarise conversations

(Messages page remains neutral and safe.)

---

## 8. Intentional Empty States

Clear, purposeful empty states:

* No conversation selected
* No messages yet
* No contacts yet

Avoids “unfinished app” feeling.

---

## 9. Flag Communication

Any participant can flag a message:

* Reason required (e.g. safety, escalation, inappropriate)
* Message becomes visible in Moderator Dashboard
* Non-destructive (message remains visible)

---

## 10. Trust & Purpose Banner (Key Differentiator)

A short, powerful statement explaining *why* this messaging system exists:

> “Communication here is structured, auditable, and linked to parenting plans.”

This is your **demo mic-drop**.

---

## 11. Contact System

Messaging is based on **approved contacts**, not free-form chat:

* Parent
* Mediator
* Lawyer
* Counselor / Professional

No random users, no DMs without context.

---

## 12. Date Grouping in Chat

Messages are grouped by date:

* “Today”
* “Yesterday”
* Specific dates

Improves readability and legal clarity.

---

## 🚫 Explicitly Excluded (By Design)

To protect the seriousness of the platform:

* Emojis / reactions
* GIFs
* Typing indicators
* Online presence
* Ephemeral messages

This is **communication for records**, not social chatter.

---

## 🎯 What This Achieves

* Clear legal & mediation positioning
* Strong demo narrative
* Aligned with your backend domain (legal, medical, safety)
* Scales cleanly into audits, reports, and court exports

---

