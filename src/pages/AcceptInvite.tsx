import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { acceptPlanInvite } from "@/lib/api";

type InviteStatus = "idle" | "accepting" | "error";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const inviteId = useMemo(() => searchParams.get("invite_id")?.trim() ?? "", [searchParams]);
  const invitedEmail = useMemo(() => searchParams.get("email")?.trim() ?? "", [searchParams]);
  const invitedAccountType = useMemo(
    () => (searchParams.get("account_type")?.trim() as "trial" | "paid" | "") || "",
    [searchParams]
  );
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<InviteStatus>("idle");
  const [error, setError] = useState("");
  const inviteQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (inviteId) params.set("invite_id", inviteId);
    if (invitedEmail) params.set("email", invitedEmail);
    if (invitedAccountType) params.set("account_type", invitedAccountType);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [inviteId, invitedEmail, invitedAccountType]);

  useEffect(() => {
    if (!inviteId) {
      setStatus("error");
      setError("Invalid invite link.");
      return;
    }

    if (!isAuthenticated) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setStatus("accepting");
        await acceptPlanInvite(inviteId);
        if (!cancelled) {
          navigate("/visits", { replace: true });
        }
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to accept invite");
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [inviteId, isAuthenticated, navigate]);

  if (status === "error") {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl p-6 w-full max-w-md text-center">
          <h1 className="text-xl font-semibold mb-2">Invite issue</h1>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            type="button"
            className="px-4 py-2 rounded-full bg-primary text-primary-foreground"
            onClick={() => navigate("/visits")}
          >
            Go to Visits
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl p-6 w-full max-w-md text-center">
          <h1 className="text-xl font-semibold mb-2">You were invited</h1>
          <p className="text-sm text-muted-foreground mb-5">
            If you already have an account, sign in. If you're new, register first to create a password.
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-full bg-primary text-primary-foreground"
              onClick={() => navigate(`/signin${inviteQuery}`, { replace: true })}
            >
              I already have an account
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-full border border-border"
              onClick={() => navigate(`/register${inviteQuery}`, { replace: true })}
            >
              I need to register
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl p-6 w-full max-w-md text-center">
        <h1 className="text-xl font-semibold mb-2">Processing invite</h1>
        <p className="text-sm text-muted-foreground">Please wait while we link this invite to your account.</p>
      </div>
    </div>
  );
}
