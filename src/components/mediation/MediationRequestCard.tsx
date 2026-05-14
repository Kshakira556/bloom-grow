import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import { Button } from "@/components/ui/button";

export function MediationRequestCard(props: {
  planId: string | null;
  disabled?: boolean;
}) {
  const planId = props.planId;
  const disabled = Boolean(props.disabled);

  const [mediationRequest, setMediationRequest] = useState<api.MediationRequest | null>(null);
  const [mediationNotes, setMediationNotes] = useState("");
  const [mediationLoading, setMediationLoading] = useState(false);
  const [mediationError, setMediationError] = useState<string | null>(null);

  const [mediatorDirectory, setMediatorDirectory] = useState<api.ListedMediator[]>([]);
  const [mediatorDirectoryLoading, setMediatorDirectoryLoading] = useState(false);
  const [selectedMediatorId, setSelectedMediatorId] = useState<string>("");
  const [inviteMediatorEmail, setInviteMediatorEmail] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!planId) {
        setMediationRequest(null);
        return;
      }
      try {
        setMediationError(null);
        const req = await api.getMyMediationRequestForPlan(planId);
        setMediationRequest(req);
      } catch (e) {
        setMediationError(e instanceof Error ? e.message : "Failed to load mediation request");
        setMediationRequest(null);
      }
    };
    void load();
  }, [planId]);

  useEffect(() => {
    const loadDirectory = async () => {
      try {
        setMediatorDirectoryLoading(true);
        const items = await api.getMediatorDirectory({ limit: 100 });
        setMediatorDirectory(items);
      } catch {
        setMediatorDirectory([]);
      } finally {
        setMediatorDirectoryLoading(false);
      }
    };
    void loadDirectory();
  }, []);

  if (!planId) return null;

  return (
    <div className="p-4 border rounded-2xl bg-card w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">Mediator</p>
          <p className="text-xs text-muted-foreground">
            {mediationRequest?.status === "pending"
              ? "Request sent (pending)."
              : mediationRequest?.status === "accepted"
                ? "A mediator has accepted this request."
                : mediationRequest?.status === "rejected"
                  ? "Request was rejected."
                  : mediationRequest?.status === "cancelled"
                    ? "Request was cancelled."
                    : "Choose a mediator from the directory or invite by email."}
          </p>
          {mediationError && <p className="text-xs text-destructive mt-1">{mediationError}</p>}
        </div>

        {mediationRequest?.status === "pending" ? (
          <Button
            size="sm"
            variant="outline"
            disabled={disabled || mediationLoading}
            onClick={async () => {
              if (!mediationRequest) return;
              try {
                setMediationLoading(true);
                setMediationError(null);
                await api.cancelMyMediationRequest(mediationRequest.id);
                setMediationRequest(null);
                setMediationNotes("");
              } catch (e) {
                setMediationError(e instanceof Error ? e.message : "Failed to cancel request");
              } finally {
                setMediationLoading(false);
              }
            }}
          >
            Cancel request
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={disabled || mediationLoading}
            onClick={async () => {
              try {
                setMediationLoading(true);
                setMediationError(null);
                const targetMediatorId = selectedMediatorId.trim() || null;
                const targetEmail = inviteMediatorEmail.trim() || null;
                if (!targetMediatorId && !targetEmail) {
                  setMediationError("Select a mediator or enter an email address.");
                  return;
                }

                const req = await api.createMyMediationRequestForPlan(planId, {
                  notes: mediationNotes.trim() || null,
                  target_mediator_id: targetMediatorId,
                  target_email: targetEmail,
                } as any);
                if (req) setMediationRequest(req);
                setMediationNotes("");
                setSelectedMediatorId("");
                setInviteMediatorEmail("");
              } catch (e) {
                setMediationError(e instanceof Error ? e.message : "Failed to request mediator");
              } finally {
                setMediationLoading(false);
              }
            }}
          >
            Request mediator
          </Button>
        )}
      </div>

      {!mediationRequest && (
        <div className="mt-3">
          <label className="block text-xs font-medium mb-1 text-muted-foreground">Choose from directory</label>
          <select
            value={selectedMediatorId}
            onChange={(e) => {
              setSelectedMediatorId(e.target.value);
              if (e.target.value) setInviteMediatorEmail("");
            }}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
            disabled={disabled || mediationLoading || mediatorDirectoryLoading}
          >
            <option value="">{mediatorDirectoryLoading ? "Loading…" : "Select a mediator"}</option>
            {mediatorDirectory.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.display_name}
                {m.city ? ` • ${m.city}` : ""}
                {m.province ? `, ${m.province}` : ""}
              </option>
            ))}
          </select>

          <label className="block text-xs font-medium mt-3 mb-1 text-muted-foreground">Or invite by email</label>
          <input
            value={inviteMediatorEmail}
            onChange={(e) => {
              setInviteMediatorEmail(e.target.value);
              if (e.target.value) setSelectedMediatorId("");
            }}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
            placeholder="mediator@example.com"
            disabled={disabled || mediationLoading}
          />
          <p className="text-xs text-muted-foreground mt-1">
            If they don’t have an account yet, they can register and then accept the request from their Mediator dashboard.
          </p>

          <label className="block text-xs font-medium mb-1 text-muted-foreground">Optional note</label>
          <textarea
            value={mediationNotes}
            onChange={(e) => setMediationNotes(e.target.value)}
            className="w-full min-h-20 px-3 py-2 rounded-lg border bg-background text-sm"
            placeholder="Briefly explain what you need help with…"
            disabled={disabled || mediationLoading}
          />
        </div>
      )}
    </div>
  );
}

