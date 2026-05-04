import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";

export default function Settings() {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [deletionReason, setDeletionReason] = useState("");
  const [isSubmittingDeletion, setIsSubmittingDeletion] = useState(false);

  const deletionReasonTrimmed = useMemo(() => deletionReason.trim(), [deletionReason]);

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
