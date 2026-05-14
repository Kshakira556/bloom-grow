import { useEffect, useMemo, useState } from "react";
import { ModeratorLayout } from "@/components/layout/ModeratorLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ThumbsUp, ThumbsDown } from "lucide-react";
import * as api from "@/lib/api";
import { Link } from "react-router-dom";

const AdminProposals = () => {
  const [proposals, setProposals] = useState<api.Proposal[]>([]);
  const [assignedPlans, setAssignedPlans] = useState<api.ModeratorAssignedPlanWithClients[]>([]);
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [proposalsRes, plansRes] = await Promise.all([
          api.getProposals("pending"),
          api.getMyModeratorAssignedPlansWithClients().catch(() => [] as api.ModeratorAssignedPlanWithClients[]),
        ]);
        setProposals(proposalsRes);
        setAssignedPlans(plansRes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load proposals");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const userMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of assignedPlans) {
      for (const c of p.clients) map[c.id] = c.full_name;
    }
    return map;
  }, [assignedPlans]);
  const planMap = useMemo(() => {
    return assignedPlans.reduce<Record<string, string>>((acc, p) => {
      acc[p.id] = p.title;
      return acc;
    }, {});
  }, [assignedPlans]);

  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => (planFilter === "all" ? true : p.plan_id === planFilter));
  }, [planFilter, proposals]);

  const handleUpdate = async (id: string, status: "approved" | "rejected" | "changes_requested") => {
    try {
      const notes = notesById[id]?.trim() || undefined;
      const updated = await api.updateProposalStatus(id, { status, notes });
      if (!updated) return;
      setProposals((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update proposal");
    }
  };

  return (
    <ModeratorLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          Pending Approvals
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Pending Case Changes</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <p className="text-sm text-destructive mb-3">{error}</p>}

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading proposals...</p>
            ) : filteredProposals.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="px-3 py-2 rounded-md border bg-background text-sm"
                  >
                    <option value="all">All cases</option>
                    {assignedPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-muted-foreground self-center md:text-right">
                    Showing {filteredProposals.length} pending approval{filteredProposals.length === 1 ? "" : "s"}
                  </div>
                </div>

                {filteredProposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="p-3 border rounded-xl flex justify-between items-center bg-warning/10"
                  >
                    <div>
                      <p className="font-medium">{proposal.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Case:{" "}
                        <Link className="underline" to={`/admin/cases/${proposal.plan_id}`}>
                          {planMap[proposal.plan_id] || proposal.plan_id}
                        </Link>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Proposed by: {userMap[proposal.created_by] || proposal.created_by}
                      </p>
                      <p className="text-xs text-muted-foreground">{proposal.description}</p>
                      <input
                        value={notesById[proposal.id] ?? ""}
                        onChange={(e) => setNotesById((prev) => ({ ...prev, [proposal.id]: e.target.value }))}
                        placeholder="Reason / notes (optional)"
                        className="mt-2 w-full px-3 py-2 rounded-md border bg-background text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-success"
                        onClick={() => handleUpdate(proposal.id, "approved")}
                      >
                        <ThumbsUp className="w-4 h-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-orange-600"
                        onClick={() => handleUpdate(proposal.id, "changes_requested")}
                      >
                        <FileText className="w-4 h-4" /> Request edits
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-destructive"
                        onClick={() => handleUpdate(proposal.id, "rejected")}
                      >
                        <ThumbsDown className="w-4 h-4" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No pending approvals.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ModeratorLayout>
  );
};

export default AdminProposals;
