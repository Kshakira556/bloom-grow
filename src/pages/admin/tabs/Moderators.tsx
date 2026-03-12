import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Eye } from "lucide-react";
import * as api from "@/lib/api";
import { buildUserNameMap } from "@/lib/adminData";

const Moderators = () => {
  const [moderators, setModerators] = useState<api.SafeUser[]>([]);
  const [assignments, setAssignments] = useState<api.ModeratorAssignment[]>([]);
  const [plans, setPlans] = useState<api.Plan[]>([]);
  const [users, setUsers] = useState<api.SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [usersRes, assignmentsRes, plansRes] = await Promise.all([
          api.getUsers(),
          api.getModeratorAssignments(),
          api.getPlans(),
        ]);

        setUsers(usersRes);
        setModerators(usersRes.filter((u) => u.role === "mediator" || u.role === "admin"));
        setAssignments(assignmentsRes);
        setPlans(plansRes?.plans ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load moderators");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const userMap = useMemo(() => buildUserNameMap(users), [users]);
  const planMap = useMemo(() => {
    return plans.reduce<Record<string, string>>((acc, plan) => {
      acc[plan.id] = plan.title;
      return acc;
    }, {});
  }, [plans]);

  const filtered = useMemo(() => {
    return moderators.filter((mod) =>
      search
        ? mod.full_name.toLowerCase().includes(search.toLowerCase()) ||
          mod.email.toLowerCase().includes(search.toLowerCase())
        : true
    );
  }, [moderators, search]);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold">Moderators</h2>

      <Card>
        <CardHeader>
          <CardTitle>Moderators</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading moderators...</p>
          ) : filtered.length > 0 ? (
            filtered.map((mod) => {
              const assignedPlans = assignments.filter((a) => a.moderator_id === mod.id);
              return (
                <div key={mod.id} className="p-3 border rounded-xl flex justify-between items-center">
                  <div>
                    <p className="font-medium">{mod.full_name}</p>
                    <p className="text-xs text-muted-foreground">{mod.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Assigned plans: {assignedPlans.length}
                    </p>
                    {assignedPlans.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {assignedPlans.slice(0, 3).map((assignment) => (
                          <div key={assignment.id}>
                            {planMap[assignment.plan_id] || assignment.plan_id}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Eye className="w-4 h-4" /> View
                  </Button>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">No moderators found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Moderators;
