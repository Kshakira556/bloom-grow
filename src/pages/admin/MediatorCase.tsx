import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ModeratorLayout } from "@/components/layout/ModeratorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as api from "@/lib/api";

const stageLabel = (stage?: api.MediatorCaseStage) => {
  switch (stage) {
    case "intake":
      return "Intake";
    case "screening":
      return "Screening";
    case "onboarding":
      return "Onboarding";
    case "info_gathering":
      return "Info Gathering";
    case "active_mediation":
      return "Active Mediation";
    case "drafting":
      return "Drafting";
    case "finalisation":
      return "Finalisation";
    case "follow_up":
      return "Follow-up";
    case "closed":
      return "Closed";
    default:
      return "Active Mediation";
  }
};

const MediatorCase = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [casePlan, setCasePlan] = useState<api.ModeratorAssignedPlanWithClients | null>(null);
  const [pendingProposals, setPendingProposals] = useState<api.Proposal[]>([]);
  const [messages, setMessages] = useState<api.ApiMessage[]>([]);
  const [stage, setStage] = useState<api.MediatorCaseStage>("active_mediation");

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);

        const [assignedPlans, proposals] = await Promise.all([
          api.getMyModeratorAssignedPlansWithClients(),
          api.getProposals("pending").catch(() => [] as api.Proposal[]),
        ]);

        const plan = assignedPlans.find((p) => p.id === id) ?? null;
        setCasePlan(plan);
        setStage((plan?.stage ?? "active_mediation") as api.MediatorCaseStage);
        setPendingProposals(proposals.filter((p) => p.plan_id === id));

        // Messages are plan-scoped and should be permitted for assigned mediators.
        const res = await api.getMessagesByPlan(id, { includeDeleted: true, limit: 50 });
        setMessages(res.messages ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load case");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const headerTitle = casePlan?.title || "Case";

  const sortedMessages = useMemo(() => {
    return messages
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [messages]);

  return (
    <ModeratorLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">{headerTitle}</h1>
            {id && <p className="text-xs text-muted-foreground">Case ID: {id}</p>}
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/admin/plans">Back to cases</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/proposals">Pending</Link>
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Parties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : casePlan?.clients?.length ? (
                casePlan.clients.map((c) => (
                  <div key={c.id} className="p-2 border rounded-lg">
                    <p className="font-medium">{c.full_name}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No clients available for this case.</p>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Stage</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">Current: <span className="text-foreground font-medium">{stageLabel(stage)}</span></div>
                <div className="flex gap-2">
                  <select
                    value={stage}
                    onChange={async (e) => {
                      const next = e.target.value as api.MediatorCaseStage;
                      setStage(next);
                      if (!id) return;
                      try {
                        await api.setMyMediatorCaseStage(id, next);
                      } catch {
                        // revert on failure
                        setStage((casePlan?.stage ?? "active_mediation") as api.MediatorCaseStage);
                      }
                    }}
                    className="px-3 py-2 rounded-md border bg-background text-sm"
                    disabled={loading || !id}
                  >
                    <option value="intake">Intake</option>
                    <option value="screening">Screening</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="info_gathering">Info Gathering</option>
                    <option value="active_mediation">Active Mediation</option>
                    <option value="drafting">Drafting</option>
                    <option value="finalisation">Finalisation</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : pendingProposals.length ? (
                  pendingProposals.map((p) => (
                    <div key={p.id} className="p-3 border rounded-xl">
                      <p className="font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No pending approvals for this case.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Messages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : sortedMessages.length ? (
                  sortedMessages.slice(0, 20).map((m) => (
                    <div key={m.id} className="p-3 border rounded-xl">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{new Date(m.created_at).toLocaleString()}</span>
                        {m.purpose ? <span>{m.purpose}</span> : <span>Message</span>}
                      </div>
                      <p className="text-sm mt-1">{m.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No messages found for this case.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ModeratorLayout>
  );
};

export default MediatorCase;
