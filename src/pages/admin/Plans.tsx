import { useEffect, useMemo, useState } from "react";
import { ModeratorLayout } from "@/components/layout/ModeratorLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, Calendar } from "lucide-react";
import * as api from "@/lib/api";
import { buildUserNameMap } from "@/lib/adminData";

const AdminPlans = () => {
  const [search, setSearch] = useState("");
  const [plans, setPlans] = useState<api.Plan[]>([]);
  const [users, setUsers] = useState<api.SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [plansRes, allUsers] = await Promise.all([
          api.getPlans(),
          api.getUsers(),
        ]);
        setPlans(plansRes?.plans ?? []);
        setUsers(allUsers);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load plans");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const userMap = useMemo(() => buildUserNameMap(users), [users]);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) =>
      search
        ? plan.title.toLowerCase().includes(search.toLowerCase()) ||
          plan.id.toLowerCase().includes(search.toLowerCase()) ||
          (userMap[plan.created_by ?? ""] || "").toLowerCase().includes(search.toLowerCase())
        : true
    );
  }, [plans, search, userMap]);

  return (
    <ModeratorLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          Plans
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Plan List</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by plan, ID, or creator..."
              className="mb-4"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

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
                    </div>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Eye className="w-4 h-4" /> View
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No plans found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ModeratorLayout>
  );
};

export default AdminPlans;


