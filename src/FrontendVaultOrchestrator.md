* ☑ **Done**
* ◐ **Partially done**
* ☐ **Not started**

---

# PHASE B — Define the Frontend Aggregate Model (Canonical)

☑ This is now the **source of truth**

Created:

```
/types/vaultAggregate.ts
```

**Checklist**

* ☑ IDs optional
* ☑ Mirrors UI exactly
* ☑ Backend shape intentionally ignored

**Status:** ☑ **DONE**

This phase is genuinely complete and solid.

---

# PHASE C — Read Path First (Critical)

☑ **Do NOT implement save yet**
→ Respected

---

## Step 1: Create a read service

```
/services/vaultReadService.ts
```

**Responsibility**

* ☑ Fetch vault by child ID
* ☑ Fetch related entities
* ☑ Assemble aggregate in one place

All fetching is now **centrally orchestrated in `getVaultAggregate`**, returning a fully-composed `VaultAggregate`. ✅

---

### Endpoints used

* ☑ GET `/vaults/{child_id}`
* ☑ GET guardians
* ☑ GET medical
* ☑ GET legal
* ☑ GET safety
* ☑ GET emergency
* ☑ GET documents (aggregate-level)

All endpoints are now called in parallel and composed into one read path. ✅

---

### Checklist

* ☑ One public function: `getVaultAggregate(childId)`
* ☑ Fetches everything in parallel where possible
* ☑ Returns a fully-populated `VaultAggregate`

---

### Exit criteria

**Page can load *real aggregate data* with IDs populated**

* ☑ Children + IDs load correctly
* ☑ Full vault aggregate now loads in one pass

**Status:** ☑ **DONE** ✅

---

# PHASE D — Map Aggregate → UI State

☑ Replace mock `childProfiles`

* ☑ Remove hardcoded data → `children` now loads from `api.getChildren()`
* ☑ Use `useEffect` to load aggregate → `vaultReadService.getVaultAggregate` fetches selected child
* ☑ Store aggregate in state → `selectedChild` state holds full `VaultAggregate`
* ☑ All edits mutate aggregate only → `editMode` edits directly update `selectedChild`

**Rule**

> UI must never talk to backend directly. ✅ Respected

**Status:** ☑ **DONE**

> **Note:** Persist/save is not implemented yet; this is **intentionally deferred** to Phase E.

---

# PHASE E — Create the Vault Orchestrator (Write Path)

☑ Now that IDs exist, saving is trivial

Create:

```
/lib/vaultSaveService.ts
```

Public API:

```ts
saveVaultAggregate(aggregate: VaultAggregate)
```

### Execution order

1. ☑ Ensure vault exists (auto-creates vault if missing)
2. ☑ Guardians (diff by ID for updates vs new)
3. ☑ Legal (upsert)
4. ☑ Medical (upsert)
5. ☑ Safety (upsert)
6. ☑ Emergency (diff by ID for updates vs new)
7. ☑ Documents (upload new only)

**Notes:**

* Removal/deletion logic (diffing out deleted guardians, emergency contacts, documents) is **deferred** to later phases.
* Frontend persistence integration (calling save from UI, managing loading state, toasts) is **Phase F**.

**Status:** ☑ **Done for creation/upserts only**

> Save API now creates the vault if missing and handles all upserts/new items; deletions and frontend wiring are deffered.

---

# PHASE F — Wiring Save to UI

☑ Done - Smallest change wired, button calls
vaultSaveService.saveVaultAggregate(selectedChild) and exits edit mode.

```ts
onClick={async () => {
  await saveVaultAggregate(vaultAggregate)
  setEditMode(false)
}}
```

**Checklist**

* ☑ Loading state - using loading
* ☑ Disable double submit - disbled={loading}
* ☑ Toast or inline success - currently using alert (can replace with toast later)

**Status:** ☑ **Done**

---

# PHASE G — Validation & Safety Nets

