import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";

export default function Settings() {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [deletionReason, setDeletionReason] = useState("");
  const [isSubmittingDeletion, setIsSubmittingDeletion] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingBundle, setIsExportingBundle] = useState(false);
  const [marketingOptIn, setMarketingOptInState] = useState<boolean>(Boolean(user?.marketing_opt_in));
  const [isSavingMarketing, setIsSavingMarketing] = useState(false);

  const deletionReasonTrimmed = useMemo(() => deletionReason.trim(), [deletionReason]);

  useEffect(() => {
    setMarketingOptInState(Boolean(user?.marketing_opt_in));
  }, [user?.marketing_opt_in]);

  const handleRequestDeletion = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      "Request account deletion?\n\nThis will disable your account soon after your request is submitted. After a 30-day grace period, we will permanently remove or anonymise your personal profile information (name, email, phone) where feasible.\n\nShared co-parenting records (including messages and child-related vault records) may be retained where lawful for accountability, dispute resolution, and the other guardian’s rights, but your identity will be de-identified where feasible.\n\nContinue?"
    );
    if (!confirmed) return;

    setIsSubmittingDeletion(true);
    try {
      await api.requestAccountDeletion({
        reason: deletionReasonTrimmed || undefined,
      });

      toast({
        title: "Deletion request submitted",
        description:
          "Your request has been recorded. You may be signed out shortly as deletion processing begins.",
      });

      // Safe default: sign out to prevent confusion if backend blocks login immediately.
      logout();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit deletion request";
      toast({
        title: "Deletion request failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingDeletion(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-10 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and privacy preferences.
          </p>
        </div>

        <Card className="p-6">
          <h2 className="font-display text-xl font-bold">Account</h2>
          <div className="mt-4 grid gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Name: </span>
              <span className="font-medium">{user?.full_name ?? "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Email: </span>
              <span className="font-medium">{user?.email ?? "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Role: </span>
              <span className="font-medium">{user?.role ?? "—"}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-xl font-bold">Privacy &amp; Data</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review the Privacy Notice and Terms, request a copy of your information, or request deletion.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            POPIA Director / Information Officer: <span className="font-medium text-foreground">Shakira Knight</span>{" "}
            (<span className="font-medium text-foreground">kni.shakira@gmail.com</span> •{" "}
            <span className="font-medium text-foreground">+27818535226</span>)
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/privacy">View Privacy Notice</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/terms">View Terms</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/privacy-requests">Privacy Requests</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/privacy-requests?type=correction">Request correction</Link>
            </Button>
            <Button
              variant="outline"
              disabled={isExporting}
              onClick={async () => {
                setIsExporting(true);
                try {
                  const data = await api.downloadMyDataExport();
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `cub-my-data-${new Date().toISOString().slice(0, 10)}.json`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                } catch (err) {
                  const message =
                    err instanceof Error ? err.message : "Failed to export data";
                  toast({
                    title: "Export failed",
                    description: message,
                    variant: "destructive",
                  });
                } finally {
                  setIsExporting(false);
                }
              }}
            >
              {isExporting ? "Preparing..." : "Download my data (JSON)"}
            </Button>
            <Button
              variant="outline"
              disabled={isExportingBundle}
              onClick={async () => {
                setIsExportingBundle(true);
                try {
                  const blob = await api.downloadMyDataExportBundle();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `cub-my-data-${new Date().toISOString().slice(0, 10)}.zip`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                } catch (err) {
                  const message =
                    err instanceof Error ? err.message : "Failed to export data bundle";
                  toast({
                    title: "Export failed",
                    description: message,
                    variant: "destructive",
                  });
                } finally {
                  setIsExportingBundle(false);
                }
              }}
            >
              {isExportingBundle ? "Preparing..." : "Download my data (ZIP)"}
            </Button>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <h3 className="font-semibold">Email preferences</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Transactional emails (invites, important account notices) may still be sent. Marketing emails are optional.
            </p>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptInState(e.target.checked)}
                />
                Receive marketing emails
              </label>
              <Button
                variant="outline"
                disabled={isSavingMarketing}
                onClick={async () => {
                  setIsSavingMarketing(true);
                  try {
                    const res = await api.setMarketingOptIn(marketingOptIn);

                    // Persist preference update so it survives refresh (AuthProvider hydrates from sessionStorage).
                    try {
                      const raw = sessionStorage.getItem("user");
                      if (raw) {
                        const current = JSON.parse(raw);
                        const next = {
                          ...current,
                          ...(res as any)?.user,
                        };
                        sessionStorage.setItem("user", JSON.stringify(next));
                      }
                    } catch {
                      // ignore
                    }
                    toast({
                      title: "Preferences saved",
                      description: "Your email preferences have been updated.",
                    });
                  } catch (err) {
                    toast({
                      title: "Save failed",
                      description: err instanceof Error ? err.message : "Failed to save preferences",
                      variant: "destructive",
                    });
                  } finally {
                    setIsSavingMarketing(false);
                  }
                }}
              >
                {isSavingMarketing ? "Saving..." : "Save preferences"}
              </Button>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <h3 className="font-semibold">Request account deletion</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Deletion is different from deactivation. Deactivation may preserve your profile for later return.
              Deletion requests start a process to permanently remove or anonymise your personal profile information where feasible.
              Child records and shared records are not automatically deleted when one parent requests deletion, because they may remain
              lawfully needed by the other guardian and for accountability.
            </p>

            <div className="mt-4 grid gap-3">
              <Textarea
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="Optional: tell us why you are requesting deletion"
              />

              <Button
                onClick={handleRequestDeletion}
                disabled={isSubmittingDeletion}
                variant="destructive"
                className="w-full sm:w-auto"
              >
                {isSubmittingDeletion ? "Submitting..." : "Request deletion"}
              </Button>
            </div>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
