import { useEffect, useMemo, useState } from "react";
import { ModeratorLayout } from "@/components/layout/ModeratorLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, User } from "lucide-react";
import * as api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const AdminClients = () => {
  const { user } = useAuth();
  const isMediator = user?.role === "mediator";

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<api.SafeUser[]>([]);
  const [plans, setPlans] = useState<api.Plan[]>([]);
  const [assignedPlans, setAssignedPlans] = useState<api.ModeratorAssignedPlanWithClients[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        if (isMediator) {
          const [allUsers, mediatorPlans] = await Promise.all([
            api.getUsers(),
            api.getMyModeratorAssignedPlansWithClients(),
          ]);
          setUsers(allUsers);
          setAssignedPlans(mediatorPlans);
          setPlans([]);
        } else {
          const [allUsers, plansRes] = await Promise.all([
            api.getUsers(),
            api.getPlans(),
          ]);
          setUsers(allUsers);
          setPlans(plansRes?.plans ?? []);
          setAssignedPlans([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load clients");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isMediator]);

  const clients = useMemo(() => {
    return users
      .filter((u) => u.role === "parent")
      .filter((u) =>
        search
          ? u.full_name.toLowerCase().includes(search.toLowerCase()) ||
            u.id.toLowerCase().includes(search.toLowerCase())
          : true
      );
  }, [users, search]);

  return (
    <ModeratorLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          Clients
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>{isMediator ? "Assigned Plans & Clients" : "Client List"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by name or user ID..."
              className="mb-4"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {error && <p className="text-sm text-destructive mb-3">{error}</p>}

            <div className="space-y-2">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading clients...</p>
              ) : isMediator ? (
                assignedPlans.length > 0 ? (
                  assignedPlans
                    .filter((p) => {
                      if (!search) return true;
                      const q = search.toLowerCase();
                      return (
                        p.title.toLowerCase().includes(q) ||
                        p.clients.some((c) => c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
                      );
                    })
                    .map((plan) => (
                      <div key={plan.id} className="p-3 border rounded-xl space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{plan.title}</p>
                            <p className="text-xs text-muted-foreground">Plan ID: {plan.id}</p>
                          </div>
                          <Button size="sm" variant="outline" className="gap-1">
                            <Eye className="w-4 h-4" /> View
                          </Button>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Clients</p>
                          {plan.clients.length ? (
                            plan.clients.map((c) => (
                              <div key={c.id} className="text-sm flex items-center justify-between gap-3">
                                <span>{c.full_name}</span>
                                <span className="text-xs text-muted-foreground">{c.email}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No clients found for this plan.</p>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground">No assigned plans found.</p>
                )
              ) : clients.length > 0 ? (
                clients.map((client) => (
                  <div key={client.id} className="p-3 border rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-medium">{client.full_name}</p>
                      <p className="text-xs text-muted-foreground">{client.email}</p>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Eye className="w-4 h-4" /> View
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No clients found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ModeratorLayout>
  );
};

export default AdminClients;

