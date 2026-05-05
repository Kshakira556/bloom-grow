import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import * as api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";

type RequestType = "access" | "correction" | "deletion" | "objection";

export default function PrivacyRequests() {
  const { isAuthenticated, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [requestType, setRequestType] = useState<RequestType>("access");
  const [details, setDetails] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const t = searchParams.get("type")?.trim();
    if (t === "access" || t === "correction" || t === "deletion" || t === "objection") {
      setRequestType(t);
    }
  }, [searchParams]);

  useEffect(() => {
    // Safety: tie requests to the authenticated user's email to avoid any confusion/spoofing risk.
    // (Backend also links by JWT user_id; this is just a UI guard.)
    if (isAuthenticated && user?.email) {
      setContactEmail(user.email);
    }
  }, [isAuthenticated, user?.email]);

  const submit = async () => {
    setError("");
    try {
      if (!isAuthenticated) {
        setError("Please sign in first so we can link your request to your account.");
        return;
      }
      setStatus("submitting");
      await api.createPrivacyRequest({
        request_type: requestType,
        details: details.trim() || undefined,
        contact_email: contactEmail.trim() || undefined,
      });
      setStatus("done");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Failed to submit request");
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />
      <main className="flex-1 py-8 px-4">
        <div className="container max-w-2xl mx-auto">
          <h1 className="font-display text-2xl font-bold text-primary text-center mb-6">
            Privacy Requests
          </h1>

          <Card className="rounded-3xl">
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Use this form to request access, correction, deletion, or to object to processing under POPIA.
              </p>
              {!isAuthenticated && (
                <p className="text-sm text-muted-foreground">
                  You are not signed in. If you can, sign in first so we can link your request to your account.
                </p>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Request type</label>
                <select
                  className="w-full p-3 rounded-2xl bg-card/50 border text-sm font-display"
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as RequestType)}
                >
                  <option value="access">Access my information</option>
                  <option value="correction">Correct my information</option>
                  <option value="deletion">Delete my account/information</option>
                  <option value="objection">Object to processing</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Account email</label>
                <Input
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  disabled
                  placeholder=""
                />
                <p className="text-xs text-muted-foreground">
                  This request is linked to your signed-in account. If you need us to contact you on a different address,
                  include it in the details field.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Details (optional)</label>
                <Textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Add any detail that will help us process your request (e.g., which child, which record, date range)."
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              {status === "done" ? (
                <p className="text-sm text-muted-foreground">
                  Request submitted. We will respond using the contact details on your account (or the contact email you provided).
                </p>
              ) : (
                <Button className="w-full rounded-full" onClick={submit} disabled={status === "submitting"}>
                  {status === "submitting" ? "Submitting..." : "Submit request"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
