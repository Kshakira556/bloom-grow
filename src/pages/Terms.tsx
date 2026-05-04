import { Footer } from "@/components/layout/Footer";

export default function Terms() {
  const UPDATED = "2026-05-04";
  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl p-6 w-full max-w-3xl">
        <h1 className="text-2xl font-semibold mb-2">Terms and Conditions</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Last updated: {UPDATED}
        </p>
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            These Terms govern your use of the CUB application and website. They are provided in plain language for
            readability.
          </p>

          <h2 className="font-semibold pt-2">1. Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your login credentials and for activity that
            occurs under your account.
          </p>

          <h2 className="font-semibold pt-2">2. Parenting plans, messages, and vault records</h2>
          <p>
            CUB allows parents and mediators to manage parenting plan information, visits, messages, and vault records.
            You must ensure that information you provide is accurate and that you have the right to share it.
          </p>

          <h2 className="font-semibold pt-2">3. Document uploads</h2>
          <p>
            Uploaded documents are stored securely. Do not upload unlawful content or content you do not have the right
            to share.
          </p>

          <h2 className="font-semibold pt-2">4. Acceptable use</h2>
          <p>
            You agree not to misuse the service, attempt to access data you are not authorised to access, or disrupt the
            platform.
          </p>

          <h2 className="font-semibold pt-2">5. Support and notices</h2>
          <p>
            If you have questions about these Terms or your privacy rights, contact the POPIA Director / Information Officer:
            <span className="font-medium"> kni.shakira@gmail.com</span> / <span className="font-medium">+27818535226</span>.
          </p>

          <h2 className="font-semibold pt-2">6. Retention and deletion</h2>
          <p>
            CUB retains records for as long as needed to provide the service and meet lawful purposes. Deactivation is different
            from deletion. If you request deletion, we apply a grace period (currently 30 days) and then permanently remove or
            anonymise your personal profile information where feasible. Shared co-parenting records (including messages and child-related
            vault records) may be retained where lawful for the other guardian’s use, legal compliance, and accountability, and your identity
            may be de-identified where feasible.
          </p>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}
