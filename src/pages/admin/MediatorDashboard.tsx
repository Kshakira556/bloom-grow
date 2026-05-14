import { useEffect, useMemo, useState } from "react";
import { ModeratorLayout } from "@/components/layout/ModeratorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, FileText, ShieldCheck } from "lucide-react";
import * as api from "@/lib/api";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const MediatorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [assignedPlans, setAssignedPlans] = useState<api.ModeratorAssignedPlanWithClients[]>([]);
  const [pendingProposals, setPendingProposals] = useState<api.Proposal[]>([]);
  const [flaggedMessages, setFlaggedMessages] = useState<api.ApiMessage[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<api.MediatorSession[]>([]);
  const [overdueActionItems, setOverdueActionItems] = useState<api.MediatorSessionActionItemWithContext[]>([]);

  const [profilePromptOpen, setProfilePromptOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [wantsListed, setWantsListed] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const now = new Date();
        const in14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

        const [plansRes, proposalsRes, flaggedRes, sessionsRes, overdueItemsRes] = await Promise.all([
          api.getMyModeratorAssignedPlansWithClients(),
          api.getProposals("pending"),
          api.getMyModeratorFlaggedMessages({ includeDeleted: true }).catch(() => [] as api.ApiMessage[]),
          api.getMyMediatorSessions({ from: now.toISOString(), to: in14.toISOString(), limit: 200 }).catch(() => [] as api.MediatorSession[]),
          api.getMyModeratorActionItems({ due_to: now.toISOString(), limit: 200 }).catch(() => [] as api.MediatorSessionActionItemWithContext[]),
        ]);

        setAssignedPlans(plansRes);
        setPendingProposals(proposalsRes);
        setFlaggedMessages(flaggedRes);
        setUpcomingSessions(sessionsRes);
        setOverdueActionItems(overdueItemsRes.filter((i) => !i.is_done));

        // Prompt mediators once to opt into (or out of) the public directory.
        try {
          const profile = await api.getMyMediatorProfile().catch(() => null);
          if (!profile) {
            setProfilePromptOpen(true);
          }
        } catch {
          // ignore
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const pendingByPlanId = useMemo(() => {
    return pendingProposals.reduce<Record<string, number>>((acc, p) => {
      acc[p.plan_id] = (acc[p.plan_id] ?? 0) + 1;
      return acc;
    }, {});
  }, [pendingProposals]);

  const flaggedByPlanId = useMemo(() => {
    return flaggedMessages.reduce<Record<string, number>>((acc, m) => {
      acc[m.plan_id] = (acc[m.plan_id] ?? 0) + 1;
      return acc;
    }, {});
  }, [flaggedMessages]);

  const topCases = useMemo(() => {
    // Prioritize cases with pending approvals, then flagged messages, then recent id sort.
    return assignedPlans
      .slice()
      .sort((a, b) => {
        const pendingDiff = (pendingByPlanId[b.id] ?? 0) - (pendingByPlanId[a.id] ?? 0);
        if (pendingDiff !== 0) return pendingDiff;
        const flaggedDiff = (flaggedByPlanId[b.id] ?? 0) - (flaggedByPlanId[a.id] ?? 0);
        if (flaggedDiff !== 0) return flaggedDiff;
        return String(b.id).localeCompare(String(a.id));
      })
      .slice(0, 8);
  }, [assignedPlans, flaggedByPlanId, pendingByPlanId]);

  const stageCounts = useMemo(() => {
    return assignedPlans.reduce<Record<string, number>>((acc, p) => {
      const s = p.stage ?? "active_mediation";
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    }, {});
  }, [assignedPlans]);

  const planTitleById = useMemo(() => {
    return assignedPlans.reduce<Record<string, string>>((acc, p) => {
      acc[p.id] = p.title ?? "Case";
      return acc;
    }, {});
  }, [assignedPlans]);

  return (
    <ModeratorLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Your active cases and required actions.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild variant="outline">
              <Link to="/admin/proposals">
                <FileText className="w-4 h-4 mr-2" />
                Pending
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/moderator">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Triage
              </Link>
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active Cases</p>
              <p className="font-display font-bold text-2xl mt-1">{loading ? "…" : assignedPlans.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Assigned to you</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pending Approvals</p>
              <p className="font-display font-bold text-2xl mt-1">{loading ? "…" : pendingProposals.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Awaiting decision</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Flagged Messages</p>
              <p className="font-display font-bold text-2xl mt-1">{loading ? "…" : flaggedMessages.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Needs triage</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Clients</p>
              <p className="font-display font-bold text-2xl mt-1">
                {loading ? "…" : assignedPlans.reduce((acc, p) => acc + (p.clients?.length ?? 0), 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Across assigned cases</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stages</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              ([
                ["intake", "Intake"],
                ["screening", "Screening"],
                ["onboarding", "Onboarding"],
                ["info_gathering", "Info Gathering"],
                ["active_mediation", "Active Mediation"],
                ["drafting", "Drafting"],
                ["finalisation", "Finalisation"],
                ["follow_up", "Follow-up"],
                ["closed", "Closed"],
              ] as const).map(([key, label]) => (
                <div key={key} className="p-3 border rounded-xl flex items-center justify-between">
                  <span className="text-sm">{label}</span>
                  <span className="text-sm font-medium">{stageCounts[key] ?? 0}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Priority Cases</CardTitle>
            <Button asChild variant="ghost">
              <Link to="/admin/plans">
                <Calendar className="w-4 h-4 mr-2" />
                View all
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading cases…</p>
            ) : topCases.length ? (
              topCases.map((plan) => (
                <div key={plan.id} className="p-3 border rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{plan.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Clients: {plan.clients?.length ?? 0}
                      {" • "}
                      Pending: {pendingByPlanId[plan.id] ?? 0}
                      {" • "}
                      Flagged: {flaggedByPlanId[plan.id] ?? 0}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {(flaggedByPlanId[plan.id] ?? 0) > 0 && (
                      <div className="text-xs text-destructive flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Flagged
                      </div>
                    )}
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/admin/cases/${plan.id}`}>Open</Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No assigned cases found.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Schedule</CardTitle>
            <Button asChild variant="ghost">
              <Link to="/admin/schedule">
                <Calendar className="w-4 h-4 mr-2" />
                Open schedule
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 border rounded-xl">
                <p className="text-sm font-medium">Upcoming sessions (14 days)</p>
                <p className="text-xs text-muted-foreground mt-1">{loading ? "…" : `${upcomingSessions.length} scheduled`}</p>
                {!loading && upcomingSessions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {upcomingSessions.slice(0, 5).map((s) => (
                      <div key={s.id} className="text-xs text-muted-foreground flex items-center justify-between gap-2">
                        <span className="truncate">{planTitleById[s.plan_id] ?? "Case"}</span>
                        <span className="shrink-0">{new Date(s.starts_at).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3 border rounded-xl">
                <p className="text-sm font-medium">Overdue action items</p>
                <p className="text-xs text-muted-foreground mt-1">{loading ? "…" : `${overdueActionItems.length} overdue`}</p>
                {!loading && overdueActionItems.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {overdueActionItems.slice(0, 5).map((i) => (
                      <div key={i.id} className="text-xs text-muted-foreground flex items-center justify-between gap-2">
                        <span className="truncate">{planTitleById[i.plan_id] ?? "Case"}</span>
                        <span className="shrink-0">{i.due_at ? new Date(i.due_at).toLocaleDateString() : "No due date"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={profilePromptOpen} onOpenChange={setProfilePromptOpen}>
        <DialogContent className="max-w-lg w-[95vw]">
          <DialogHeader>
            <DialogTitle>Find a mediator directory</DialogTitle>
            <DialogDescription>
              Would you like to be listed publicly so parents can find and select you? You can change this later.
            </DialogDescription>
          </DialogHeader>

          {profileError && <p className="text-sm text-destructive">{profileError}</p>}

          <label className="flex items-start gap-2 p-3 border rounded-xl">
            <input
              type="checkbox"
              className="mt-1"
              checked={wantsListed}
              onChange={(e) => setWantsListed(e.target.checked)}
              disabled={profileSaving}
            />
            <span className="text-sm">List me in the directory</span>
          </label>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={profileSaving}
              onClick={async () => {
                try {
                  setProfileSaving(true);
                  setProfileError(null);
                  await api.upsertMyMediatorProfile({ is_listed: false });
                  setProfilePromptOpen(false);
                } catch (e) {
                  setProfileError(e instanceof Error ? e.message : "Failed to save");
                } finally {
                  setProfileSaving(false);
                }
              }}
            >
              No thanks
            </Button>
            <Button
              disabled={profileSaving}
              onClick={async () => {
                try {
                  setProfileSaving(true);
                  setProfileError(null);
                  await api.upsertMyMediatorProfile({ is_listed: wantsListed });
                  setProfilePromptOpen(false);
                } catch (e) {
                  setProfileError(e instanceof Error ? e.message : "Failed to save");
                } finally {
                  setProfileSaving(false);
                }
              }}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ModeratorLayout>
  );
};

export default MediatorDashboard;
