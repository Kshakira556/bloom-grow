import { useEffect, useMemo, useState } from "react";
import { ModeratorLayout } from "@/components/layout/ModeratorLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, Calendar } from "lucide-react";
import * as api from "@/lib/api";
import { buildUserNameMap } from "@/lib/adminData";
import { Link } from "react-router-dom";

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

const AdminPlans = () => {
  const [search, setSearch] = useState("");
  const [plans, setPlans] = useState<api.Plan[]>([]);
  const [users, setUsers] = useState<api.SafeUser[]>([]);
  const [assignedPlans, setAssignedPlans] = useState<api.ModeratorAssignedPlanWithClients[]>([]);
  const [pendingProposals, setPendingProposals] = useState<api.Proposal[]>([]);
  const [flaggedMessages, setFlaggedMessages] = useState<api.ApiMessage[]>([]);
  const [stageFilter, setStageFilter] = useState<api.MediatorCaseStage | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [plansRes, allUsers, mediatorPlansRes, proposalsRes, flaggedRes] = await Promise.all([
          api.getPlans(),
          api.getUsers(),
          api.getMyModeratorAssignedPlansWithClients().catch(() => [] as api.ModeratorAssignedPlanWithClients[]),
          api.getProposals("pending").catch(() => [] as api.Proposal[]),
          api.getMyModeratorFlaggedMessages({ includeDeleted: true }).catch(() => [] as api.ApiMessage[]),
        ]);
        setPlans(plansRes?.plans ?? []);
        setUsers(allUsers);
        setAssignedPlans(mediatorPlansRes);
        setPendingProposals(proposalsRes);
        setFlaggedMessages(flaggedRes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load plans");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const userMap = useMemo(() => buildUserNameMap(users), [users]);
  const assignedPlanMap = useMemo(() => {
    return assignedPlans.reduce<Record<string, api.ModeratorAssignedPlanWithClients>>((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
  }, [assignedPlans]);

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

  const stageByPlanId = useMemo(() => {
    return assignedPlans.reduce<Record<string, api.MediatorCaseStage>>((acc, p) => {
      acc[p.id] = (p.stage ?? "active_mediation") as api.MediatorCaseStage;
      return acc;
    }, {});
  }, [assignedPlans]);

  const filteredPlans = useMemo(() => {
    return plans
      .filter((plan) =>
        search
          ? plan.title.toLowerCase().includes(search.toLowerCase()) ||
            plan.id.toLowerCase().includes(search.toLowerCase()) ||
            (userMap[plan.created_by ?? ""] || "").toLowerCase().includes(search.toLowerCase())
          : true
      )
      .filter((plan) => {
        if (stageFilter === "all") return true;
        return (stageByPlanId[plan.id] ?? "active_mediation") === stageFilter;
      });
  }, [plans, search, userMap, stageFilter, stageByPlanId]);

  return (
    <ModeratorLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          Cases
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Case List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <Input
                placeholder="Search by case, ID, or creator..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value as any)}
                className="px-3 py-2 rounded-md border bg-background text-sm"
              >
                <option value="all">All stages</option>
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
              <div className="text-xs text-muted-foreground self-center md:text-right">
                Showing {filteredPlans.length} case{filteredPlans.length === 1 ? "" : "s"}
              </div>
            </div>

            {error && <p className="text-sm text-destructive mb-3">{error}</p>}

            <div className="space-y-2">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading plans...</p>
              ) : filteredPlans.length > 0 ? (
                filteredPlans.map((plan) => (
                  <div key={plan.id} className="p-3 border rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-medium">{plan.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Created by: {userMap[plan.created_by ?? ""] || plan.created_by || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">Stage: {stageLabel(stageByPlanId[plan.id])}</p>
                      <p className="text-xs text-muted-foreground">
                        Clients: {assignedPlanMap[plan.id]?.clients?.length ?? 0}
                        {" • "}
                        Pending: {pendingByPlanId[plan.id] ?? 0}
                        {" • "}
                        Flagged: {flaggedByPlanId[plan.id] ?? 0}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline" className="gap-1">
                      <Link to={`/admin/cases/${plan.id}`}>
                        <Eye className="w-4 h-4" /> View
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No cases found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ModeratorLayout>
  );
};

export default AdminPlans;