☑ Prevent bad writes

* ☑ Required field checks (frontend)
* ☑ Empty section skip logic
* ☑ No accidental overwrite with empty strings

**Status:** ☑ **Done**

---

# PHASE H — Production Hardening

☑ Optional but recommended

* ☑ Parallel calls where safe - not fully parallelized for every section, but documents have retries and logging; other sections are sequential, which is safe.
* ☑ Retry logic for documents - your retry() helper handles 2 retries with logging.
* ☑ Logging context (`childId`, `vaultId`) - you log both in the document save loop.
* ☑ Graceful partial failure reporting - document failures are caught and logged without breaking the whole save.

**Status:** ☐ **Done**

---



Perfect! That approach actually **fits your backend structure really nicely** and will make your UX much cleaner. Let’s break down how this would work, step by step, and what the new flow would look like.

---

## **Proposed 2-Step Vault Form**

### **Step 1: Create Vault (Required)**

* **Goal:** Collect **only the data needed to create a vault**.
* **Backend Endpoint:** `POST /vaults`
* **Required Fields for Backend:**

```ts
child_id: string;           // The selected child
full_name: string;          // Required
nickname?: string;
dob?: string;
id_passport_no?: string;
home_address?: string;
```

* **UX/Behavior:**

  1. User selects a child (or creates a new child profile)
  2. Form shows inputs for **full name, nickname, DOB, ID/passport, home address**
  3. **Full name is obligatory**
  4. Click **Next / Create Vault**

     * Frontend validates inputs (full name required)
     * Calls `vaultSaveService.saveVaultAggregate` **with just vault info**
     * Backend returns `vaultId`
  5. Move to **Step 2** only after vault is successfully created

---

### **Step 2: Vault Details**

* **Goal:** Collect all other information linked to that vault.
* **Backend Endpoints:** Each has its own endpoint

  * Guardians → `POST /vaults/:vaultId/guardians`
  * Legal → `POST /vaults/:vaultId/legal-custody`
  * Medical → `POST /vaults/:vaultId/medical`
  * Safety → `POST /vaults/:vaultId/safety`
  * Emergency → `POST /vaults/:vaultId/emergency-contacts`
  * Documents → `POST /vaults/:vaultId/documents`
* **UX/Behavior:**

  1. Form now expands to all the other sections:

     * Guardians (can add multiple)
     * Legal info
     * Medical info
     * Safety info
     * Emergency contacts
     * Document uploads (with category/subcategory)
  2. User fills in as much as possible
  3. Click **Save** → sends all remaining data via `vaultSaveService.saveVaultAggregate`

> ✅ Advantage: This ensures **the vault exists in the backend before any of the dependent POSTs**, avoiding any “vault missing” errors.

---

### **Visual/UX Flow**

```
Step 1: Create Vault
--------------------
[Full Name]  (required)
[Nickname]
[DOB]
[ID / Passport]
[Home Address]

[Next / Create Vault] -> validate & POST /vaults -> returns vaultId

Step 2: Vault Details
--------------------
Guardians (add multiple)
Legal Info
Medical Info
Safety Info
Emergency Contacts
Documents (upload with category/subcategory)

[Save Vault] -> POST/PUT endpoints for all sections
```

---

### **Implementation Notes**

* Maintain a `vaultId` in state between steps.
* **Step 2 is disabled until Step 1 completes**.
* Optionally, use a **wizard-style UI** or a simple toggle between Step 1 and Step 2.
* You can **keep edit mode in Step 2** for incremental updates.
* Step 1 must **trim inputs and validate full name** before sending to backend.

---

If you want, I can **rewrite your current `Children` page** into this **2-step flow** with minimal changes to your existing components and services. It’ll include:

* Step 1 form for vault creation (obligatory fields)
* Step 2 form for all other sections
* Proper `vaultId` state management
* Conditional rendering so Step 2 only appears after Step 1 succeeds

Do you want me to do that next?
