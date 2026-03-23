# CUB Co-Parenting App

CUB is a secure, privacy‑first parenting plan and co‑parenting support application designed to help parents manage custody, visitation, and communication in a structured, respectful, and legally‑aligned way.

The app focuses on clarity, consistency, and child‑centric decision‑making, while reducing conflict and administrative friction between parents.

---

## ✨ Key Features

* 🔐 **Authentication & Protected Routes**

  * Centralized auth context
  * Route protection for authenticated areas
  * Secure token handling

* 🧠 **Parenting Plan Support**

  * Structured handling of visitation and parental responsibilities
  * Designed with legal frameworks (e.g. South Africa’s Children’s Act) in mind

* 🌐 **API‑Driven Architecture**

  * Typed API layer
  * Centralized HTTP client
  * Clear separation between UI and data access

* ⚙️ **Security‑Focused Setup**

  * Environment‑based configuration (`.env`)
  * Explicit auth flow
  * No hard‑coded secrets

---

## 🧱 Tech Stack

* **Runtime**: Bun
* **Frontend**: React 19 + TypeScript
* **Build Tool**: Vite
* **Styling**: Tailwind CSS + shadcn/ui
* **State/Auth**: React Context + custom hooks

---

## 📁 Project Structure (Relevant Additions)

bloom-grow-main/
├─ .env
├─ index.html
├─ package.json
├─ bun.lockb
├─ tsconfig.json
├─ tsconfig.node.json
├─ vite.config.ts
├─ postcss.config.js
├─ tailwind.config.ts
├─ eslint.config.js
├─ components.json
├─ README.md

└─ src/
   ├─ assets/
   │  ├─ images/
   │  ├─ logos/
   │  └─ react.svg
   │
   ├─ components/
   │  ├─ auth/
   │  │  └─ ProtectedRoute.tsx
   │  │
   │  ├─ layout/
   │  │  ├─ AppLayout.tsx
   │  │  ├─ Footer.tsx
   │  │  └─ Navbar.tsx
   │  │
   │  ├─ ui/
   │  │  └─ (shadcn-ui components)
   │  │
   │  └─ ThemeToggle.tsx
   │
   ├─ context/
   │  └─ AuthContext.tsx
   │
   ├─ hooks/
   │  ├─ useAuth.ts
   │  ├─ useMobile.tsx
   │  └─ useToast.ts
   │
   ├─ lib/
   │  ├─ api.ts
   │  ├─ http.ts
   │  └─ utils.ts
   │
   ├─ pages/
   │  ├─ Index.tsx
   │  ├─ Login.tsx
   │  ├─ Register.tsx
   │  ├─ Dashboard.tsx
   │  ├─ Profile.tsx
   │  ├─ Settings.tsx
   │  ├─ NotFound.tsx
   │  └─ (other route pages)
   │
   ├─ App.tsx
   ├─ main.tsx
   ├─ index.css
   └─ vite-env.d.ts

```

---

## 🚀 Getting Started

### Prerequisites

* Bun installed → [https://bun.sh/docs/installation](https://bun.sh/docs/installation)

### Local Development

```sh
# Install dependencies
bun install

# Start dev server
bun run dev
```

---

## 🔐 Environment Variables

Create a `.env` file at the root of the project:

```env
VITE_API_BASE_URL=your_api_url_here
```

> Do not commit `.env` files to version control.

---

## 🛡 Security Notes

* All authenticated routes are wrapped with `ProtectedRoute`
* Auth state is managed centrally via `AuthContext`
* API access is abstracted through a single HTTP client
* Designed to pass basic frontend security scans

---

## 🧪 Status

* Frontend security review completed
* Backend already passing tests
* Ready for internal demos (local or deployed)

---

## 📌 Roadmap (High‑Level)

* Demo‑ready parent flow
* Business & pricing validation
* Production deployment
* Legal review alignment per region

---

## 📄 License

Private / Proprietary – All rights reserved.
