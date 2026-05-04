import { Footer } from "@/components/layout/Footer";

export default function Privacy() {
  const UPDATED = "2026-05-04";
  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl p-6 w-full max-w-3xl">
        <h1 className="text-2xl font-semibold mb-2">Privacy Notice (POPIA)</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Last updated: {UPDATED}
        </p>
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            This Privacy Notice explains how CUB processes personal information in line with the Protection of Personal
            Information Act, 4 of 2013 (POPIA). It is written in plain language for readability.
          </p>

          <h2 className="font-semibold pt-2">1. Responsible Party & Information Officer</h2>
          <p>
            Responsible Party: CUB (the operator of this website and application).
          </p>
          <p>
            Information Officer contact: <span className="font-medium">[INSERT CONTACT EMAIL]</span>
          </p>

          <h2 className="font-semibold pt-2">2. What we collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Account information: name, email address, phone number (optional), role, subscription status.</li>
            <li>Plan and co‑parenting data: parenting plans, invites, visits, and related metadata.</li>
            <li>Messages and message history: message content, timestamps, edits, flags, seen status.</li>
            <li>Vault data: child details, guardians, legal/medical/safety information, emergency contacts.</li>
            <li>Documents: filenames and secure file references for uploaded documents linked to vault records.</li>
            <li>Audit and operational logs: actions and timestamps (limited to what is necessary for security and troubleshooting).</li>
          </ul>

          <h2 className="font-semibold pt-2">3. Why we collect it (purposes)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To provide the CUB service (plans, visits, messaging, vault records, exports).</li>
            <li>To maintain safety, reliability, and an audit trail where appropriate.</li>
            <li>To respond to support queries and privacy requests.</li>
            <li>To meet legal obligations and prevent misuse or fraud.</li>
          </ul>

          <h2 className="font-semibold pt-2">4. Operators / processors we use</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Hosting and infrastructure providers for the web application and backend APIs.</li>
            <li>Email delivery provider (for transactional emails such as invites).</li>
            <li>Supabase Storage (private bucket) for vault document storage.</li>
          </ul>
          <p className="text-muted-foreground">
            Note: Some operators may process information outside South Africa. Where this occurs, we take reasonable
            steps to ensure appropriate safeguards are in place.
          </p>

          <h2 className="font-semibold pt-2">5. Retention</h2>
          <p>
            We retain personal information only for as long as necessary to provide the service and for lawful
            purposes. Retention periods may differ by record type (messages, vault records, documents, logs). You may
            submit a request via the Privacy Requests page for access, correction, or deletion where applicable.
          </p>

          <h2 className="font-semibold pt-2">6. Security</h2>
          <p>
            We use reasonable technical and organisational measures to protect personal information. Vault documents are
            stored in a private storage bucket and are accessed using time-limited signed links.
          </p>

          <h2 className="font-semibold pt-2">7. Your rights</h2>
          <p>
            You may request access to, correction of, or deletion of your personal information, or object to processing
            in certain circumstances. Use the Privacy Requests page in the app, or contact the Information Officer.
          </p>

          <h2 className="font-semibold pt-2">8. Changes</h2>
          <p>
            We may update this notice from time to time. The “Last updated” date above reflects the current version.
          </p>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}
