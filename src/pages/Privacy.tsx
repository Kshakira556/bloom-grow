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
            POPIA Director / Information Officer: <span className="font-medium">Shakira Knight</span>
          </p>
          <p>
            Email: <span className="font-medium">kni.shakira@gmail.com</span> {"\u2022"} Phone:{" "}
            <span className="font-medium">+27818535226</span>
          </p>

          <h2 className="font-semibold pt-2">2. What we collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Account information: name, email address (required), phone number (optional), role, subscription status.</li>
            <li>Plan and co-parenting data: parenting plans, invites, visits, and related metadata.</li>
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
            <li>Vercel (web hosting for the frontend).</li>
            <li>Render (hosting for backend APIs).</li>
            <li>Supabase (database and private Storage for vault documents).</li>
            <li>Resend (transactional emails such as invites).</li>
          </ul>
          <p className="text-muted-foreground">
            Note: Some operators may process information outside South Africa. Where this occurs, we take reasonable
            steps to ensure appropriate safeguards are in place.
          </p>
          <p className="text-muted-foreground">
            We do not sell personal information. Operators act on our instructions to provide the service (hosting, storage, email delivery).
          </p>

          <h2 className="font-semibold pt-2">5. Retention</h2>
          <p>
            We retain personal information only for as long as necessary to provide the service and for lawful purposes.
            In general, we retain records while your account remains active or deactivated.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <span className="font-medium">Account/profile data</span>: retained while your account is active or deactivated; deleted or anonymised after a deletion request is processed.
            </li>
            <li>
              <span className="font-medium">Messages and interaction history</span>: retained as shared co-parenting records where lawful (including for accountability, dispute resolution, and legal defence). A deleted user may be de-identified where feasible.
            </li>
            <li>
              <span className="font-medium">Child vault records, schedules, and documents</span>: retained as shared guardian records where lawful (including for safety, accountability, and dispute resolution), and are not automatically deleted when one parent deletes their profile.
            </li>
            <li>
              <span className="font-medium">Audit and security logs</span>: retained as needed for accountability, security, fraud prevention, and dispute resolution, even where profile data is anonymised.
            </li>
            <li>
              <span className="font-medium">Low-value data</span>: expired invites, temporary tokens, and other short-lived operational data may be deleted automatically when no longer needed.
            </li>
          </ul>
          <p>
            <span className="font-medium">Deactivation vs deletion:</span> deactivation may preserve your profile for later return.
            Deletion is different: when you request deletion, we begin a deletion process. We apply a grace period (currently{" "}
            <span className="font-medium">30 days</span>) to allow dispute resolution, fraud prevention, and operational stability.
            After the grace period, we permanently remove or anonymise your personal profile information (name, email, phone) where feasible.
          </p>
          <p>
            <span className="font-medium">Individual rights:</span> each person’s data rights are individual. If Parent A requests deletion,
            we delete or de-identify Parent A’s personal profile information (unless there is a lawful reason to retain specific items).
            Parent B’s personal information is not affected.
          </p>
          <p>
            <span className="font-medium">Children and shared records:</span> child records and shared interaction records (such as messages,
            plan history, and audit logs) are not automatically deleted when one parent requests deletion. These records may remain lawfully
            necessary for the other guardian’s ongoing use of the service, for legal compliance, and for accountability. Where feasible, we
            de-identify a deleted user in shared records.
          </p>
          <p>
            <span className="font-medium">Both-guardian destruction window:</span> where all guardians request full destruction of shared records,
            we may first mark the plan as pending destruction and lock new activity. Records may then be retained for a limited period (typically{" "}
            <span className="font-medium">18 months</span>) for legal, safety, and dispute-resolution purposes before permanent deletion or full anonymisation,
            unless a legal hold or other lawful basis requires longer retention.
          </p>
          <p>
            <span className="font-medium">Legal hold:</span> we may pause or prevent destruction where records are required for disputes, legal proceedings,
            or accountability. This protects the rights of all parties and the integrity of the record.
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
          <p className="text-muted-foreground">
            Further processing: if we use personal information for a new purpose, we will only do so where it is compatible with the original
            purpose and lawful, or where you have consented.
          </p>
          <p className="text-muted-foreground">
            Objection and withdrawal: where you have the right to object to processing or withdraw consent, we will assess your request and respond
            within a reasonable time. Some processing may continue where there is another lawful basis (for example, legal obligations, safety, or
            dispute-resolution/audit requirements).
          </p>
          <p className="text-muted-foreground">
            Exports: if you export records (PDF/JSON/ZIP) you are responsible for keeping them secure and only sharing them with trusted recipients.
          </p>

          <h2 className="font-semibold pt-2">7.1 Security incidents (breach notification)</h2>
          <p className="text-sm text-muted-foreground">
            If we reasonably believe there has been unauthorised access to personal information, we will take steps to contain and investigate the incident,
            preserve evidence, and notify affected parties and/or the regulator where required and appropriate.
          </p>
          <p className="text-sm text-muted-foreground">
            Incident contact: <span className="font-medium text-foreground">incidents@cubapp.co.za</span> • Backup contacts:{" "}
            <span className="font-medium text-foreground">nicole@cubapp.co.za</span>,{" "}
            <span className="font-medium text-foreground">shakira@cubapp.co.za</span>
          </p>

          <h2 className="font-semibold pt-2">8. Complaints</h2>
          <p>
            Complaints about how we process personal information can be made to the POPIA Director / Information Officer
            using the contact details above. We will respond within a reasonable time and work with you to resolve the concern.
          </p>
          <p className="text-muted-foreground">
            If you are not satisfied with our response, you may also escalate a complaint to the Information Regulator (South Africa).
          </p>

          <h2 className="font-semibold pt-2">9. Changes</h2>
          <p>
            We may update this notice from time to time. The "Last updated" date above reflects the current version.
          </p>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}
