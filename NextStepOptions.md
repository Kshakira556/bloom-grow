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
## 8. Intentional Empty States

Clear, purposeful empty states:

* No conversation selected
* No messages yet
* No contacts yet

Avoids “unfinished app” feeling.
