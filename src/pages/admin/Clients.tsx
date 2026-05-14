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
  const [assignedPlans, setAssignedPlans] = useState<api.ModeratorAssignedPlanWithClients[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // Mediators should never fetch the entire user DB. For now this page is just a
        // helpful view of assigned cases + their participants.
        const mediatorPlans = await api.getMyModeratorAssignedPlansWithClients();
        setAssignedPlans(mediatorPlans);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load clients");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isMediator]);

  const filteredAssignedPlans = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return assignedPlans;
    return assignedPlans.filter((p) => {
      return (
        p.title.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.clients.some((c) => c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
      );
    });
  }, [assignedPlans, search]);

  return (
    <ModeratorLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          Clients
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Assigned Cases & Clients</CardTitle>
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
              ) : filteredAssignedPlans.length > 0 ? (
                filteredAssignedPlans.map((plan) => (
                  <div key={plan.id} className="p-3 border rounded-xl space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{plan.title}</p>
                        <p className="text-xs text-muted-foreground">Case ID: {plan.id}</p>
                      </div>
                      <Button asChild size="sm" variant="outline" className="gap-1">
                        <a href={`/admin/cases/${plan.id}`}>
                          <Eye className="w-4 h-4" /> View
                        </a>
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
                        <p className="text-sm text-muted-foreground">No clients found for this case.</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No assigned cases found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ModeratorLayout>
  );
};

export default AdminClients;

