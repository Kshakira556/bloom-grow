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

## 3️⃣ Gracefully handle long texts in text bubbles

**Problem:** Long messages currently might overflow or be hard to read.

**Plan:**

* **Max width:** Already set to 70%; maybe reduce slightly on smaller screens.
* **Word wrap:** Ensure `break-words` and `whitespace-pre-wrap`.
* **Collapsible/expandable messages:** For very long texts, show the first ~200 chars and a “Show more” button.

---

## 4️⃣ Add “Export Conversation” button

**Goal:** Allow user to export conversation as PDF or CSV.

**Plan:**

* Place a button near the conversation header.
* When clicked:

  1. Gather all messages for the selected conversation.
  2. Format as structured JSON → CSV / PDF.
  3. Trigger browser download.

**Implementation example:**

```tsx
<button
  onClick={() => exportConversation(selectedConversation.id)}
  className="ml-auto px-3 py-1 bg-primary text-white rounded-full text-sm hover:bg-primary-dark"
>
  Export Conversation
</button>
```

**Tech Choices:**

* CSV: `papaparse` or native CSV generation
* PDF: `jsPDF` or `pdfmake`

---

## 5️⃣ Optional Refinements / Nice-to-Have

* **Sticky date headers:** While scrolling, the current date header sticks at top.
* **Attachment previews:** Show icons or thumbnails for PDFs/images.
* **Accessibility:** Ensure all buttons have `aria-label`.
* **Keyboard navigation:** Tab between messages and input.

---

### ✅ Next Steps / Roadmap

| Task                                   | Priority | Notes                               |
| -------------------------------------- | -------- | ----------------------------------- |
| Draft message model & purpose selector | High     | Required for proper bubble matching |
| Improve header layout for long text    | High     | Truncate + tooltip + wrap           |
| Handle long messages gracefully        | High     | Collapsible bubbles + break-words   |
| Add Export Conversation button         | Medium   | CSV / PDF download                  |
| Optional refinements                   | Low      | Sticky headers, attachment previews |

---