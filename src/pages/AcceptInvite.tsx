import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { acceptPlanInvite, resolvePlanInviteToken } from "@/lib/api";

type InviteStatus = "idle" | "accepting" | "error";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const inviteId = useMemo(() => searchParams.get("invite_id")?.trim() ?? "", [searchParams]);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<InviteStatus>("idle");
  const [error, setError] = useState("");
  const [resolvedInviteId, setResolvedInviteId] = useState("");
  const [resolvedEmail, setResolvedEmail] = useState("");
  const [resolvedAccountType, setResolvedAccountType] = useState<"trial" | "paid" | "">("");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const run = async () => {
      try {
        setResolving(true);
        const invite = await resolvePlanInviteToken(token);
        if (cancelled) return;
        setResolvedInviteId(invite.invite_id);
        setResolvedEmail(invite.email);
        setResolvedAccountType(invite.account_type);
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Invalid invite link.");
      } finally {
        if (!cancelled) setResolving(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const inviteQuery = useMemo(() => {
    const params = new URLSearchParams();
    // New: prefer token-only flow; but when present we also pass resolved fields (locked) to auth screens.
    if (token) params.set("token", token);

    const id = resolvedInviteId || inviteId;
    if (id) params.set("invite_id", id);
    if (resolvedEmail) params.set("email", resolvedEmail);
    if (resolvedAccountType) params.set("account_type", resolvedAccountType);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [token, inviteId, resolvedInviteId, resolvedEmail, resolvedAccountType]);

  useEffect(() => {
    if (!inviteId && !token) {
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
        if (token) {
          await acceptPlanInvite({ invite_token: token });
        } else {
          await acceptPlanInvite(inviteId);
        }
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
          {token && resolving && (
            <p className="text-xs text-muted-foreground mb-4">Validating invite…</p>
          )}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-full bg-primary text-primary-foreground"
              onClick={() => navigate(`/signin${inviteQuery}`, { replace: true })}
              disabled={token ? resolving || status === "error" : false}
            >
              I already have an account
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-full border border-border"
              onClick={() => navigate(`/register${inviteQuery}`, { replace: true })}
              disabled={token ? resolving || status === "error" : false}
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
