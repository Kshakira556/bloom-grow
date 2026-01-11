# **Moderator / Admin System Checklist (Updated)**

### **Roles**

* [✅] Moderator / Mediator – manages disputes, plans, messages, and client relationships with **final say on flagged content and plan approvals**

* [✅] Admin – can manage moderators, global settings, and audit logs
  [✅] Admin – full system oversight, including:

  Manage moderators (create, edit, deactivate, assign to clients/plans) ✅ implemented

  Configure global settings (app-wide rules, email templates, system preferences) ❌ partially implemented

  Access audit logs for all user, moderator, and system actions ✅ basic audit trails

  Review system reports (e.g., flagged content trends, usage metrics) ✅ partial stats

  Override moderator decisions if needed ✅ UI scaffolded

  Assign roles and permissions to users and moderators ❌ not fully functional

* [✅] User / Parent – end-user of the app. May be linked to **one or more plans, multiple children, multiple parents supported**

---

## **1️⃣ Core Data & Relationships**

* [✅] Client / Profile
* [✅] Child / Dependent – supports **multiple children per parent and multiple parents per child**
* [✅] Plan – supports **multi-parent, multi-child setups**
* [✅] Visit / Event – scheduling **with parent permissions**, coordinated across plans (some moderation pending)
* [✅] Messages – plan-based, **flagging & moderation workflow exists**
* [❌] Attachments / Files – UI exists partially, actions not fully handled; includes vault docs, medical, legal, safety, emergency contact files
* [✅] Audit Logs – basic trails exist; full filtering/export pending

---

## **2️⃣ Moderator/Admin Pages**

### **A. Dashboard / Overview**

* [✅] Admin Dashboard page now uses **AdminLayout**
* [✅] Overview page with header and stats cards
* [✅] Recent activity feed (partial audit trail)
* [❌] Pending moderation summary – counts mostly static placeholders
* [❌] Quick search by plan ID / child / message ID / vault ID

---

### **B. Moderator Page**

* [✅] Moderator / Mediator dashboard uses **ModeratorLayout**
* [✅] Quick stats cards (messages reviewed, flags, clients, plans, children)
* [✅] Flagged messages & proposed changes tabs functional in UI
* [✅] Recent moderator activity feed
* [✅] Quick access buttons for each tab
* [❌] Full approve/reject workflow + comment + audit logging partially implemented

---

### **C. Client / Profile Management**

* [✅] Client List (search input + example client)
* [✅] Client Profile basic structure (partial)
* [❌] Full moderation actions: suspend/reactivate, role change, assign/unassign plans, flag for attention

---

### **D. Children / Dependents**

* [✅] Child List (example data)
* [✅] Child Profile basic display
* [❌] Full edit/remove/audit actions
* [✅] Vault info linked to child (medical, legal, safety, emergency contacts, documents)
* [✅] Multiple parents can be linked per child

---

### **E. Plan Management**

* [✅] Plan List with example
* [✅] Plan Detail basic structure
* [❌] Add/edit/remove visits/events
* [❌] Add/remove clients
* [❌] Approve/reject proposed changes in detail
* [❌] Archive plan
* [✅] Multi-parent & multi-child support reflected in plan views

---

### **F. Visit / Event Moderation**

* [❌] Approve/reject proposed visit changes (UI placeholders exist, full workflow not integrated)
* [❌] History of past edits with context
* [✅] Permissions control – parents can propose, approve, or view depending on role

---

### **G. Messages & Attachments Moderation**

* [✅] Messages list display + flag badge
* [❌] Approve/reject + moderator notes integration
* [❌] Attachments view + approve/reject + audit

---

### **H. Dispute / Proposed Change Management**

* [✅] Pending Changes tab UI
* [❌] Approve/reject/comment/escalate fully functional
* [✅] Flags tracked with **audit trail and mediator final say**

---

### **I. Audit / History**

* [❌] Full audit log filtering and exporting
* [❌] Action types beyond recent activity (account changes, plan edits, message/attachment moderation)
* [✅] Basic audit trails exist in recent actions & flagged messages

---

### **J. Settings / Admin Features**

* [❌] Manage moderators
* [❌] Role management
* [❌] System-wide settings
* [❌] Logs retention policies

---

## **3️⃣ Key UX & Access Patterns**

* [✅] Search-first inputs exist (partial)
* [✅] Contextual detail visible in tabs
* [✅] Audit-first: recent activity cards exist (partial)
* [❌] Modal vs page distinctions for all minor/major edits
* [✅] Permissions: basic (only moderator sections shown)
* [✅] Mediator / professional **control over flagged messages, final approvals, and audit visibility**

---

## **4️⃣ Moderator Workflow Example**

* [✅] Pending changes tab shows proposed visit changes
* [❌] Full approve/reject workflow + comment + audit logging not fully functional
* [❌] Client notifications
* [✅] Flagged messages workflow implemented in UI for demo
* [✅] Mediator final say tracked for conflicts

---

## **5️⃣ Proposed Page Map**

* [✅] Tabs and pages scaffolded for all main sections
* [❌] Dynamic data integration for most pages
* [✅] Vault pages for each child (docs, medical, legal, safety, emergency contacts)
* [✅] Multi-child/multi-parent plans reflected in UI and moderation pages

